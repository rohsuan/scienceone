"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MobileTocDrawer from "@/components/reader/MobileTocDrawer";
import { ChapterSummary } from "@/components/reader/TocSidebar";

interface ReaderTopBarProps {
  bookTitle: string;
  bookSlug: string;
  chapters: ChapterSummary[];
}

export default function ReaderTopBar({
  bookTitle,
  bookSlug,
  chapters,
}: ReaderTopBarProps) {
  return (
    <header className="flex items-center h-12 px-4 border-b border-border bg-white flex-shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MobileTocDrawer
          chapters={chapters}
          bookSlug={bookSlug}
          bookTitle={bookTitle}
        />
        <Link
          href={`/catalog/${bookSlug}`}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="font-serif text-sm truncate">{bookTitle}</span>
        </Link>
      </div>
    </header>
  );
}
