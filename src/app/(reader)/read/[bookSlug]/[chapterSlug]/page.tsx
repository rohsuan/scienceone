import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  getChapter,
  getBookChapters,
  hasPurchased,
  getReadingProgress,
} from "@/lib/reader-queries";
import ChapterNav from "@/components/reader/ChapterNav";
import ScrollProgressTracker from "@/components/reader/ScrollProgressTracker";
import ReadingProgressBar from "@/components/reader/ReadingProgressBar";
import CodeBlockEnhancer from "@/components/reader/CodeBlockEnhancer";
import { highlightCodeBlocks } from "@/lib/highlight-code";

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

  // Load reading progress to restore scroll position for authenticated users
  let scrollPercent: number | undefined;
  if (session) {
    const progress = await getReadingProgress(session.user.id, chapter.book.id);
    // Only restore scroll if we're on the exact saved chapter
    if (progress && progress.chapterId === chapter.id) {
      scrollPercent = progress.scrollPercent;
    }
  }

  const highlightedContent = await highlightCodeBlocks(chapter.content ?? "");

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
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
      <CodeBlockEnhancer />

      {/* Prev/Next chapter navigation */}
      {book && (
        <ChapterNav
          bookSlug={bookSlug}
          chapters={book.chapters}
          currentChapterSlug={chapterSlug}
        />
      )}

      {/* Scroll tracker: saves progress with 2s debounce and restores scroll on mount */}
      <ScrollProgressTracker
        key={chapter.id}
        bookId={chapter.book.id}
        chapterId={chapter.id}
        isAuthenticated={!!session}
        initialScrollPercent={scrollPercent}
      />

      {/* Visual progress bar at top of content area */}
      <ReadingProgressBar />
    </div>
  );
}
