import prisma from "@/lib/prisma";

export async function getAllBooksAdmin() {
  return prisma.book.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { include: { category: true } },
      pricing: true,
      _count: { select: { chapters: true } },
    },
  });
}

export type BookAdminRow = Awaited<ReturnType<typeof getAllBooksAdmin>>[number];

export async function getBookAdmin(bookId: string) {
  return prisma.book.findUnique({
    where: { id: bookId },
    include: {
      categories: { include: { category: true } },
      pricing: true,
      chapters: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, slug: true, position: true },
      },
      _count: { select: { chapters: true } },
    },
  });
}

export type BookAdminDetail = NonNullable<Awaited<ReturnType<typeof getBookAdmin>>>;

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
