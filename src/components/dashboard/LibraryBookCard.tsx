import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import BookCoverImage from "@/components/catalog/BookCoverImage";

interface LibraryBookCardProps {
  book: {
    id: string;
    title: string;
    slug: string;
    authorName: string;
    coverImage: string | null;
  };
  purchasedAt: Date;
}

export default function LibraryBookCard({
  book,
  purchasedAt: _purchasedAt,
}: LibraryBookCardProps) {
  return (
    <Link href={`/read/${book.slug}`} className="block group">
      <Card className="overflow-hidden hover:shadow-md transition-shadow border border-border/50">
        <div className="relative overflow-hidden rounded-t-lg max-h-48">
          <BookCoverImage
            coverImage={book.coverImage}
            title={book.title}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif font-semibold text-sm line-clamp-2 text-foreground">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{book.authorName}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
