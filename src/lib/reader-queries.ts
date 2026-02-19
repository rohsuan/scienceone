import { cache } from "react";
import prisma from "@/lib/prisma";

export const getBookChapters = cache(async (bookSlug: string) => {
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      isOpenAccess: true,
      pdfKey: true,   // for download button visibility in reader header
      epubKey: true,  // for download button visibility in reader header
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
    },
  });

  return book ?? null;
});

export const getChapter = cache(
  async (bookSlug: string, chapterSlug: string) => {
    return prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        book: { slug: bookSlug, isPublished: true },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            isOpenAccess: true,
          },
        },
      },
    });
  }
);

export const hasPurchased = cache(
  async (userId: string, bookId: string): Promise<boolean> => {
    const result = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    return !!result;
  }
);

export const getReadingProgress = cache(
  async (userId: string, bookId: string) => {
    return prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
  }
);
