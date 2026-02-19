# Phase 4: Browser Reader - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router reader layout, KaTeX rendering, reading progress persistence, responsive sidebar
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Each chapter has its own URL (e.g., /read/book-slug/chapter-3) — bookmarkable, shareable, browser back button works
- Reading progress requires authentication — only logged-in users get progress saved and restored
- Anonymous users reading open-access books do NOT get progress persistence

### Claude's Discretion

- Layout structure and content width for academic reading with math
- Dedicated reader chrome vs site header
- ToC sidebar behavior (always visible vs collapsible)
- Prev/next chapter navigation controls
- ToC state indicators (read markers)
- All mobile patterns (ToC access, math overflow, sticky/auto-hide bar)
- Progress storage mechanism and resume UX
- Visual progress indicators

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | User can read book chapters in browser with correctly rendered LaTeX math formulas (KaTeX, server-side pre-rendered) | KaTeX CSS already imported in root layout; content stored as pre-rendered HTML in DB; use `dangerouslySetInnerHTML` inside a `prose` container with KaTeX overflow CSS |
| READ-02 | User can navigate between chapters via table of contents sidebar | Nested layout with `[bookSlug]` params loads chapters list server-side; `useSelectedLayoutSegment` in client ToC component highlights active chapter slug |
| READ-03 | Reader is responsive and usable on mobile devices and tablets (375px, 768px) | Sidebar: always-visible at lg+; Sheet (shadcn) drawer from left on mobile; KaTeX display math gets `overflow-x-auto` on containing div |
| READ-04 | User's reading progress is saved and restored when they return | DB-backed: `ReadingProgress` table (already in schema) with `@@unique([userId, bookId])`; PATCH route handler + Prisma `upsert`; debounced scroll listener on client; resume on server-side page load |
</phase_requirements>

---

## Summary

This phase builds the browser reader: a dedicated reading environment at `/read/[bookSlug]/[chapterSlug]` where authenticated (or open-access) users read chapters with rendered math. The stack is already 90% in place — KaTeX CSS is imported, chapter content is pre-rendered HTML in the DB, the `ReadingProgress` Prisma model exists with the correct unique constraint, and Better Auth's `auth.api.getSession()` is the established pattern for server-side auth checks.

The main new construction is: (1) a dedicated reader layout using a route group `(reader)` that replaces the site header/footer with reader-specific chrome, (2) a layout-level ToC sidebar that fetches all chapters for the book using the `[bookSlug]` param and highlights the active chapter using `useSelectedLayoutSegment`, (3) a client-side scroll tracker that debounces writes to a PATCH route handler that upserts `ReadingProgress` in Postgres, and (4) responsive handling where the sidebar collapses to a Sheet drawer on mobile.

**Primary recommendation:** Use a `(reader)` route group with its own non-root layout (shares the root `<html>/<body>`), nested dynamic segments `[bookSlug]/[chapterSlug]`, `@tailwindcss/typography` prose class for content rendering, KaTeX display math overflow handled at the containing-div level, and a hybrid progress strategy: DB for cross-device persistence (authenticated users), with localStorage as the mechanism to restore scroll position within a session after the chapter URL is determined server-side.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 (installed) | Route groups, nested layouts, dynamic segments, route handlers | Already the project framework; route groups enable reader-specific layout |
| @tailwindcss/typography | latest | `prose` class for rendering trusted HTML content (chapter body) | Standard for dangerouslySetInnerHTML content; handles headings, lists, code, paragraphs |
| katex | 0.16.28 (installed) | CSS already imported in root layout | Pre-rendered HTML + CSS = no client JS needed for math |
| shadcn Sheet | (no additional dep) | Mobile ToC drawer slide-in from left | Already used pattern in project; built on Radix UI Dialog |
| use-debounce | 10.1.0 (installed) | Debounce scroll event before writing progress | Already in package.json |
| lucide-react | 0.574.0 (installed) | Icons: menu, chevron, x, book-open | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prisma | 7.x (installed) | `upsert` on `ReadingProgress` table | Progress save/restore from DB for authenticated users |
| Better Auth | 1.4.18 (installed) | Session check in page and route handler | Auth gate for progress tracking and chapter access |

### New Installation Required

```bash
npm install -D @tailwindcss/typography
```

