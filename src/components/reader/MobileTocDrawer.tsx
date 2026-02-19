"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import TocSidebar, { ChapterSummary } from "@/components/reader/TocSidebar";

interface MobileTocDrawerProps {
  chapters: ChapterSummary[];
  bookSlug: string;
  bookTitle: string;
}

export default function MobileTocDrawer({
  chapters,
  bookSlug,
  bookTitle,
}: MobileTocDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Open table of contents"
      >
        <Menu className="h-5 w-5" />
      </button>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="font-serif text-sm text-left">
            {bookTitle}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">
          <TocSidebar
            chapters={chapters}
            bookSlug={bookSlug}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
