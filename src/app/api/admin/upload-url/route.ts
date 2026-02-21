import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createR2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  // Verify admin role
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bookId, fileName, type } = body as {
    bookId: string;
    fileName: string;
    type: "cover" | "author" | "pdf";
  };

  if (!bookId || !fileName || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (type !== "cover" && type !== "author" && type !== "pdf") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Build R2 key and content type based on upload type
  let r2Key: string;
  let contentType: string;

  if (type === "pdf") {
    r2Key = `books/${bookId}/${bookId}-${Date.now()}.pdf`;
    contentType = "application/pdf";
  } else {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    r2Key = `images/${bookId}/${type}-${Date.now()}.${extension}`;
    contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
  }

  const r2Client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: r2Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return NextResponse.json({ uploadUrl, r2Key });
}
