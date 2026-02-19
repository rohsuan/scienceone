"use client";

// Placeholder — fully implemented in Task 2
import { BookAdminDetail } from "@/lib/admin-queries";

interface BookEditFormProps {
  book: BookAdminDetail;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function BookEditForm({ book, categories: _categories }: BookEditFormProps) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">Loading editor for {book.title}…</p>
    </div>
  );
}
