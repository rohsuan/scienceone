import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBooks, getCategories } from "@/lib/book-queries";
import BookCard from "@/components/catalog/BookCard";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import SearchInput from "@/components/catalog/SearchInput";

export const metadata: Metadata = {
  title: "Catalog | ScienceOne",
  description:
    "Browse our collection of STEM textbooks with mathematical formulas rendered for the web.",
};

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const category = params.category ? String(params.category) : undefined;
  const sort = params.sort ? String(params.sort) : undefined;
  const q = params.q ? String(params.q) : undefined;

  const [books, categories] = await Promise.all([
    getPublishedBooks({ category, sort, q }),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-bold mb-6">Browse Books</h1>

      <div className="flex flex-col gap-4 mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <SearchInput />
        </Suspense>

        <Suspense fallback={<div className="h-10" />}>
          <CatalogFilters categories={categories} />
        </Suspense>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {q ? (
            <>
              <p className="text-lg font-medium mb-2">
                No books match your search
              </p>
              <p className="text-sm mb-4">
                No results for &ldquo;{q}&rdquo;
              </p>
              <Link
                href="/catalog"
                className="text-sm underline underline-offset-4 hover:text-foreground"
              >
                Clear search
              </Link>
            </>
          ) : category ? (
            <p className="text-lg font-medium">No books in this category.</p>
          ) : (
            <p className="text-lg font-medium">No books available yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
