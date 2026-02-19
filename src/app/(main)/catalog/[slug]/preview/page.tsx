import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPreviewChapter, getBookBySlug } from "@/lib/book-queries";
import { Separator } from "@/components/ui/separator";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) return {};

  return {
    title: `Preview: ${book.title} | ScienceOne`,
    description: `Read a free sample chapter from ${book.title}`,
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;
  const result = await getPreviewChapter(slug);

  if (!result) notFound();

  const { chapter, book } = result;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / context header */}
      <div className="mb-6">
        <Link
          href={`/catalog/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {book.title}
        </Link>
        <span className="text-sm text-muted-foreground mx-2">/</span>
        <span className="text-sm text-muted-foreground">Sample Chapter</span>
        <p className="text-sm text-muted-foreground mt-1">{book.authorName}</p>
      </div>

      {/* Chapter title */}
      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-8">
        {chapter.title}
      </h1>

      {/* Chapter content — pre-rendered KaTeX HTML from the ingest pipeline (trusted source) */}
      <div
        className="prose prose-slate max-w-none
          [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif
          [&_p]:leading-relaxed [&_p]:mb-4
          [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1
          [&_math]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: chapter.content ?? "" }}
      />

      {/* End-of-sample upsell section */}
      <Separator className="my-10" />

      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <h2 className="font-serif text-xl font-semibold mb-2">
          Continue Reading
        </h2>
        <p className="font-serif text-lg text-muted-foreground mb-4">
          {book.title}
        </p>

        {book.isOpenAccess ? (
          <>
            <p className="text-sm text-green-700 mb-4">
              This book is free to read
            </p>
            <Link
              href={`/catalog/${slug}`}
              className="text-sm underline underline-offset-4 hover:text-foreground"
            >
              View Book Details
            </Link>
          </>
        ) : (
          <>
            {book.pricing && (
              <p className="text-sm text-muted-foreground mb-4">
                ${Number(book.pricing.amount).toFixed(2)}
              </p>
            )}
            <Link
              href={`/catalog/${slug}`}
              className="text-sm underline underline-offset-4 hover:text-foreground"
            >
              View Book Details
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
