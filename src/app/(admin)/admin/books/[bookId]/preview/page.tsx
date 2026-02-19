import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBookChaptersAdmin } from "@/lib/admin-queries";

interface Props {
  params: Promise<{ bookId: string }>;
}

export default async function BookPreviewPage({ params }: Props) {
  // Defense-in-depth: check admin role again (layout also checks)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { bookId } = await params;
  const book = await getBookChaptersAdmin(bookId);

  if (!book) {
    redirect("/admin");
  }

  if (book.chapters.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Preview — {book.title}
        </h1>
        <div className="rounded-lg border p-8 text-center space-y-3">
          <p className="text-muted-foreground">
            No chapters available. Upload and ingest a manuscript first.
          </p>
          <Link
            href={`/admin/books/${bookId}/ingest`}
            className="text-sm text-blue-600 hover:underline"
          >
            Go to Ingest page →
          </Link>
        </div>
      </div>
    );
  }

  // Redirect to first chapter
  redirect(`/admin/books/${bookId}/preview/${book.chapters[0].slug}`);
}
