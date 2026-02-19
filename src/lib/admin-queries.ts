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
