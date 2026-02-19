import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBookChapters, getReadingProgress } from "@/lib/reader-queries";

export default async function BookEntryPage({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const book = await getBookChapters(bookSlug);

  if (!book || book.chapters.length === 0) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  // Authenticated users are redirected to their last-read chapter
  if (session) {
    const progress = await getReadingProgress(session.user.id, book.id);
    if (progress) {
      const savedChapter = book.chapters.find(
        (ch) => ch.id === progress.chapterId
      );
      if (savedChapter) {
        redirect(`/read/${bookSlug}/${savedChapter.slug}`);
      }
    }
  }

  // Anonymous users and authenticated users with no progress go to chapter 1
  redirect(`/read/${bookSlug}/${book.chapters[0].slug}`);
}
