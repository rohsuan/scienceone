"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Library, FlaskConical, FileText, ArrowLeft } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  function navLink(href: string, label: string, icon?: React.ReactNode, exact = false) {
    const isActive = exact
      ? pathname === href
      : pathname.startsWith(href);

    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <aside className="w-64 border-r bg-background flex flex-col p-4">
      {/* Heading */}
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">ScienceOne</span>
        <Badge variant="secondary" className="text-xs">Admin</Badge>
      </div>

      <Separator className="mb-4" />

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {/* Books section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Books
          </p>
          {navLink("/admin", "All Books", <BookOpen className="h-4 w-4" />, true)}
        </div>

        {/* Resources section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Resources
          </p>
          {navLink("/admin/resources", "All Resources", <Library className="h-4 w-4" />)}
        </div>

        {/* Blog section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Blog
          </p>
          {navLink("/admin/blog", "Posts", <FileText className="h-4 w-4" />)}
        </div>
      </nav>

      <Separator className="my-4" />

      {/* Back to site */}
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Site
      </Link>
    </aside>
  );
}
