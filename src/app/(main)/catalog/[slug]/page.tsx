import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import { getBookBySlug } from "@/lib/book-queries";
import { auth } from "@/lib/auth";
import { hasPurchasedBySlug } from "@/lib/purchase-queries";
import BookCoverImage from "@/components/catalog/BookCoverImage";
import CategoryBadge from "@/components/catalog/CategoryBadge";
import TableOfContents from "@/components/catalog/TableOfContents";
import BuyButton from "@/components/catalog/BuyButton";
import DownloadButton from "@/components/catalog/DownloadButton";
import CitationExport from "@/components/catalog/CitationExport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CitationData } from "@/lib/citation";

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) return {};

  return {
    title: `${book.title} | ScienceOne`,
    description: book.synopsis ?? undefined,
    openGraph: {
      title: book.title,
      description: book.synopsis ?? undefined,
      images: book.coverImage ? [book.coverImage] : [],
    },
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const purchased = session
    ? await hasPurchasedBySlug(session.user.id, book.slug)
    : false;

  const citationData: CitationData = {
    title: book.title,
    authorName: book.authorName,
    isbn: book.isbn,
    slug: book.slug,
    publishYear: book.publishYear,
    createdAt: book.createdAt,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.authorName },
    isbn: book.isbn ?? undefined,
    numberOfPages: book.pageCount ?? undefined,
    description: book.synopsis ?? undefined,
    publisher: { "@type": "Organization", name: "ScienceOne" },
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com"}/catalog/${book.slug}`,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
        {/* Left column: cover + pricing */}
        <div className="flex flex-col gap-4">
          <BookCoverImage coverImage={book.coverImage} title={book.title} />

          {/* Pricing */}
          <div className="flex flex-col gap-2">
            {book.isOpenAccess ? (
              <>
                <Badge className="w-fit bg-green-600 hover:bg-green-700 text-white">
                  Open Access
                </Badge>
                <Button className="w-full" asChild>
                  <Link href={`/read/${book.slug}`}>Read Free</Link>
                </Button>
              </>
            ) : book.pricing ? (
              <>
                <p className="text-sm text-muted-foreground">
                  ${Number(book.pricing.amount).toFixed(2)}
                </p>
                {purchased ? (
                  <Button className="w-full" asChild>
                    <Link href={`/read/${book.slug}`}>Read Now</Link>
                  </Button>
                ) : session ? (
                  <BuyButton
                    bookId={book.id}
                    price={Number(book.pricing.amount)}
                  />
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={`/sign-in?redirect=/catalog/${book.slug}`}>
                      Sign In to Purchase
                    </Link>
                  </Button>
                )}
              </>
            ) : null}

            {/* Download buttons — only for users with access */}
            {((book.isOpenAccess && session) || purchased) &&
              (book.pdfKey || book.epubKey) && (
                <div className="flex flex-col gap-2">
                  {book.pdfKey && (
                    <DownloadButton bookSlug={book.slug} format="pdf" />
                  )}
                  {book.epubKey && (
                    <DownloadButton bookSlug={book.slug} format="epub" />
                  )}
                </div>
              )}

            {/* Read Sample button */}
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href={`/catalog/${book.slug}/preview`}>Read Sample</Link>
            </Button>
          </div>
        </div>

        {/* Right column: book info */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            {book.title}
          </h1>

          {/* Author */}
          <p className="text-lg text-muted-foreground mb-1">
            {book.authorName}
          </p>
          {book.authorBio && (
            <p className="text-sm text-muted-foreground mb-4">
              {book.authorBio}
            </p>
          )}

          {/* Categories */}
          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {book.categories.map(({ category }) => (
                <CategoryBadge key={category.id} name={category.name} />
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Synopsis */}
          {book.synopsis && (
            <>
              <h2 className="font-serif text-xl font-semibold mb-2">
                About This Book
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {book.synopsis}
              </p>
            </>
          )}

          {/* Table of Contents */}
          {book.chapters.length > 0 && (
            <TableOfContents chapters={book.chapters} />
          )}

          {/* Print metadata */}
          {(book.isbn || book.pageCount || book.dimensions || book.printLink) && (
            <>
              <Separator className="my-6" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {book.isbn && (
                  <>
                    <dt className="font-medium text-foreground">ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </>
                )}
                {book.pageCount && (
                  <>
                    <dt className="font-medium text-foreground">Pages</dt>
                    <dd>{book.pageCount}</dd>
                  </>
                )}
                {book.dimensions && (
                  <>
                    <dt className="font-medium text-foreground">Dimensions</dt>
                    <dd>{book.dimensions}</dd>
                  </>
                )}
                {book.printLink && (
                  <>
                    <dt className="font-medium text-foreground">Print Edition</dt>
                    <dd>
                      <a
                        href={book.printLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        Buy Print Edition
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </>
          )}

          {/* Citation export */}
          <Separator className="my-6" />
          <CitationExport book={citationData} />
        </div>
      </div>
    </div>
  );
}
