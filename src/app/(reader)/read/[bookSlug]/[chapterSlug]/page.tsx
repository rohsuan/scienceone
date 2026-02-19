import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  getChapter,
  getBookChapters,
  hasPurchased,
} from "@/lib/reader-queries";
import ChapterNav from "@/components/reader/ChapterNav";

interface PageProps {
  params: Promise<{ bookSlug: string; chapterSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  const chapter = await getChapter(bookSlug, chapterSlug);

  if (!chapter) {
    return { title: "Chapter Not Found | ScienceOne" };
  }

  return {
    title: `${chapter.title} — ${chapter.book.title} | ScienceOne`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookSlug, chapterSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const chapter = await getChapter(bookSlug, chapterSlug);

  if (!chapter) {
    notFound();
  }

  const canRead =
    chapter.book.isOpenAccess ||
    chapter.isFreePreview ||
    (session ? await hasPurchased(session.user.id, chapter.book.id) : false);

  if (!canRead) {
    redirect(`/catalog/${chapter.book.slug}?access=required`);
  }

  // Fetch book chapters for navigation (React.cache deduplicates with layout call)
  const book = await getBookChapters(bookSlug);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
      {/* Chapter title */}
      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-8 max-w-3xl mx-auto">
        {chapter.title}
      </h1>

      {/* Chapter content — pre-rendered KaTeX HTML (trusted) */}
      <article
        className="
          prose prose-slate max-w-3xl mx-auto
          [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif
          [&_p]:leading-relaxed
          [&_.katex-display]:overflow-x-auto
          [&_.katex-display]:overflow-y-hidden
          [&_.katex-display]:pb-2
        "
        dangerouslySetInnerHTML={{ __html: chapter.content ?? "" }}
      />

      {/* Prev/Next chapter navigation */}
      {book && (
        <ChapterNav
          bookSlug={bookSlug}
          chapters={book.chapters}
          currentChapterSlug={chapterSlug}
        />
      )}
    </div>
  );
}
