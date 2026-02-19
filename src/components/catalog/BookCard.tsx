import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BookCoverImage from "./BookCoverImage";
import CategoryBadge from "./CategoryBadge";

interface BookCardProps {
  book: {
    id: string;
    slug: string;
    title: string;
    authorName: string;
    coverImage: string | null;
    isOpenAccess: boolean;
    categories: {
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
    pricing: {
      amount: import("@prisma/client/runtime/client").Decimal;
      currency: string;
    } | null;
  };
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/catalog/${book.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden gap-0 py-0 transition-shadow group-hover:shadow-md">
        <BookCoverImage coverImage={book.coverImage} title={book.title} />
        <div className="p-4 flex flex-col gap-2">
          <h2 className="font-serif font-semibold leading-snug line-clamp-2 text-sm">
            {book.title}
          </h2>
          <p className="text-xs text-muted-foreground">{book.authorName}</p>
          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.categories.slice(0, 3).map(({ category }) => (
                <CategoryBadge key={category.id} name={category.name} />
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            {book.isOpenAccess ? (
              <Badge variant="secondary" className="rounded-full text-xs bg-green-100 text-green-700 border-green-200">
                Open Access
              </Badge>
            ) : book.pricing ? (
              <span className="text-xs text-muted-foreground">
                ${Number(book.pricing.amount).toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
