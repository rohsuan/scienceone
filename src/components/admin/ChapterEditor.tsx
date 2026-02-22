"use client";

import { useEffect, useCallback, useTransition, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import { Markdown } from "@tiptap/markdown";
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
  Code,
  Code2,
} from "lucide-react";

import "highlight.js/styles/github-dark.css";

const lowlight = createLowlight();
lowlight.register("python", python);
lowlight.register("javascript", javascript);
lowlight.register("bash", bash);
lowlight.register("json", json);

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
  const [viewMode, setViewMode] = useState<"wysiwyg" | "markdown">("wysiwyg");
  const [markdownContent, setMarkdownContent] = useState("");
  const savedContentRef = useRef(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "python" }),
      KatexInline,
      KatexBlock,
      Markdown,
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

  const syncMarkdownToEditor = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(markdownContent, { contentType: "markdown" });
  }, [editor, markdownContent]);

  const handleToggleView = useCallback(() => {
    if (!editor) return;
    if (viewMode === "wysiwyg") {
      setMarkdownContent(editor.getMarkdown());
      setViewMode("markdown");
    } else {
      syncMarkdownToEditor();
      setViewMode("wysiwyg");
    }
  }, [editor, viewMode, syncMarkdownToEditor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    // If in markdown mode, sync to editor first
    if (viewMode === "markdown") {
      editor.commands.setContent(markdownContent, { contentType: "markdown" });
    }
    const html = editor.getHTML();
    startTransition(async () => {
      try {
        await updateChapterContent(bookId, chapterSlug, { content: html });
        savedContentRef.current = html;
        setIsDirty(false);
        toast.success("Chapter saved");
      } catch (err) {
        console.error("Chapter save error:", err);
        toast.error("Failed to save chapter");
      }
    });
  }, [editor, bookId, chapterSlug, viewMode, markdownContent]);

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

  const isMarkdown = viewMode === "markdown";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap rounded-lg border bg-muted/50 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={isMarkdown}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={isMarkdown}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          disabled={isMarkdown}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          disabled={isMarkdown}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={isMarkdown}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={isMarkdown}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={isMarkdown || !editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={isMarkdown || !editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <ToolbarButton
          onClick={() => setLatexOpen(true)}
          disabled={isMarkdown}
          title="Insert LaTeX"
        >
          <Sigma className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          disabled={isMarkdown}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleToggleView}
          active={isMarkdown}
          title={isMarkdown ? "Switch to WYSIWYG" : "Switch to Markdown"}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        {/* Spacer */}
        <div className="flex-1" />

        {isMarkdown && (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Markdown
          </Badge>
        )}

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
        {isMarkdown ? (
          <textarea
            className="w-full min-h-[400px] font-mono text-sm bg-transparent focus:outline-none resize-y"
            value={markdownContent}
            onChange={(e) => {
              setMarkdownContent(e.target.value);
              setIsDirty(true);
            }}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
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
