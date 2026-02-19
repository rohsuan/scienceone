import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookId, chapterId, scrollPercent } = body as {
    bookId: unknown;
    chapterId: unknown;
    scrollPercent: unknown;
  };

  if (
    typeof bookId !== "string" ||
    !bookId ||
    typeof chapterId !== "string" ||
    !chapterId ||
    typeof scrollPercent !== "number" ||
    scrollPercent < 0 ||
    scrollPercent > 100
  ) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.readingProgress.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId } },
    update: { chapterId, scrollPercent: Math.round(scrollPercent), updatedAt: new Date() },
    create: {
      userId: session.user.id,
      bookId,
      chapterId,
      scrollPercent: Math.round(scrollPercent),
    },
  });

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json(null);
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return Response.json(null);
  }

  const progress = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: session.user.id, bookId } },
  });

  return Response.json(progress);
}
