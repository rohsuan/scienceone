import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { createR2Client } from "@/lib/r2";

export async function POST(request: Request) {
  // Admin role check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bookId: string; fileName: string; contentType: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookId, fileName, contentType } = body;
  if (!bookId || !fileName || !contentType) {
    return NextResponse.json(
      { error: "bookId, fileName, and contentType are required" },
      { status: 400 }
    );
  }

  const r2Key = `uploads/manuscripts/${bookId}/${Date.now()}-${fileName}`;

  const url = await getSignedUrl(
    createR2Client(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 }
  );

  return NextResponse.json({ uploadUrl: url, r2Key });
}
