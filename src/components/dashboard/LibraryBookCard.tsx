import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import BookCoverImage from "@/components/catalog/BookCoverImage";
import DownloadDropdown from "@/components/catalog/DownloadDropdown";

interface LibraryBookCardProps {
  book: {
    id: string;
    title: string;
    slug: string;
    authorName: string;
    coverImage: string | null;
  };
  purchasedAt: Date;
  hasPdf: boolean;
  hasEpub: boolean;
}

export default function LibraryBookCard({
  book,
  purchasedAt: _purchasedAt,
  hasPdf,
  hasEpub,
}: LibraryBookCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border border-border/50">
      <Link href={`/read/${book.slug}`} className="block group">
        <div className="relative overflow-hidden rounded-t-lg max-h-48">
          <BookCoverImage coverImage={book.coverImage} title={book.title} />
        </div>
        <CardContent className="p-4 pb-2">
          <h3 className="font-serif font-semibold text-sm line-clamp-2 text-foreground">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{book.authorName}</p>
        </CardContent>
      </Link>
      {(hasPdf || hasEpub) && (
        <div className="px-4 pb-3">
          <DownloadDropdown
            bookSlug={book.slug}
            hasPdf={hasPdf}
            hasEpub={hasEpub}
            variant="ghost"
            size="sm"
          />
        </div>
      )}
    </Card>
  );
}
