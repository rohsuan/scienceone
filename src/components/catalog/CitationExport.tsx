"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildBibtex, buildApa } from "@/lib/citation";
import type { CitationData } from "@/lib/citation";

interface CitationExportProps {
  book: CitationData;
}

export default function CitationExport({ book }: CitationExportProps) {
  const [copiedFormat, setCopiedFormat] = useState<"bibtex" | "apa" | null>(null);

  async function copy(format: "bibtex" | "apa") {
    const text = format === "bibtex" ? buildBibtex(book) : buildApa(book);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      toast.success(format === "bibtex" ? "BibTeX citation copied" : "APA citation copied");
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      toast.error("Copy failed — clipboard access denied");
    }
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">Cite This Book</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => copy("bibtex")}>
          <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />
          {copiedFormat === "bibtex" ? "Copied!" : "Copy BibTeX"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => copy("apa")}>
          <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />
          {copiedFormat === "apa" ? "Copied!" : "Copy APA"}
        </Button>
      </div>
    </div>
  );
}
