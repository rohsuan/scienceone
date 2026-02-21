"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadFileButtonProps {
  r2Key: string;
  label?: string;
}

export default function DownloadFileButton({ r2Key, label = "Download" }: DownloadFileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/pdf-url?key=${encodeURIComponent(r2Key)}`);
      if (!res.ok) throw new Error("Failed to get download URL");
      const { url } = (await res.json()) as { url: string };
      // Use a hidden anchor for download to avoid popup blockers
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // silent fail — could add toast here
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={isLoading} onClick={handleClick}>
      <Download className="size-3.5 mr-1" />
      {isLoading ? "Loading..." : label}
    </Button>
  );
}
