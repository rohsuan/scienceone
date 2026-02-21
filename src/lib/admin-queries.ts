import prisma from "@/lib/prisma";

export async function getAllBooksAdmin() {
  const books = await prisma.book.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { include: { category: true } },
      pricing: true,
      _count: { select: { chapters: true } },
    },
  });
  return books.map((book) => ({
    ...book,
    pricing: book.pricing
      ? { ...book.pricing, amount: Number(book.pricing.amount) }
      : null,
  }));
}

export type BookAdminRow = Awaited<ReturnType<typeof getAllBooksAdmin>>[number];

export async function getBookAdmin(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      slug: true,
      authorName: true,
      authorBio: true,
      authorImage: true,
      synopsis: true,
      coverImage: true,
      isbn: true,
      pageCount: true,
      publishYear: true,
      dimensions: true,
      printLink: true,
      isOpenAccess: true,
      isPublished: true,
      pdfKey: true,
      updatedAt: true,
      createdAt: true,
      categories: { include: { category: true } },
      pricing: true,
      chapters: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, slug: true, position: true },
      },
      _count: { select: { chapters: true } },
      ingestJobs: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { r2Key: true },
      },
    },
  });
  if (!book) return null;
  const { ingestJobs, ...rest } = book;
  return {
    ...rest,
    pricing: book.pricing
      ? { ...book.pricing, amount: Number(book.pricing.amount) }
      : null,
    manuscriptKey: ingestJobs[0]?.r2Key ?? null,
  };
}

export type BookAdminDetail = NonNullable<Awaited<ReturnType<typeof getBookAdmin>>>;

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getBookChaptersAdmin(bookId: string) {
  return prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      chapters: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, slug: true, position: true },
      },
    },
  });
}

export async function getChapterAdmin(bookId: string, chapterSlug: string) {
  return prisma.chapter.findFirst({
    where: { slug: chapterSlug, bookId },
    include: {
      book: { select: { id: true, title: true, slug: true, isPublished: true } },
    },
  });
}

export async function getLatestIngestJob(bookId: string) {
  return prisma.ingestJob.findFirst({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });
}
