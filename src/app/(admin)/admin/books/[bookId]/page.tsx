import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBookAdmin, getAllCategories } from "@/lib/admin-queries";
import BookEditForm from "@/components/admin/BookEditForm";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = await getBookAdmin(bookId);
  return {
    title: book ? `Edit: ${book.title} — Admin | ScienceOne` : "Edit Book — Admin | ScienceOne",
  };
}

export default async function BookEditPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  // Defense-in-depth: check admin role (layout also checks)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { bookId } = await params;

  const [book, categories] = await Promise.all([
    getBookAdmin(bookId),
    getAllCategories(),
  ]);

  if (!book) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Books
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit book metadata and publishing settings
        </p>
      </div>

      <BookEditForm book={book} categories={categories} />
    </div>
  );
}
