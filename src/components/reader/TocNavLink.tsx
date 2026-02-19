"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

interface TocNavLinkProps {
  href: string;
  chapterSlug: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

export default function TocNavLink({
  href,
  chapterSlug,
  children,
  onNavigate,
}: TocNavLinkProps) {
  const segment = useSelectedLayoutSegment();
  const isActive = segment === chapterSlug;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}
