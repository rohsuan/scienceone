"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { bookUpdateSchema, type BookUpdateData, chapterContentUpdateSchema } from "@/lib/admin-schemas";
import DOMPurify from "isomorphic-dompurify";

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

// ---- Book update action ----

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
      publishYear: validated.publishYear ?? null,
      dimensions: validated.dimensions ?? null,
      printLink: validated.printLink ?? null,
      isOpenAccess: validated.isOpenAccess,
      pdfKey: validated.pdfKey ?? null,
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

// ---- Chapter content update action ----

export async function updateChapterContent(
  bookId: string,
  chapterSlug: string,
  data: { content: string },
) {
  try {
    await requireAdmin();

    const validated = chapterContentUpdateSchema.parse(data);

    // Sanitize HTML — allow KaTeX markup and data attributes
    const clean = DOMPurify.sanitize(validated.content, {
      ADD_TAGS: [
        "math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub",
        "mfrac", "mover", "munder", "msqrt", "mroot", "mtable", "mtr",
        "mtd", "annotation", "mspace", "mtext", "menclose", "mpadded",
      ],
      ADD_ATTR: ["data-*", "encoding", "xmlns", "mathvariant", "stretchy", "fence", "separator"],
      ALLOW_DATA_ATTR: true,
    });

    // Ownership check: verify chapter belongs to this book
    const chapter = await prisma.chapter.findFirst({
      where: { slug: chapterSlug, bookId },
      select: { id: true, book: { select: { slug: true } } },
    });
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    await prisma.chapter.update({
      where: { id: chapter.id },
      data: { content: clean },
    });

    // Revalidate admin preview + reader paths
    revalidatePath(`/admin/books/${bookId}/preview/${chapterSlug}`);
    revalidatePath(`/admin/books/${bookId}/chapters/${chapterSlug}/edit`);
    revalidatePath(`/read/${chapter.book.slug}/${chapterSlug}`);
  } catch (err) {
    console.error("updateChapterContent failed:", err);
    throw err;
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