Then add to `/Users/roh/GClaude/src/app/globals.css`:
```css
@plugin "@tailwindcss/typography";
```

No other new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/
├── (main)/                      # Existing main site (header + footer)
│   └── catalog/...
├── (reader)/                    # NEW: reader route group — no site header
│   ├── layout.tsx               # Reader shell: minimal chrome with back link
│   └── read/
│       └── [bookSlug]/
│           ├── layout.tsx       # Book-level layout: loads chapters, renders ToC sidebar
│           └── [chapterSlug]/
│               └── page.tsx     # Chapter page: loads & renders chapter content
└── api/
    └── reading-progress/
        └── route.ts             # PATCH handler: save progress; GET: load progress

src/components/
└── reader/
    ├── TocSidebar.tsx           # Server component: list of chapter links
    ├── TocNavLink.tsx           # "use client" — useSelectedLayoutSegment for active state
    ├── ReaderTopBar.tsx          # "use client" — mobile menu button + book title
    ├── MobileTocDrawer.tsx      # "use client" — Sheet component wrapping TocSidebar
    ├── ScrollProgressTracker.tsx # "use client" — scroll listener + debounced PATCH
    ├── ChapterNav.tsx           # Prev/next chapter buttons
    └── ResumeToast.tsx          # "use client" — optional resume notification

src/lib/
└── reader-queries.ts            # getBookChapters(), getChapter(), getReadingProgress()
```

### Pattern 1: Route Group for Dedicated Reader Layout

A `(reader)` route group shares the root `app/layout.tsx` (which provides `<html>/<body>` and KaTeX CSS) but has its own `(reader)/layout.tsx` that does NOT include the site Header or Footer. This is NOT a separate root layout, so navigation from `/catalog/...` to `/read/...` is client-side without a full page reload.

```
// src/app/(reader)/layout.tsx
export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {children}
    </div>
  );
}
```

**Key insight:** Because this layout is nested under the existing root `app/layout.tsx` (not a separate root layout), navigation from the main site to the reader is soft client-side navigation. No full page reload occurs. This is the correct pattern when you want different chrome without multiple root layouts.

**Source:** Next.js 16.1.6 docs — Route Groups, layout.js reference

### Pattern 2: Book-Level Layout Fetches ToC and Renders Sidebar

The `[bookSlug]/layout.tsx` receives `params` (the book slug), fetches all chapters for that book from the DB, and renders the ToC sidebar alongside `{children}` (the chapter page). The layout re-uses across chapter navigation without re-fetching the book (Next.js layout caching).

```typescript
// src/app/(reader)/read/[bookSlug]/layout.tsx
// Source: Next.js 16.1.6 docs — layout.js params prop
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBookChapters } from "@/lib/reader-queries";
import TocSidebar from "@/components/reader/TocSidebar";
import ReaderTopBar from "@/components/reader/ReaderTopBar";
import MobileTocDrawer from "@/components/reader/MobileTocDrawer";

export default async function BookReaderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const book = await getBookChapters(bookSlug);
  if (!book) notFound();

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar: book title + mobile menu trigger */}
      <ReaderTopBar bookTitle={book.title} bookSlug={bookSlug} chapters={book.chapters} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: always visible at lg+, hidden on mobile */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col border-r border-border overflow-y-auto">
          <TocSidebar chapters={book.chapters} bookSlug={bookSlug} />
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Pattern 3: Active Chapter Highlight with useSelectedLayoutSegment

The ToC uses a client component `TocNavLink` that compares the current segment to each chapter slug. Called from within `[bookSlug]/layout.tsx` context, `useSelectedLayoutSegment()` returns the `[chapterSlug]` value.

```typescript
// src/components/reader/TocNavLink.tsx
// Source: Next.js 16.1.6 docs — useSelectedLayoutSegment
"use client";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

interface TocNavLinkProps {
  href: string;
  chapterSlug: string;
  children: React.ReactNode;
}

export default function TocNavLink({ href, chapterSlug, children }: TocNavLinkProps) {
  const segment = useSelectedLayoutSegment();
  const isActive = segment === chapterSlug;

  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}
```

### Pattern 4: Chapter Content Rendering with KaTeX Math Overflow

