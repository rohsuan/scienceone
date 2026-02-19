import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

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
