import prisma from '@/lib/prisma';

/**
 * Look up a Book by ID for use before running the ingest pipeline.
 * Returns id, slug, and title if found; null otherwise.
 */
export async function getBookForIngest(
  bookId: string,
): Promise<{ id: string; slug: string; title: string } | null> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, slug: true, title: true },
  });
  return book;
}

/**
 * Write chapters to the database for a given book.
 *
 * This is idempotent for re-ingest: all existing chapters for the book
 * are deleted first, then new chapters are created in the same transaction.
 *
 * @param bookId   - The Book record ID
 * @param chapters - Array of chapter data (title, slug, content, position)
 * @returns        - Count of chapters created
 */
export async function writeChapters(
  bookId: string,
  chapters: Array<{
    title: string;
    slug: string;
    content: string;
    position: number;
  }>,
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing chapters for this book (re-ingest scenario)
    await tx.chapter.deleteMany({ where: { bookId } });

    // Create new chapters — first chapter (position 0) is always free preview
    const created = await tx.chapter.createMany({
      data: chapters.map((ch) => ({
        bookId,
        title: ch.title,
        slug: ch.slug,
        content: ch.content,
        position: ch.position,
        isFreePreview: ch.position === 0,
      })),
    });

    return created.count;
  });

  return result;
}

/**
 * Update a Book record with R2 artifact storage keys.
 *
 * Only updates non-null fields — pass null to leave a field unchanged.
 *
 * @param bookId  - The Book record ID
 * @param pdfKey  - R2 key for the PDF (e.g. "books/my-book/my-book.pdf") or null to skip
 * @param epubKey - R2 key for the EPUB (e.g. "books/my-book/my-book.epub") or null to skip
 */
export async function updateBookArtifacts(
  bookId: string,
  pdfKey: string | null,
  epubKey: string | null,
): Promise<void> {
  await prisma.book.update({
    where: { id: bookId },
    data: {
      ...(pdfKey && { pdfKey }),
      ...(epubKey && { epubKey }),
    },
  });
}
