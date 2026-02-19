"use client";

import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useIngestStatus } from "./useIngestStatus";

interface IngestStatusProps {
  jobId: string;
  bookId: string;
}

const STEP_LABELS: Record<string, string> = {
  html_convert: "Converting to HTML",
  math_render: "Pre-rendering math",
  chapter_split: "Splitting chapters",
  health_report: "Running health report",
  pdf_generate: "Generating PDF",
  epub_generate: "Generating EPUB",
  r2_upload: "Uploading to R2",
  db_write: "Writing to database",
  complete: "Complete",
};

function getStatusBadgeVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "success") return "default";
  if (status === "error") return "destructive";
  if (status === "processing") return "secondary";
  return "outline";
}

export default function IngestStatus({ jobId, bookId }: IngestStatusProps) {
  const { status, progress, error } = useIngestStatus(jobId);

  const stepLabel = progress?.step ? (STEP_LABELS[progress.step] ?? progress.step) : "Initializing";
  const pct = progress?.pct ?? 0;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Ingest Pipeline</span>
        <Badge variant={getStatusBadgeVariant(status)}>
          {status ?? "pending"}
        </Badge>
      </div>

      {/* Success state */}
      {status === "success" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Ingest complete</span>
          </div>
          <Progress value={100} className="h-2" />
          <Link
            href={`/admin/books/${bookId}/preview`}
            className="text-sm text-blue-600 hover:underline"
          >
            Preview ingested content →
          </Link>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Ingest failed</span>
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-medium text-red-800 mb-1">Error details</p>
              <pre className="whitespace-pre-wrap text-xs text-red-700 break-words max-h-60 overflow-y-auto">
                {error}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Processing state */}
      {(status === "processing" || status === "pending" || status === null) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{stepLabel}</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">{pct}% complete</p>
        </div>
      )}
    </div>
  );
}
