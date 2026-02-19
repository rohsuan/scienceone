import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function getBookBySlug(slug: string) {
  return prisma.book.findUnique({
    where: { slug, isPublished: true },
    include: {
      chapters: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          position: true,
          isFreePreview: true,
        },
      },
      categories: {
        include: { category: true },
      },
      pricing: true,
    },
  });
}

export async function getPreviewChapter(slug: string) {
  // Try to find a chapter explicitly marked as free preview
  let chapter = await prisma.chapter.findFirst({
    where: {
      book: { slug, isPublished: true },
      isFreePreview: true,
    },
    orderBy: { position: "asc" },
    include: {
      book: {
        select: {
          title: true,
          slug: true,
          authorName: true,
          isOpenAccess: true,
          pricing: true,
        },
      },
    },
  });

  // Fallback: use the first chapter (position 1) if no isFreePreview chapter found
  if (!chapter) {
    chapter = await prisma.chapter.findFirst({
      where: {
        book: { slug, isPublished: true },
        position: 1,
      },
      include: {
        book: {
          select: {
            title: true,
            slug: true,
            authorName: true,
            isOpenAccess: true,
            pricing: true,
          },
        },
      },
    });
  }

  if (!chapter) return null;

  return {
    chapter,
    book: chapter.book,
  };
}

interface GetPublishedBooksParams {
  category?: string;
  sort?: string;
  q?: string;
}

export async function getPublishedBooks({
  category,
  sort,
  q,
}: GetPublishedBooksParams = {}) {
  const where: Prisma.BookWhereInput = {
    isPublished: true,
  };

  if (category) {
    where.categories = {
      some: {
        category: {
          slug: category,
        },
      },
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
      {
        categories: {
          some: {
            category: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  let orderBy: Prisma.BookOrderByWithRelationInput;
  if (sort === "author") {
    orderBy = { authorName: "asc" };
  } else if (sort === "date") {
    orderBy = { createdAt: "desc" };
  } else {
    orderBy = { title: "asc" };
  }

  const books = await prisma.book.findMany({
    where,
    orderBy,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      pricing: true,
    },
  });

  return books;
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}
