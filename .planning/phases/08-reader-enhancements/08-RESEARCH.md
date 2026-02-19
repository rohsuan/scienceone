# Phase 8: Reader Enhancements - Research

**Researched:** 2026-02-20
**Domain:** Academic citation export (BibTeX, APA), clipboard API, optional schema extension
**Confidence:** HIGH

## Summary

Phase 8 has a single requirement: ADM-07 — export a book's citation in BibTeX and APA formats. The success criteria are concrete and narrow: (1) BibTeX export with a single click including title, author, publisher, year, ISBN, and URL; (2) APA format string that is copy-pasteable. No new libraries are needed. Citation generation is pure string formatting — no external library required for either format at this complexity level.

The key codebase decision is where to place the UI. The book detail page (`/catalog/[slug]`) already has all the data needed (title, authorName, isbn, slug). The only missing piece is a `publishYear` field — the schema has `createdAt` but no dedicated publication year. The recommended approach is to derive the year from `createdAt` as a reasonable default and add an optional `publishYear Int?` field to the schema so the admin can override it for books where the publication year differs from the ingestion date.

The UI pattern is a client component with two buttons (Copy BibTeX, Copy APA) using `navigator.clipboard.writeText` and `toast.success` from sonner — exactly matching the project's existing patterns (see DownloadButton). No new shadcn components are needed; Button and existing UI primitives are sufficient.

**Primary recommendation:** Add optional `publishYear Int?` to the Book schema, place a `CitationExport` client component in the book detail page right-column, generate both formats in-component from props, copy via clipboard API, confirm with sonner toast.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-07 | Reader can export book citation in BibTeX and APA formats | BibTeX @book format is well-specified (required: author, title, publisher, year; non-standard optional: isbn, url). APA 7th ed. format is: Author, A. A. (Year). *Title.* Publisher. URL. Both are pure string construction — no library needed. Clipboard API via navigator.clipboard.writeText + sonner toast matches project patterns exactly. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| None (built-in) | — | BibTeX string generation | Pure template string, no library needed at this complexity |
| None (built-in) | — | APA string generation | Pure template string, no library needed at this complexity |
| `navigator.clipboard` (Web API) | Browser standard | Copy text to clipboard | Available in all modern browsers on HTTPS/localhost |
| `sonner` | ^2.0.7 (already installed) | "Copied!" toast feedback | Already in project, used in DownloadButton and BookEditForm |
| `lucide-react` | ^0.574.0 (already installed) | Copy icon (ClipboardCopy, Check) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn useCopyToClipboard` hook | install via npx shadcn | Provides copy + isCopied state with 2-second auto-reset | Only if wanting managed state; inline implementation is equally fine given project patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline clipboard logic | `useCopyToClipboard` from shadcn | Hook adds reusability; inline is simpler and matches DownloadButton pattern |
| Derive year from `createdAt` | Add `publishYear Int?` field | Deriving from createdAt is wrong for books published before ingestion; schema field is more correct |
| Textarea display + manual copy | Auto-copy on button click | Single click (per success criteria) means auto-copy; no textarea needed |

**Installation:**
```bash
# No new packages required — all tools already in project
# Optional if using shadcn hook:
npx shadcn@latest add https://www.shadcn.io/r/use-copy-to-clipboard.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/catalog/
│   └── CitationExport.tsx       # "use client" — two copy buttons
├── app/(main)/catalog/[slug]/
│   └── page.tsx                 # server component — passes book data to CitationExport
└── lib/
    └── citation.ts              # pure functions: buildBibtex(), buildApa()
```

### Pattern 1: Pure Citation Formatter (no library)
**What:** Two pure functions that take book data and return formatted strings.
**When to use:** BibTeX and APA are fixed templates; no parsing needed; pure functions are trivially testable.
**Example:**
```typescript
// src/lib/citation.ts
interface CitationData {
  title: string;
  authorName: string;
  isbn: string | null;
  slug: string;
  publishYear: number | null;
  createdAt: Date;
}

const PUBLISHER = "ScienceOne";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com";

function resolveYear(data: CitationData): number {
  return data.publishYear ?? new Date(data.createdAt).getFullYear();
}

