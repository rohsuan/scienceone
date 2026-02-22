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
  const { bookId, resourceId, fileName, type } = body as {
    bookId?: string;
    resourceId?: string;
    fileName: string;
    type: "cover" | "author" | "pdf" | "resource-cover" | "resource-file" | "blog-cover" | "blog-author";
  };

  const entityId = bookId || resourceId;
  if (!entityId || !fileName || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTypes = ["cover", "author", "pdf", "resource-cover", "resource-file", "blog-cover", "blog-author"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Build R2 key and content type based on upload type
  let r2Key: string;
  let contentType: string;

  if (type === "pdf") {
    r2Key = `books/${entityId}/${entityId}-${Date.now()}.pdf`;
    contentType = "application/pdf";
  } else if (type === "resource-cover") {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    r2Key = `images/resources/${entityId}/cover-${Date.now()}.${extension}`;
    contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
  } else if (type === "resource-file") {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
    r2Key = `resources/${entityId}/${Date.now()}.${extension}`;
    // Determine content type from extension
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      zip: "application/zip",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      tex: "application/x-tex",
      ipynb: "application/x-ipynb+json",
    };
    contentType = mimeTypes[extension] ?? "application/octet-stream";
  } else if (type === "blog-cover" || type === "blog-author") {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const subtype = type === "blog-cover" ? "cover" : "author";
    r2Key = `images/blog/${entityId}/${subtype}-${Date.now()}.${extension}`;
    contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
  } else {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    r2Key = `images/${entityId}/${type}-${Date.now()}.${extension}`;
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
