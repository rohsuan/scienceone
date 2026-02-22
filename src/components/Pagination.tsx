"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function createPageURL(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {currentPage > 1 && (
        <Button variant="outline" size="sm" asChild>
          <Link href={createPageURL(currentPage - 1)}>Previous</Link>
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Button variant="outline" size="sm" asChild>
          <Link href={createPageURL(currentPage + 1)}>Next</Link>
        </Button>
      )}
    </div>
  );
}
