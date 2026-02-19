import EmptyLibrary from "@/components/dashboard/EmptyLibrary";
import LibraryBookCard from "@/components/dashboard/LibraryBookCard";
import { getUserPurchases } from "@/lib/purchase-queries";

type Purchases = Awaited<ReturnType<typeof getUserPurchases>>;

interface MyLibraryProps {
  purchases: Purchases;
}

export default function MyLibrary({ purchases }: MyLibraryProps) {
  if (purchases.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
        My Library
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {purchases.map((purchase) => (
          <LibraryBookCard
            key={purchase.id}
            book={purchase.book}
            purchasedAt={purchase.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
