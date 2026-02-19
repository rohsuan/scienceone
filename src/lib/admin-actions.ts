"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

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

// ---- Book update schema and action ----

export const bookUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  authorName: z.string().min(1, "Author name is required"),
  authorBio: z.string().optional().nullable(),
  authorImage: z.string().optional().nullable(),
  synopsis: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  pageCount: z.number().int().positive().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  printLink: z.string().optional().nullable(),
  isOpenAccess: z.boolean(),
  price: z.number().nonnegative().optional().nullable(),
  categoryIds: z.array(z.string()),
});

export type BookUpdateData = z.infer<typeof bookUpdateSchema>;

export async function updateBook(bookId: string, data: BookUpdateData) {
  await requireAdmin();

  const validated = bookUpdateSchema.parse(data);

  // Update main book record
  await prisma.book.update({
    where: { id: bookId },
    data: {
      title: validated.title,
      slug: validated.slug,
      authorName: validated.authorName,
      authorBio: validated.authorBio ?? null,
      authorImage: validated.authorImage ?? null,
      synopsis: validated.synopsis ?? null,
      coverImage: validated.coverImage ?? null,
      isbn: validated.isbn ?? null,
      pageCount: validated.pageCount ?? null,
      dimensions: validated.dimensions ?? null,
      printLink: validated.printLink ?? null,
      isOpenAccess: validated.isOpenAccess,
    },
  });

  // Upsert pricing
  if (!validated.isOpenAccess && validated.price != null) {
    await prisma.bookPrice.upsert({
      where: { bookId },
      create: {
        bookId,
        amount: validated.price,
        currency: "USD",
      },
      update: {
        amount: validated.price,
      },
    });
  } else if (validated.isOpenAccess) {
    // Remove pricing when open access
    await prisma.bookPrice.deleteMany({ where: { bookId } });
  }

  // Sync categories: delete all then recreate
  await prisma.bookCategory.deleteMany({ where: { bookId } });
  if (validated.categoryIds.length > 0) {
    await prisma.bookCategory.createMany({
      data: validated.categoryIds.map((categoryId) => ({ bookId, categoryId })),
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/catalog");

  // Revalidate catalog detail page — find the book slug
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { slug: true } });
  if (book) {
    revalidatePath(`/catalog/${book.slug}`);
  }
}

// ---- Category actions ----

export async function createCategory(name: string) {
  await requireAdmin();

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const category = await prisma.category.create({
    data: { name: name.trim(), slug },
  });

  revalidatePath("/admin");
  return category;
}
