"use client";

import { useState, useMemo } from "react";
import katex from "katex";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LaTeXDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (type: "katexInline" | "katexBlock", rawHTML: string) => void;
}

export default function LaTeXDialog({
  open,
  onOpenChange,
  onInsert,
}: LaTeXDialogProps) {
  const [latex, setLatex] = useState("");

  const preview = useMemo(() => {
    if (!latex.trim()) return { html: "", error: null };
    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: false,
      });
      return { html, error: null };
    } catch (e) {
      return { html: "", error: (e as Error).message };
    }
  }, [latex]);

  const canInsert = latex.trim().length > 0 && !preview.error;

  function handleInsert(type: "katexInline" | "katexBlock") {
    const displayMode = type === "katexBlock";
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode,
    });
    // Wrap in the outer element the extensions expect
    const rawHTML = displayMode
      ? `<span class="katex-display">${html}</span>`
      : html;
    onInsert(type, rawHTML);
    setLatex("");
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) setLatex("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert LaTeX</DialogTitle>
          <DialogDescription>
            Type a LaTeX expression (e.g. <code>R^n</code>,{" "}
            <code>{"\\int_0^1 f(x)\\,dx"}</code>)
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="R^n"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          autoFocus
        />

        {/* Live preview / error */}
        <div className="min-h-[3rem] rounded-md border p-3 text-center">
          {preview.error ? (
            <p className="text-sm text-destructive">{preview.error}</p>
          ) : preview.html ? (
            <div dangerouslySetInnerHTML={{ __html: preview.html }} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Preview appears here
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={!canInsert}
            onClick={() => handleInsert("katexInline")}
          >
            Insert Inline
          </Button>
          <Button
            disabled={!canInsert}
            onClick={() => handleInsert("katexBlock")}
          >
            Insert Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
