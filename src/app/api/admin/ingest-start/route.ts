import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  // Admin role check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bookId: string; r2Key: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookId, r2Key } = body;
  if (!bookId || !r2Key) {
    return NextResponse.json(
      { error: "bookId and r2Key are required" },
      { status: 400 }
    );
  }

  // Create IngestJob record with status "pending"
  const job = await prisma.ingestJob.create({
    data: { bookId, r2Key, status: "pending" },
  });

  // Spawn detached child process for the ingest pipeline
  const proc = spawn(
    "npx",
    [
      "tsx",
      "scripts/ingest.ts",
      "--book-id",
      bookId,
      "--r2-key",
      r2Key,
      "--job-id",
      job.id,
    ],
    { detached: true, stdio: "ignore", cwd: process.cwd() }
  );
  proc.unref();

  // Update status to "processing"
  await prisma.ingestJob.update({
    where: { id: job.id },
    data: { status: "processing" },
  });

  return NextResponse.json({ jobId: job.id });
}
