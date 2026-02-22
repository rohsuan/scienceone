import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createR2Client } from "@/lib/r2";

// In-memory rate limiter
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("resourceId");

  if (!resourceId) {
    return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      fileKey: true,
      fileName: true,
      isFree: true,
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  if (!resource.fileKey) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  // Auth check — required for paid resources
  const session = await auth.api.getSession({ headers: await headers() });

  if (!resource.isFree) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchase = await prisma.resourcePurchase.findUnique({
      where: {
        userId_resourceId: { userId: session.user.id, resourceId: resource.id },
      },
      select: { id: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }
  }

  // Rate limiting
  const rateLimitKey = session
    ? `${session.user.id}:resource:${resourceId}`
    : `anon:resource:${resourceId}`;
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Generate presigned URL (15 min expiry)
  const extension = resource.fileKey.split(".").pop() ?? "bin";
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  const contentType = mimeTypes[extension] ?? "application/octet-stream";
  const downloadName = resource.fileName ?? `${resource.slug}.${extension}`;

  const url = await getSignedUrl(
    createR2Client(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: resource.fileKey,
      ResponseContentDisposition: `attachment; filename="${downloadName}"`,
      ResponseContentType: contentType,
    }),
    { expiresIn: 900 }
  );

  return NextResponse.json({ url });
}