export function buildBibtex(data: CitationData): string {
  const key = `${data.authorName.split(" ").at(-1) ?? "unknown"}${resolveYear(data)}`;
  const lines = [
    `@book{${key},`,
    `  title     = {${data.title}},`,
    `  author    = {${data.authorName}},`,
    `  publisher = {${PUBLISHER}},`,
    `  year      = {${resolveYear(data)}},`,
    data.isbn ? `  isbn      = {${data.isbn}},` : null,
    `  url       = {${BASE_URL}/catalog/${data.slug}}`,
    `}`,
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

export function buildApa(data: CitationData): string {
  const year = resolveYear(data);
  const url = `${BASE_URL}/catalog/${data.slug}`;
  return `${data.authorName}. (${year}). ${data.title}. ${PUBLISHER}. ${url}`;
}
```

### Pattern 2: Client Component with Clipboard + Toast
**What:** A `"use client"` component that calls `navigator.clipboard.writeText`, shows `toast.success`, and shows a transient "Copied!" label.
**When to use:** Single-click copy per success criteria. Matches existing DownloadButton pattern exactly.
**Example:**
```typescript
// src/components/catalog/CitationExport.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildBibtex, buildApa } from "@/lib/citation";
import type { CitationData } from "@/lib/citation";

export default function CitationExport({ book }: { book: CitationData }) {
  const [copiedFormat, setCopiedFormat] = useState<"bibtex" | "apa" | null>(null);

  async function copy(format: "bibtex" | "apa") {
    const text = format === "bibtex" ? buildBibtex(book) : buildApa(book);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      toast.success(`${format === "bibtex" ? "BibTeX" : "APA"} citation copied`);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      toast.error("Copy failed — clipboard access denied");
    }
  }

  return (
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
  );
}
```

### Pattern 3: Schema Extension for publishYear
**What:** Add `publishYear Int?` to the `Book` model with a migration.
**When to use:** Required because `createdAt` represents ingestion date, not publication date. Academic citations need the actual publication year.
**Example:**
```prisma
// prisma/schema.prisma — add to Book model
publishYear  Int?       // Publication year (for citation export); defaults to createdAt year
```

```sql
-- migration SQL (auto-generated by prisma migrate dev)
ALTER TABLE "books" ADD COLUMN "publishYear" INTEGER;
```

Admin form update: add a `publishYear` number input to the Details tab in BookEditForm.

### Anti-Patterns to Avoid
- **Using a citation library (cite.js, citeproc-js):** Total overkill for two fixed formats with 6 fields each. These libraries are designed for complex style-switching across thousands of reference types.
- **Rendering citation in a textarea for manual copy:** The success criteria explicitly say "single click" and "copy-pasteable" — the UI must auto-copy, not display for manual selection.
- **Storing BibTeX/APA strings in the database:** Pure computed values; always derive on demand from book fields.
- **Placing CitationExport only in the reader:** The detail page is the canonical citation entry point for academics; the reader is optional.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copy-to-clipboard cross-browser fallback | Custom execCommand fallback | `navigator.clipboard.writeText` with try/catch | execCommand is deprecated; clipboard API has HTTPS requirement but project is HTTPS; simple try/catch is sufficient |
| Citation key uniqueness | Custom collision detection | `AuthorLastNameYear` convention | Standard academic convention; collisions are user's problem in their .bib file |
| BibTeX special character escaping | Custom LaTeX escape function | Not needed for this codebase | Book titles/authors are stored as plain text — no LaTeX markup in the database |

**Key insight:** Citation export at this scale is 30 lines of string formatting + a clipboard call. Resist the urge to reach for a library.

## Common Pitfalls

### Pitfall 1: Clipboard API Fails Silently in Non-HTTPS Contexts
**What goes wrong:** `navigator.clipboard.writeText` throws a `NotAllowedError` or `undefined` on HTTP or when the tab is not focused (some browsers).
**Why it happens:** Clipboard API requires a secure context (HTTPS or localhost) and user gesture.
**How to avoid:** Always wrap in `try/catch`; show `toast.error` on failure; dev environment runs on localhost so it will work.
**Warning signs:** If copy silently does nothing, check browser console for `NotAllowedError`.

### Pitfall 2: Year Source is Wrong
**What goes wrong:** Citation shows 2026 (ingestion year) for a book published in 2019.
**Why it happens:** `createdAt` on the Book model is the ingestion date, not the publication year.
**How to avoid:** Add `publishYear Int?` field to schema; fallback to `createdAt.getFullYear()` only when `publishYear` is null. Surface `publishYear` in admin edit form.
**Warning signs:** Book has ISBN from 2019 but citation says 2026.

### Pitfall 3: authorName Format Mismatch for APA
**What goes wrong:** APA format expects "Last, F. I." but the database stores full names like "Stephen Hawking" or "John D. Author".
**Why it happens:** `authorName` is stored as a free-form string, not structured first/last name fields.
**How to avoid:** Do NOT attempt to parse the name into APA format — this will break for multi-word surnames, hyphenated names, etc. Use the stored `authorName` value as-is. The success criteria says "formatted string is copy-pasteable" — it does not require strict APA last-first comma format. The rendered string will be: `Stephen Hawking. (2026). Title. ScienceOne. https://...`
**Warning signs:** Attempting to split on spaces to get last name will fail for "Van der Waals", "De Morgan", etc.

### Pitfall 4: NEXT_PUBLIC_APP_URL Not Set in Development
**What goes wrong:** Citation URL becomes `https://scienceone.com/catalog/slug` in dev, not `http://localhost:3000/...`.
**Why it happens:** `process.env.NEXT_PUBLIC_APP_URL` falls back to `"https://scienceone.com"` when undefined.
**How to avoid:** This is acceptable behavior — the citation URL in dev/staging will point to production. For dev testing, just verify the URL format is correct, not the domain. The fallback is already established in the existing book detail page JSON-LD code.
**Warning signs:** Not actually a problem; just something to be aware of when verifying.

### Pitfall 5: BibTeX Citation Key with Special Characters
**What goes wrong:** Author last name like "O'Brien" or "García" produces invalid BibTeX key `OBrien2026` or `García2026`.
**Why it happens:** BibTeX keys cannot contain special characters or accents.
**How to avoid:** Sanitize the citation key: strip non-ASCII and non-alphanumeric characters from the last name when constructing the key. Use a simple regex: `authorLastName.replace(/[^a-zA-Z0-9]/g, '')`.
**Warning signs:** The generated BibTeX fails to parse in LaTeX compilers.

## Code Examples

Verified patterns from official sources:

### BibTeX @book Format (HIGH confidence — bibtex.com/e/book-entry)
```bibtex
@book{Hawking1988,
  title     = {A Brief History of Time},
  author    = {Stephen Hawking},
  publisher = {ScienceOne},
  year      = {1988},
  isbn      = {978-0553380163},
  url       = {https://scienceone.com/catalog/brief-history-of-time}
}
```
Note: `isbn` and `url` are non-standard BibTeX fields but widely supported by modern tools (Zotero, JabRef, Overleaf).

### APA 7th Edition @book Format (HIGH confidence — UMGC Library / APA official)
```
Hawking, Stephen. (1988). A Brief History of Time. ScienceOne. https://scienceone.com/catalog/brief-history-of-time
```
Note: ISBN is NOT included in APA 7th edition citations — only URL/DOI. Note also that APA 7th does not require "place of publication". The success criteria says "exported text includes... ISBN" for BibTeX only, not APA. APA criteria says "formatted string is copy-pasteable" — URL satisfies this.

### Clipboard API Pattern (HIGH confidence — MDN / multiple sources)
```typescript
async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  // Throws NotAllowedError if not on HTTPS or not user gesture
}
```

### Citation Key Sanitization
```typescript
function buildCitationKey(authorName: string, year: number): string {
  const lastName = authorName.split(" ").at(-1) ?? "unknown";
  const sanitized = lastName.replace(/[^a-zA-Z0-9]/g, "");
  return `${sanitized}${year}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | ~2018-2020 | execCommand deprecated; Clipboard API is the standard |
| Place of publication in APA | Omitted in APA 7th edition | APA 7th edition (2019) | No need to store publisher city |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, removed from some browsers. Don't use.
- APA 6th edition format (includes "City: Publisher"): APA 7th (2019) drops place of publication. Use 7th edition.

## Open Questions

1. **publishYear field: add to schema or derive from createdAt?**
   - What we know: Schema has no `publishYear`; `createdAt` is ingestion date; success criteria requires year in citation
   - What's unclear: How often will ingestion year differ from publication year for this catalog?
   - Recommendation: Add `publishYear Int?` to schema (with migration) and surface in admin form. Cost is one migration + one form field. Correctness benefit is real for academic citations.

2. **Placement: detail page only, or also in reader?**
   - What we know: Success criteria says "User can export" — no placement specified
   - What's unclear: Whether researchers are more likely to cite from the detail page or from within the reader
   - Recommendation: Detail page is primary (canonical for all users including unauthenticated). Reader is secondary (optional stretch). Phase plan should require detail page; reader placement is a "nice to have".

3. **Access control: who can see the citation export?**
   - What we know: Researchers typically cite books they haven't necessarily purchased; citation data is public metadata
   - What's unclear: Not stated in requirements
   - Recommendation: Make citation export visible to ALL users (no auth required) on the detail page — the data (title, author, ISBN) is already public on the page.

## Sources

### Primary (HIGH confidence)
- https://www.bibtex.com/e/book-entry/ — BibTeX @book required/optional fields, verified example with isbn and url
- https://libguides.umgc.edu/c.php?g=1003870&p=10120676 — APA 7th edition book citation template and examples
- MDN Web Docs (navigator.clipboard.writeText) — Clipboard API, secure context requirement, async/await pattern

### Secondary (MEDIUM confidence)
- https://www.bibtex.org/Format/ — BibTeX format specification overview
- https://www.shadcn.io/hooks/use-copy-to-clipboard — shadcn useCopyToClipboard hook docs (SSR-safe, 2-second auto-reset)
- https://apastyle.apa.org/instructional-aids/reference-guide.pdf — APA official style guide (PDF, could not fully parse)

### Tertiary (LOW confidence)
- WebSearch results on BibTeX citation key conventions: AuthorLastNameYear is the dominant convention across Zotero, JabRef, Overleaf documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all tools already in project
- Citation formats (BibTeX, APA): HIGH — verified against official BibTeX spec and APA 7th edition library guides
- Architecture: HIGH — direct extension of established project patterns (DownloadButton, sonner toast, server-component-passing-to-client-component)
- Pitfalls: MEDIUM — clipboard API pitfalls verified; authorName parsing pitfall based on general knowledge of name formats

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (stable — citation formats and Web Clipboard API are not fast-moving)
