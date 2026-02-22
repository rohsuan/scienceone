"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResourceDownloadButtonProps {
  resourceId: string;
  fileName?: string | null;
}

export default function ResourceDownloadButton({
  resourceId,
  fileName,
}: ResourceDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/resource-download?resourceId=${encodeURIComponent(resourceId)}`
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
      className="w-full"
      disabled={loading}
      onClick={handleDownload}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Preparing download..." : `Download ${fileName ?? "File"}`}
    </Button>
  );
}
