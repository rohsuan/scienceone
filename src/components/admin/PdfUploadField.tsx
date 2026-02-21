"use client";

import React, { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface PdfUploadFieldProps {
  currentKey: string | null;
  onUpload: (r2Key: string) => void;
  bookId: string;
}

export default function PdfUploadField({
  currentKey,
  onUpload,
  bookId,
}: PdfUploadFieldProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(currentKey);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, fileName: file.name, type: "pdf" }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, r2Key } = (await res.json()) as {
        uploadUrl: string;
        r2Key: string;
      };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });

        xhr.addEventListener("error", () => reject(new Error("Upload network error")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.send(file);
      });

      setUploadedKey(r2Key);
      onUpload(r2Key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleView() {
    if (!uploadedKey) return;
    setIsOpening(true);
    // Open the tab synchronously from the click event to avoid popup blocker
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await fetch(`/api/admin/pdf-url?key=${encodeURIComponent(uploadedKey)}`);
      if (!res.ok) throw new Error("Failed to get PDF URL");
      const { url } = (await res.json()) as { url: string };
      if (tab) {
        tab.location.href = url;
      }
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : "Failed to open PDF");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">PDF File</p>

      {uploadedKey && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span className="truncate max-w-xs">{uploadedKey.split("/").pop()}</span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2 w-48" />
          <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : uploadedKey ? "Replace PDF" : "Upload PDF"}
        </Button>

        {uploadedKey && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isOpening}
            onClick={handleView}
          >
            <ExternalLink className="size-4 mr-1" />
            {isOpening ? "Opening..." : "View PDF"}
          </Button>
        )}
      </div>
    </div>
  );
}
