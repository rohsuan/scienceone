import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createR2Client } from "@/lib/r2";

// In-memory rate limiter: keyed by `${userId}:${bookSlug}:${format}`
const downloadRequests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = downloadRequests.get(key);
  if (!record || now > record.resetAt) {
    downloadRequests.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function GET(request: Request) {
  // a. Parse and validate params
  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");
  const format = searchParams.get("format");

  if (!bookSlug) {
    return NextResponse.json({ error: "bookSlug is required" }, { status: 400 });
  }
  if (format !== "pdf" && format !== "epub") {
    return NextResponse.json(
      { error: "format must be pdf or epub" },
      { status: 400 }
    );
  }

  // b. Fetch book (need isOpenAccess to decide auth requirement)
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      pdfKey: true,
      epubKey: true,
      isOpenAccess: true,
    },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // c. Auth check — only required for non-open-access books
  const session = await auth.api.getSession({ headers: await headers() });
  if (!book.isOpenAccess && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // d. Entitlement check — only for paid books
  if (!book.isOpenAccess) {
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_bookId: { userId: session!.user.id, bookId: book.id },
      },
      select: { id: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }
  }

  // e. Rate limiting — userId for authenticated users, IP for anonymous
  const rateLimitKey = session
    ? `${session.user.id}:${bookSlug}:${format}`
    : `anon:${getClientIp(request)}:${bookSlug}:${format}`;
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // f. Artifact check
  const key = format === "pdf" ? book.pdfKey : book.epubKey;
  if (!key) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  // g. Generate presigned URL (15 min expiry)
  const contentType =
    format === "pdf" ? "application/pdf" : "application/epub+zip";
  const url = await getSignedUrl(
    createR2Client(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${book.slug}.${format}"`,
      ResponseContentType: contentType,
    }),
    { expiresIn: 900 }
  );

  // h. Audit log — only for authenticated users (Download.userId is non-nullable)
  if (session) {
    void prisma.download.create({
      data: { userId: session.user.id, bookId: book.id, format },
    });
  }

  // i. Return presigned URL
  return NextResponse.json({ url });
}
