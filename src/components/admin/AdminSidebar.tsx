import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function AdminSidebar() {
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
      <nav className="flex-1 space-y-1">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
        >
          Books
        </Link>
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
