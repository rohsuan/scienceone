"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DownloadDropdownProps {
  bookSlug: string;
  hasPdf: boolean;
  hasEpub: boolean;
  variant?: "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "icon";
  label?: string;
}

export default function DownloadDropdown({
  bookSlug,
  hasPdf,
  hasEpub,
  variant = "outline",
  size = "sm",
  label,
}: DownloadDropdownProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload(format: "pdf" | "epub") {
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

  if (!hasPdf && !hasEpub) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          <Download className="h-4 w-4 mr-1.5" />
          {loading ? "Preparing..." : (label ?? "Download")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasPdf && (
          <DropdownMenuItem onClick={() => handleDownload("pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
        )}
        {hasEpub && (
          <DropdownMenuItem onClick={() => handleDownload("epub")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Download EPUB
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
