"use client";

import React, { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ImageUploadFieldProps {
  label: string;
  currentUrl: string | null;
  onUpload: (r2Key: string) => void;
  bookId: string;
  type: "cover" | "author";
}

export default function ImageUploadField({
  label,
  currentUrl,
  onUpload,
  bookId,
  type,
}: ImageUploadFieldProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned upload URL from our API
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, fileName: file.name, type }),
      });

      if (!res.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, r2Key } = (await res.json()) as {
        uploadUrl: string;
        r2Key: string;
      };

      // Step 2: Upload file directly to R2 via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload network error")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Update parent form state with the r2Key
      setPreviewUrl(URL.createObjectURL(file));
      onUpload(r2Key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      {previewUrl && (
        <div className="w-24 h-24 rounded-md overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2 w-48" />
          <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
          {isUploading ? "Uploading..." : previewUrl ? "Replace image" : "Upload image"}
        </Button>
      </div>
    </div>
  );
}
