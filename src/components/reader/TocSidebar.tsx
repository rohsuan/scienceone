"use client";

import TocNavLink from "@/components/reader/TocNavLink";

export interface ChapterSummary {
  id: string;
  title: string;
  slug: string;
  position: number;
  isFreePreview: boolean;
}

interface TocSidebarProps {
  chapters: ChapterSummary[];
  bookSlug: string;
  onNavigate?: () => void;
}

export default function TocSidebar({
  chapters,
  bookSlug,
  onNavigate,
}: TocSidebarProps) {
  return (
    <nav className="px-3 py-4 space-y-1">
      <ul>
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <TocNavLink
              href={`/read/${bookSlug}/${chapter.slug}`}
              chapterSlug={chapter.slug}
              onNavigate={onNavigate}
            >
              <span className="text-xs text-muted-foreground mr-2">
                {chapter.position}.
              </span>
              {chapter.title}
            </TocNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
