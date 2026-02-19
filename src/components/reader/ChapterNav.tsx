import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChapterNavProps {
  bookSlug: string;
  chapters: Array<{ slug: string; title: string; position: number }>;
  currentChapterSlug: string;
}

export default function ChapterNav({
  bookSlug,
  chapters,
  currentChapterSlug,
}: ChapterNavProps) {
  const currentIndex = chapters.findIndex((c) => c.slug === currentChapterSlug);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <nav className="max-w-3xl mx-auto mt-12 pt-6 border-t border-border flex items-center justify-between">
      {prevChapter ? (
        <Link
          href={`/read/${bookSlug}/${prevChapter.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <div>
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="font-medium">{prevChapter.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {nextChapter ? (
        <Link
          href={`/read/${bookSlug}/${nextChapter.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
        >
          <div>
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="font-medium">{nextChapter.title}</div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
