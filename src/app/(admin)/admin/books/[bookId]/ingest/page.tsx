import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBookAdmin, getLatestIngestJob } from "@/lib/admin-queries";
import IngestUploader from "@/components/admin/IngestUploader";
import IngestStatus from "@/components/admin/IngestStatus";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DownloadFileButton from "@/components/admin/DownloadFileButton";

interface Props {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { bookId } = await params;
  const book = await getBookAdmin(bookId);
  return {
    title: book ? `Ingest — ${book.title} | Admin` : "Ingest | Admin",
  };
}

export default async function BookIngestPage({ params }: Props) {
  // Defense-in-depth: check admin role again (layout also checks)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const { bookId } = await params;

  const [book, latestJob] = await Promise.all([
    getBookAdmin(bookId),
    getLatestIngestJob(bookId),
  ]);

  if (!book) {
    redirect("/admin");
  }

  const hasExistingChapters = book._count.chapters > 0;

  // Show IngestStatus on page load if there's an in-progress job
  const activeJob =
    latestJob && (latestJob.status === "pending" || latestJob.status === "processing")
      ? latestJob
      : null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          Books
        </Link>
        <span>/</span>
        <Link href={`/admin/books/${bookId}`} className="hover:text-foreground">
          {book.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Ingest</span>
      </div>

      {/* Page heading */}
      <div>
        <Link
          href={`/admin/books/${bookId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to book
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Ingest — {book.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a manuscript to extract chapters and generate PDF/EPUB artifacts.
        </p>
      </div>

      {/* Ingest history summary */}
      {hasExistingChapters && (
        <div className="rounded-lg border p-4 bg-muted/30 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current content</span>
            <Link
              href={`/admin/books/${bookId}/preview`}
              className="text-xs text-blue-600 hover:underline"
            >
              Preview →
            </Link>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
            <span>
              {book._count.chapters} chapter{book._count.chapters !== 1 ? "s" : ""}
            </span>
            {latestJob && (
              <>
                <span>·</span>
                <span>
                  Last ingested{" "}
                  {new Date(latestJob.createdAt).toLocaleDateString()}
                </span>
                <Badge
                  variant={
                    latestJob.status === "success"
                      ? "default"
                      : latestJob.status === "error"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {latestJob.status}
                </Badge>
                <span>·</span>
                <DownloadFileButton r2Key={latestJob.r2Key} label="Download manuscript" />
              </>
            )}
          </div>
        </div>
      )}

      {/* If there's an active job, show its status instead of the uploader */}
      {activeJob ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An ingest job is currently in progress.
          </p>
          <IngestStatus jobId={activeJob.id} bookId={bookId} />
        </div>
      ) : (
        <IngestUploader bookId={bookId} hasExistingChapters={hasExistingChapters} />
      )}
    </div>
  );
}
