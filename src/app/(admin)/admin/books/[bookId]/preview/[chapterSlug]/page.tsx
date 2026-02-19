import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getChapterAdmin, getBookChaptersAdmin } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ bookId: string; chapterSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { bookId, chapterSlug } = await params;
  const chapter = await getChapterAdmin(bookId, chapterSlug);
  return {
    title: chapter ? `${chapter.title} — Preview | Admin` : "Preview | Admin",
  };
}

export default async function AdminChapterPreviewPage({ params }: Props) {
  // Defense-in-depth: check admin role again (layout also checks)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { bookId, chapterSlug } = await params;

  // Fetch chapter (NO isPublished filter — admin can preview all chapters)
  const [chapter, book] = await Promise.all([
    getChapterAdmin(bookId, chapterSlug),
    getBookChaptersAdmin(bookId),
  ]);

  if (!chapter || !book) {
    redirect(`/admin/books/${bookId}/preview`);
  }

  const chapters = book.chapters;
  const currentIndex = chapters.findIndex((c) => c.slug === chapterSlug);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="flex gap-8">
      {/* Chapter list sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Chapters
          </p>
          <nav className="space-y-1">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/admin/books/${bookId}/preview/${ch.slug}`}
                className={[
                  "block rounded px-3 py-1.5 text-sm transition-colors",
                  ch.slug === chapterSlug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {ch.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Unpublished banner */}
        {!book.isPublished && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <strong>Admin Preview</strong> — this book is not published and is not visible to readers.
          </div>
        )}

        {/* Breadcrumb + header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Books</Link>
            <span>/</span>
            <Link href={`/admin/books/${bookId}`} className="hover:text-foreground">
              {book.title}
            </Link>
            <span>/</span>
            <span className="text-foreground">Preview</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{chapter.title}</h1>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{book.title}</p>
        </div>

        {/* Chapter content — trusted HTML from our ingest pipeline */}
        {chapter.content ? (
          <div
            className="prose prose-lg max-w-3xl [&_.katex-display]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: chapter.content }}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            This chapter has no content.
          </div>
        )}

        {/* Prev/Next navigation */}
        <div className="mt-10 flex items-center justify-between border-t pt-6">
          {prevChapter ? (
            <Link
              href={`/admin/books/${bookId}/preview/${prevChapter.slug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{prevChapter.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              href={`/admin/books/${bookId}/preview/${nextChapter.slug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <span>{nextChapter.title}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Mobile chapter navigation select */}
        <div className="mt-4 lg:hidden">
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={chapterSlug}
            onChange={(e) => {
              window.location.href = `/admin/books/${bookId}/preview/${e.target.value}`;
            }}
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.slug}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
