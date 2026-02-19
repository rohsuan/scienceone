"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogFiltersProps {
  categories: Category[];
}

export default function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "title";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentCategory === "" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setParam("category", null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={currentCategory === cat.slug ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setParam("category", cat.slug)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="shrink-0">
        <select
          value={currentSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-md border bg-background text-sm px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sort books by"
        >
          <option value="title">Title A-Z</option>
          <option value="date">Newest First</option>
          <option value="author">Author A-Z</option>
        </select>
      </div>
    </div>
  );
}
