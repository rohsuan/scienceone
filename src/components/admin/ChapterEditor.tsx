"use client";

import { useEffect, useCallback, useTransition, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import Link from "next/link";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  Eye,
  Sigma,
} from "lucide-react";

import { updateChapterContent } from "@/lib/admin-actions";
import { KatexInline, KatexBlock } from "@/components/admin/tiptap-katex";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LaTeXDialog from "@/components/admin/LaTeXDialog";

interface ChapterEditorProps {
  bookId: string;
  chapterSlug: string;
  initialContent: string;
  previewHref: string;
}

export default function ChapterEditor({
  bookId,
  chapterSlug,
  initialContent,
  previewHref,
}: ChapterEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const [latexOpen, setLatexOpen] = useState(false);
  const savedContentRef = useRef(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      KatexInline,
      KatexBlock,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none [&_.katex-display]:overflow-x-auto focus:outline-none min-h-[400px]",
      },
    },
    onUpdate({ editor: e }) {
      setIsDirty(e.getHTML() !== savedContentRef.current);
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    startTransition(async () => {
      try {
        await updateChapterContent(bookId, chapterSlug, { content: html });
        savedContentRef.current = html;
        setIsDirty(false);
        toast.success("Chapter saved");
      } catch {
        toast.error("Failed to save chapter");
      }
    });
  }, [editor, bookId, chapterSlug]);

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  // Warn on unsaved changes before navigating away
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  if (!editor) return null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap rounded-lg border bg-muted/50 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => setLatexOpen(true)}
          title="Insert LaTeX"
        >
          <Sigma className="h-4 w-4" />
        </ToolbarButton>

        {/* Spacer */}
        <div className="flex-1" />

        {isDirty && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            Unsaved changes
          </Badge>
        )}

        <Button asChild variant="outline" size="sm">
          <Link href={previewHref}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Link>
        </Button>

        <Button size="sm" onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Editor */}
      <div className="rounded-lg border p-6">
        <EditorContent editor={editor} />
      </div>

      <LaTeXDialog
        open={latexOpen}
        onOpenChange={setLatexOpen}
        onInsert={(type, rawHTML) => {
          editor.chain().focus().insertContent({ type, attrs: { rawHTML } }).run();
        }}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "rounded p-1.5 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