Chapter content is pre-rendered HTML (including KaTeX spans) stored in the DB. Use the `prose` class from `@tailwindcss/typography`. The critical KaTeX issue is that adding `overflow-x: auto` to `.katex` or `.katex-display` creates an unwanted vertical scrollbar. The fix is to apply overflow to a containing wrapper div via CSS targeting `.katex-display`.

```typescript
// src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx
<article
  className="
    prose prose-slate max-w-3xl mx-auto px-6 py-8
    lg:px-12 lg:py-10
    [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif
    [&_.katex-display]:overflow-x-auto
    [&_.katex-display]:py-2
  "
  dangerouslySetInnerHTML={{ __html: chapter.content ?? "" }}
/>
```

**Key insight:** Applying `overflow-x-auto` via the Tailwind arbitrary variant `[&_.katex-display]` targets the outer KaTeX block container (not `.katex` itself), which avoids the double-scrollbar bug. This matches the pattern already used in `preview/page.tsx` (`[&_math]:overflow-x-auto`) but more correctly targets `.katex-display`.

**Source:** KaTeX GitHub Discussion #2942

### Pattern 5: Reading Progress — Hybrid DB + Client Scroll

For authenticated users, progress is stored in DB via a PATCH route handler. On page load, the server reads `ReadingProgress` and passes the `scrollPercent` to the page as a prop; the client restores scroll position after mount. The `use-debounce` library (already installed) prevents excessive API calls during scrolling.

```typescript
// src/app/api/reading-progress/route.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, chapterId, scrollPercent } = await request.json();

  await prisma.readingProgress.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId } },
    update: { chapterId, scrollPercent, updatedAt: new Date() },
    create: { userId: session.user.id, bookId, chapterId, scrollPercent },
  });

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json(null);

  const url = new URL(request.url);
  const bookId = url.searchParams.get("bookId");
  if (!bookId) return Response.json(null);

  const progress = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: session.user.id, bookId } },
  });
  return Response.json(progress);
}
```

```typescript
// src/components/reader/ScrollProgressTracker.tsx
"use client";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface Props {
  bookId: string;
  chapterId: string;
  isAuthenticated: boolean;
  initialScrollPercent?: number;
}

export default function ScrollProgressTracker({
  bookId, chapterId, isAuthenticated, initialScrollPercent,
}: Props) {
  // Restore scroll position after mount
  useEffect(() => {
    if (initialScrollPercent && initialScrollPercent > 0) {
      const el = document.getElementById("reader-content");
      if (el) {
        el.scrollTop = (el.scrollHeight * initialScrollPercent) / 100;
      }
    }
  }, [initialScrollPercent]);

  const saveProgress = useDebouncedCallback(async (percent: number) => {
    if (!isAuthenticated) return;
    await fetch("/api/reading-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, chapterId, scrollPercent: Math.round(percent) }),
    });
  }, 2000); // 2s debounce

  useEffect(() => {
    const el = document.getElementById("reader-content");
    if (!el) return;

    const handleScroll = () => {
      const percent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      saveProgress(Math.min(100, Math.max(0, percent)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [saveProgress]);

  return null; // purely behavioral
}
```

### Pattern 6: Mobile ToC as Sheet Drawer

On mobile (below `lg`), the sidebar is hidden. The `ReaderTopBar` contains a hamburger button that opens a `Sheet` (shadcn) from the left side. The `Sheet` contains the same `TocSidebar` component.

