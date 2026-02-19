import { notFound } from "next/navigation";
import { getBookChapters } from "@/lib/reader-queries";
import ReaderTopBar from "@/components/reader/ReaderTopBar";
import TocSidebar from "@/components/reader/TocSidebar";

export default async function BookReaderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const book = await getBookChapters(bookSlug);

  if (!book) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ReaderTopBar
        bookTitle={book.title}
        bookSlug={bookSlug}
        chapters={book.chapters}
        hasPdf={!!book.pdfKey}
        hasEpub={!!book.epubKey}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col border-r border-border overflow-y-auto bg-muted/30">
          <TocSidebar chapters={book.chapters} bookSlug={bookSlug} />
        </aside>
        <main id="reader-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
