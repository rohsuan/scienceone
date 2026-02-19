"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  bookSlug: string;
  format: "pdf" | "epub";
  label?: string;
  variant?: "outline" | "secondary" | "ghost";
  size?: "sm" | "default";
  className?: string;
}

export default function DownloadButton({
  bookSlug,
  format,
  label,
  variant = "outline",
  size = "sm",
  className,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/download?bookSlug=${encodeURIComponent(bookSlug)}&format=${format}`
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Download failed");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleDownload}
      className={className}
    >
      <Download className="h-4 w-4 mr-1.5" />
      {loading ? "Preparing..." : (label ?? `Download ${format.toUpperCase()}`)}
    </Button>
  );
}