```typescript
// src/components/reader/MobileTocDrawer.tsx
"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import TocSidebar from "./TocSidebar";
import type { Chapter } from "@/generated/prisma/client";

export default function MobileTocDrawer({
  chapters, bookSlug, bookTitle,
}: { chapters: Chapter[]; bookSlug: string; bookTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 rounded-md hover:bg-muted" aria-label="Open table of contents">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="font-serif text-sm text-left">{bookTitle}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-full pb-8">
          <TocSidebar chapters={chapters} bookSlug={bookSlug} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Installation:**
```bash
npx shadcn@latest add sheet
```

### Pattern 7: Access Control — Chapter Authorization

Chapter access control must happen server-side in the chapter page. The logic:
1. Open-access book → anyone can read all chapters
2. Purchased book → must have a `Purchase` record with `userId + bookId`
3. Free preview chapter (`isFreePreview: true`) → anyone can read it even if book is paid

```typescript
// src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx
export default async function ChapterPage({ params }: { params: Promise<{ bookSlug: string; chapterSlug: string }> }) {
  const { bookSlug, chapterSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const chapter = await getChapter(bookSlug, chapterSlug); // includes book and isFreePreview
  if (!chapter) notFound();

  const canRead =
    chapter.book.isOpenAccess ||
    chapter.isFreePreview ||
    (session && await hasPurchased(session.user.id, chapter.book.id));

  if (!canRead) {
    redirect(`/catalog/${bookSlug}?access=required`);
  }

  // Load progress for authenticated users
  let readingProgress = null;
  if (session) {
    readingProgress = await getReadingProgress(session.user.id, chapter.book.id);
  }

  // ...render
}
```

### Pattern 8: Resume Navigation

When a returning user opens a book (e.g., from dashboard or catalog), the "Read" link should resolve to the last chapter they were reading. This is done server-side on the book's reader entry page:

```typescript
// src/app/(reader)/read/[bookSlug]/page.tsx
// Entry point: redirect to last chapter OR first chapter
export default async function BookReaderEntryPage({ params }) {
  const { bookSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const book = await getBookChapters(bookSlug);
  if (!book) notFound();

  let targetChapter = book.chapters[0];

  if (session) {
    const progress = await getReadingProgress(session.user.id, book.id);
    if (progress) {
      const savedChapter = book.chapters.find(c => c.id === progress.chapterId);
      if (savedChapter) targetChapter = savedChapter;
    }
  }

  redirect(`/read/${bookSlug}/${targetChapter.slug}`);
}
```

### Anti-Patterns to Avoid

- **Multiple root layouts:** Do NOT make `(reader)/layout.tsx` a root layout by adding `<html><body>` tags. It should be a regular nested layout that inherits from `app/layout.tsx`. Multiple root layouts cause full page reloads on navigation.
- **Applying `overflow-x-auto` to `.katex` directly:** Causes double scrollbars (vertical appears). Apply to `.katex-display` container div or the parent `article` element's child selectors.
- **Saving progress on every scroll event:** Use `useDebouncedCallback` with 1500–2500ms. Raw scroll events fire at 60fps — will saturate the DB.
- **Storing scroll position in URL:** The locked decision specifies individual chapter URLs. Do not encode scroll position in query params — it breaks the clean URL requirement and clutters browser history.
- **Passing session from layout to page via props:** Next.js layouts cannot pass data to child pages. Each server component calls `auth.api.getSession({ headers: await headers() })` independently. Next.js deduplicates the request automatically.
- **Checking access in proxy.ts only:** Defense-in-depth requires server-side check in the page component as well. The proxy only checks session cookie presence, not purchase/access rights.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar active state | Custom pathname comparison | `useSelectedLayoutSegment()` | Built-in Next.js hook; correctly handles dynamic segment matching without string parsing |
| Mobile drawer/slide-in panel | Custom CSS animation + portal | `shadcn Sheet` | Focus trapping, ARIA, keyboard (Esc), animation, portal — all handled |
| Scroll debouncing | Custom setTimeout/clearTimeout | `useDebouncedCallback` from `use-debounce` | Already installed; handles cleanup, latest value semantics |
| Progress DB upsert | Custom SELECT + INSERT/UPDATE logic | `prisma.readingProgress.upsert` | Atomic; handles race conditions with unique constraint |
| Math rendering | Any client-side KaTeX render | Pre-rendered HTML + KaTeX CSS | Already done by ingest pipeline; no JS needed; no layout shift |
| Prose typography | Custom CSS for headers, lists, code | `@tailwindcss/typography` `prose` class | Optimized for rendered HTML you don't control; handles edge cases |

**Key insight:** The most expensive engineering traps in this phase are around scroll/progress tracking (debounce is critical) and KaTeX overflow (the double-scrollbar bug is non-obvious). Both have known solutions.

---

## Common Pitfalls

### Pitfall 1: KaTeX Display Math Double-Scrollbar

**What goes wrong:** Adding `overflow-x: auto` to `.katex` or `.katex-display` itself creates a vertical scrollbar because the element's reported height is less than its content height.

**Why it happens:** KaTeX's `.katex-display` has `display: block` and its internal `.katex` child is positioned in a way that overflows the parent's height measurement.

**How to avoid:** Apply overflow to a wrapper element, not the KaTeX elements themselves. Use Tailwind arbitrary variant:
```css
[&_.katex-display]:overflow-x-auto
[&_.katex-display]:overflow-y-hidden  /* optional: explicit to suppress vertical */
```

**Warning signs:** Equations scroll horizontally but a thin vertical scrollbar appears below the equation block.

**Source:** KaTeX GitHub Discussion #2942

### Pitfall 2: Layout Cannot Pass Data to Child Pages

**What goes wrong:** Developer tries to pass `book` data or `session` data from `[bookSlug]/layout.tsx` to `[chapterSlug]/page.tsx` via React Context or props.

**Why it happens:** Next.js App Router layouts wrap children but cannot pass props to page components. React Context requires "use client" which prevents async DB calls.

**How to avoid:** Each page fetches its own data. Use `React.cache()` or rely on Next.js fetch deduplication to avoid duplicate DB queries. For Prisma (not fetch-based), wrap with `React.cache`:
```typescript
import { cache } from "react";
export const getBookChapters = cache(async (slug: string) => {
  return prisma.book.findUnique({ where: { slug }, include: { chapters: true } });
});
```

**Warning signs:** `book` is undefined in the page component despite being fetched in the layout.

### Pitfall 3: Scroll Position Reset on Chapter Navigation

**What goes wrong:** User navigates to a new chapter, scroll position restores to the saved progress for the *previous* chapter because `ScrollProgressTracker` reads stale `initialScrollPercent`.

**Why it happens:** The client component remounts when the route changes (different `[chapterSlug]`), but if the key prop isn't used, React may reuse the instance.

**How to avoid:** The `page.tsx` passes `chapterId` as a key to `ScrollProgressTracker`:
```tsx
<ScrollProgressTracker key={chapter.id} ... initialScrollPercent={readingProgress?.scrollPercent} />
```
This forces a fresh mount with correct initial scroll on every chapter change.

**Warning signs:** After navigating chapters, the page jumps to the middle rather than the top.

### Pitfall 4: `useSelectedLayoutSegment` Returns Wrong Value

**What goes wrong:** `useSelectedLayoutSegment` called in a component inside `[bookSlug]/layout.tsx` returns `null` instead of the chapter slug.

**Why it happens:** `useSelectedLayoutSegment` returns the segment *one level below the layout it's called from*. If the component is nested deeper or in the wrong layout, it returns an unexpected value.

**How to avoid:** `TocNavLink` must be imported into `[bookSlug]/layout.tsx` (not `(reader)/layout.tsx`). The segment returned is `[chapterSlug]`'s value because that is one level below `[bookSlug]/layout`.

**Warning signs:** All ToC links appear inactive even when a chapter is open.

### Pitfall 5: access-control Bypass via Direct URL

**What goes wrong:** User directly navigates to `/read/paid-book/chapter-5` without purchasing.

**Why it happens:** proxy.ts only checks for a session cookie, not purchase rights. Layout-level auth only checks session.

**How to avoid:** The chapter `page.tsx` must perform the full access check (isOpenAccess OR isFreePreview OR hasPurchased). Never rely solely on proxy.ts for content authorization.

**Warning signs:** Content visible to users who haven't purchased — only detectable by testing with a logged-in non-purchaser.

### Pitfall 6: Mobile Viewport — Main Content Area Scroll

**What goes wrong:** On mobile, the entire page (including ToC bar) scrolls instead of just the content area. The top bar disappears on scroll and the user can't access the hamburger menu.

**Why it happens:** Using `overflow-y: auto` on `<body>` or a top-level div instead of only on the content region.

**How to avoid:** The reader layout uses `h-screen overflow-hidden` on the outer container, `overflow-y-auto` only on the `<main>` (content) element, and the top bar is fixed within the flex container (not `position: fixed`). This way only the content scrolls.

```html
<div class="flex flex-col h-screen overflow-hidden">
  <header class="flex-shrink-0 h-12 ...">...</header>  <!-- doesn't scroll -->
  <div class="flex flex-1 overflow-hidden">
    <aside class="overflow-y-auto ...">...</aside>     <!-- sidebar scrolls independently -->
    <main id="reader-content" class="flex-1 overflow-y-auto">...</main>
  </div>
</div>
```

---

## Code Examples

Verified patterns from official sources and the project codebase:

### Nested Dynamic Route Segment URL Structure

```
app/
└── (reader)/
    └── layout.tsx                     ← reader shell (no site header)
    └── read/
        └── [bookSlug]/
            ├── layout.tsx             ← fetches chapters, renders ToC sidebar
            ├── page.tsx               ← entry: redirect to last/first chapter
            └── [chapterSlug]/
                └── page.tsx           ← chapter content page
```

URLs produced:
- `/read/calculus-for-scientists` → redirects to chapter
- `/read/calculus-for-scientists/chapter-1` → renders chapter 1
- `/read/calculus-for-scientists/chapter-12` → renders chapter 12

### Prisma Upsert for Reading Progress

```typescript
// Source: ReadingProgress schema has @@unique([userId, bookId])
// Compound unique name generated by Prisma: userId_bookId
await prisma.readingProgress.upsert({
  where: {
    userId_bookId: {
      userId: session.user.id,
      bookId: bookId,
    },
  },
  update: {
    chapterId: chapterId,
    scrollPercent: scrollPercent,
  },
  create: {
    userId: session.user.id,
    bookId: bookId,
    chapterId: chapterId,
    scrollPercent: scrollPercent,
  },
});
```

### auth.api.getSession in Route Handler

```typescript
// Source: Better Auth Next.js docs, verified against project's dashboard/page.tsx pattern
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // proceed with session.user.id
}
```

### React.cache for Deduplicating Prisma Queries Across Layout and Page

```typescript
// src/lib/reader-queries.ts
import { cache } from "react";
import prisma from "@/lib/prisma";

export const getBookChapters = cache(async (bookSlug: string) => {
  return prisma.book.findUnique({
    where: { slug: bookSlug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      isOpenAccess: true,
      chapters: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, slug: true, position: true, isFreePreview: true },
      },
    },
  });
});
```

If `[bookSlug]/layout.tsx` and `[chapterSlug]/page.tsx` both call `getBookChapters(bookSlug)`, React.cache ensures only one Prisma query executes per request.

### KaTeX Overflow CSS

```css
/* Applied via Tailwind arbitrary variants on the article element */
.prose [class~="katex-display"] {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px; /* space for scrollbar */
}
```

In Tailwind class string:
```
className="prose prose-slate ... [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
```

---

## Design Recommendations (Claude's Discretion Items)

### Layout Structure

Recommendation: **Dedicated reader chrome** (no site header/footer) with a minimal top bar containing:
- Left: hamburger icon (mobile only, lg:hidden) + book title as a link back to `/catalog/[bookSlug]`
- Right: user avatar or sign-in link (optional, subtle)

Rationale: GitBook/Docusaurus feel — immersive reading environment. The content should dominate; navigation is secondary. The site header is too heavy (sticky with full brand nav) for a reading context.

### Content Width

Recommendation: `max-w-3xl` (768px) for the article text area, centered with generous padding (`px-6 lg:px-12 py-8 lg:py-12`). This is the standard comfortable reading measure for STEM text with math — not too wide (which causes eye-tracking fatigue) and wide enough for display-mode math equations.

### ToC Sidebar Behavior

Recommendation: **Always visible at lg+ (1024px+)**, collapsible to Sheet drawer on mobile/tablet. Width: `w-64 xl:w-72`. The sidebar shows chapter titles with position numbers; active chapter highlighted with primary color background tint. No "read" markers in v1 (deferred complexity, not in requirements).

### Progress Resume UX

Recommendation: **Silent resume** — no toast notification. When a returning user opens a book, they are server-redirected to their last chapter. Scroll position is silently restored after mount. A toast for every resume creates noise and obscures content.

If scroll position restoration happens > 500ms after page load (hydration delay), a brief CSS transition on `scroll-behavior` can smooth the jump.

### Visual Progress Indicator

Recommendation: A thin progress bar across the top of the reader content area (not the full page). 2px height, primary color, tracks scroll percentage within the current chapter. This is achieved via `ScrollProgressTracker` updating a CSS variable or a simple `<div>` width.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side KaTeX rendering (katex.render() in useEffect) | Server-side pre-rendered HTML + CSS import | This project already uses pre-rendered | No layout shift, no client JS for math, instant display |
| Pages Router API routes | App Router Route Handlers (route.ts) | Next.js 13+ | Same pattern but in `app/api/` directory with named HTTP method exports |
| next-auth (NextAuth.js) | better-auth | This project uses better-auth | `auth.api.getSession({ headers })` instead of `getServerSession()` |
| Custom scroll position tracking | `use-debounce` + scroll event | Already installed | Prevents DB hammering; clean cleanup |
| `params` as synchronous object | `params` as Promise (must await) | Next.js 15+, applies to 16 | ALL pages and layouts must `const { slug } = await params` |

**Deprecated/outdated:**
- Synchronous `params` access: `params.slug` (without await) — deprecated in Next.js 15+, will error in v16. Project already uses `await params` pattern (confirmed in catalog/[slug]/page.tsx).
- `getServerSideProps` / `getStaticProps` — Pages Router patterns; not applicable in App Router.

---

## Open Questions

1. **`@tailwindcss/typography` compatibility with KaTeX CSS**
   - What we know: The `prose` class resets many typographic defaults. KaTeX CSS uses specific class names (`.katex`, `.katex-display`). The preview page uses Tailwind arbitrary variants to override prose defaults.
   - What's unclear: Whether `prose` resets any KaTeX CSS properties (font-size, line-height inside `.katex`) that break rendering.
   - Recommendation: After installing the typography plugin, test with a math-heavy chapter. If KaTeX renders incorrectly, add `not-prose` to the `.katex-display` blocks or add override variants.

2. **Reader entry page redirect for anonymous users on open-access books**
   - What we know: Anonymous users reading open-access books have no `ReadingProgress`. The entry page should redirect to chapter 1.
   - What's unclear: Should the entry point `/read/[bookSlug]` also exist for anonymous users (no session)?
   - Recommendation: Yes — redirect anonymous users to chapter 1, authenticated to their last chapter (or chapter 1 if no progress). This matches the locked decision: "anonymous users reading open-access books do NOT get progress persistence."

3. **Prisma composite unique name for upsert**
   - What we know: Schema has `@@unique([userId, bookId])` on `ReadingProgress`. Prisma generates the compound key name as `userId_bookId`.
   - What's unclear: The exact generated name until `npx prisma generate` runs (project has migrations but generated client may not be updated).
   - Recommendation: Run `npx prisma generate` and verify in `@/generated/prisma/client` the exact compound unique field name before writing the upsert. If the name differs, the upsert will throw at runtime.

---

## Sources

### Primary (HIGH confidence)

- Next.js 16.1.6 official docs (fetched 2026-02-19) — Route Groups, layout.js, Dynamic Routes, useSelectedLayoutSegment, Route Handlers
- Better Auth Next.js integration docs (fetched 2026-02-19) — auth.api.getSession patterns for RSC and Route Handlers
- shadcn/ui Sheet component docs (fetched 2026-02-19) — installation, props, side variants
- @tailwindcss/typography GitHub README (fetched 2026-02-19) — Tailwind v4 installation (`@plugin`)
- Project codebase (read 2026-02-19) — confirmed: KaTeX CSS in root layout, pre-rendered chapter HTML, ReadingProgress schema, auth patterns, `use-debounce` installed, `dangerouslySetInnerHTML` in preview page

### Secondary (MEDIUM confidence)

- KaTeX GitHub Discussion #2942 — verified KaTeX overflow-x double-scrollbar issue and fix (target containing div)
- Prisma upsert docs (WebSearch → Prisma docs URL confirmed) — `upsert` with composite unique where clause structure

### Tertiary (LOW confidence — flag for validation)

- @tailwindcss/typography interaction with KaTeX CSS: inferred from project patterns but not directly tested in this codebase. Validate during implementation.
- `prose` class defaults not overriding KaTeX span sizes: based on KaTeX's high-specificity class selectors, assessed as unlikely to conflict — needs visual testing.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages either installed or well-documented with confirmed Next.js 16.1.6 patterns
- Architecture: HIGH — route group pattern, nested layout with params, useSelectedLayoutSegment all verified against official docs
- Pitfalls: HIGH for layout/scroll patterns (verified with docs); MEDIUM for KaTeX+prose interaction (needs testing)
- Access control: HIGH — follows established project pattern from dashboard/page.tsx

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable stack; 30-day window)
