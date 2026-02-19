"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import IngestStatus from "./IngestStatus";

interface IngestUploaderProps {
  bookId: string;
  hasExistingChapters: boolean;
}

type UploadState = "idle" | "confirm" | "uploading" | "processing" | "done" | "error";

const ACCEPTED_EXTENSIONS = {
  "application/x-tex": [".tex"],
  "text/x-tex": [".tex"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/markdown": [".md", ".markdown"],
  "text/plain": [".md", ".markdown"],
};

export default function IngestUploader({ bookId, hasExistingChapters }: IngestUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleError = (msg: string) => {
    setErrorMessage(msg);
    setState("error");
  };

  const startUpload = useCallback(async (file: File) => {
    setState("uploading");
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      // Step 1: Get presigned upload URL
      const urlRes = await fetch("/api/admin/ingest/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, r2Key } = await urlRes.json();

      // Step 2: Upload file to R2 via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setUploadProgress(100);

      // Step 3: Trigger the ingest pipeline
      const startRes = await fetch("/api/admin/ingest-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, r2Key }),
      });

      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to start ingest pipeline");
      }

      const { jobId: newJobId } = await startRes.json();
      setJobId(newJobId);
      setState("processing");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      handleError(msg);
    }
  }, [bookId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (hasExistingChapters) {
      // Show confirmation dialog before re-ingesting
      setPendingFile(file);
      setState("confirm");
    } else {
      void startUpload(file);
    }
  }, [hasExistingChapters, startUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_EXTENSIONS,
    maxFiles: 1,
    disabled: state !== "idle" && state !== "error",
  });

  const handleConfirm = () => {
    if (pendingFile) {
      void startUpload(pendingFile);
      setPendingFile(null);
    }
  };

  const handleCancelConfirm = () => {
    setPendingFile(null);
    setState("idle");
  };

  const handleReset = () => {
    setState("idle");
    setUploadProgress(0);
    setJobId(null);
    setErrorMessage(null);
    setPendingFile(null);
  };

  return (
    <div className="space-y-4">
      {/* Re-ingest confirmation dialog */}
      <AlertDialog open={state === "confirm"} onOpenChange={(open) => !open && handleCancelConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing chapters?</AlertDialogTitle>
            <AlertDialogDescription>
              Re-ingesting will replace all existing chapters and artifacts for this book. This action
              cannot be undone. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Yes, re-ingest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dropzone — shown when idle or after error */}
      {(state === "idle" || state === "error") && (
        <div
          {...getRootProps()}
          className={[
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
          ].join(" ")}
        >
          <input {...getInputProps()} />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {isDragActive ? "Drop manuscript here" : "Drag manuscript here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .tex, .docx, .md, .markdown
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="h-3 w-3" />
            Single file only
          </div>
        </div>
      )}

      {/* Upload progress */}
      {state === "uploading" && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Uploading manuscript...</span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Ingest pipeline status */}
      {state === "processing" && jobId && (
        <IngestStatus jobId={jobId} bookId={bookId} />
      )}

      {/* Error display with retry option */}
      {state === "error" && errorMessage && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive space-y-2">
          <p className="font-medium">Upload failed</p>
          <p className="text-xs">{errorMessage}</p>
          <button
            onClick={handleReset}
            className="text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
