"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function togglePublish(bookId: string, publish: boolean) {
  await requireAdmin();

  await prisma.book.update({
    where: { id: bookId },
    data: { isPublished: publish },
  });

  revalidatePath("/admin");
  revalidatePath("/catalog");
}

export async function createBook(data: {
  title: string;
  slug: string;
  authorName: string;
}) {
  await requireAdmin();

  const book = await prisma.book.create({
    data: {
      title: data.title,
      slug: data.slug,
      authorName: data.authorName,
      isPublished: false,
    },
  });

  revalidatePath("/admin");
  return book.id;
}

export async function deleteBook(bookId: string) {
  await requireAdmin();

  await prisma.book.delete({
    where: { id: bookId },
  });

  revalidatePath("/admin");
  revalidatePath("/catalog");
}
