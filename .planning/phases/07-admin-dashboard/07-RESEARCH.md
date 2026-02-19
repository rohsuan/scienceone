# Phase 7: Admin Dashboard - Research

**Researched:** 2026-02-19
**Domain:** Next.js admin UI, file upload, ingest pipeline integration, role-based access
**Confidence:** HIGH (core patterns verified against official docs and Context7)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dashboard layout
- Data table for the book list — rows with columns: title, status, access model, available formats (PDF/EPUB), date, actions
- Dense, scannable, sortable — designed for managing ~20 books

#### Upload & ingest UX
- Re-ingest supported with a confirmation dialog — founder can re-upload a corrected manuscript to replace existing chapters and artifacts
- Upload pattern, progress display, and error presentation are Claude's discretion

#### Metadata editing
- Manual save button — edit fields freely, click Save when ready
- Synopsis and author bio fields use plain text / Markdown — rendered as markdown on the public site
- Cover image handling and form field organization are Claude's discretion

#### Publish workflow
- Draft → Published workflow — books start as draft after ingest, must be explicitly published
- Unpublishing keeps purchaser access — book disappears from catalog and search, but purchasers can still read and download
- No publish validation gate — founder can publish whenever they want, even with incomplete fields (trust the curator)

### Claude's Discretion
- Admin page navigation structure (single page vs separate pages, route layout)
- Admin layout (reuse site layout vs dedicated admin layout)
- Upload pattern (drag-and-drop vs file picker)
- Ingest progress display (step-by-step vs simple spinner)
- Error presentation (inline health report vs summary + downloadable log)
- Cover image upload flow (live preview vs upload-on-save)
- Form field organization (tabbed sections vs single scrollable form)
- Preview experience (reuse existing reader vs inline panel)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-03 | Publisher can manage book metadata: cover image, ISBN, author bio/photo, synopsis, categories/tags, table of contents, print info (page count, dimensions), and print purchase link | Server Actions with react-hook-form + Zod for validation; Prisma update for all Book fields; cover image via presigned R2 upload |
| ADM-04 | Publisher can set access model per book (pay-per-book or open access) | isOpenAccess boolean already in Book schema; simple select/switch in metadata form; Server Action updates Book record |
| ADM-05 | Publisher can preview ingested content before publishing | Reuse existing reader route `/read/[bookSlug]/[chapterSlug]`; preview works for unpublished books via admin-gated query |
| ADM-06 | Publisher has a browser-based admin dashboard for uploading and managing books | TanStack Table for book list; presigned URL upload → R2 → ingest API route; IngestJob table for polling-based status |
</phase_requirements>

## Summary

Phase 7 requires building a complete admin dashboard with four interconnected surfaces: a book list data table, a book detail/edit form, an upload+ingest flow, and a preview path into the reader. The existing codebase already has the ingest pipeline as CLI modules in `scripts/lib/` and an R2 client in `src/lib/r2.ts` — the main work is wiring these into browser-accessible API routes and building the UI.

The recommended architecture is a dedicated `(admin)` route group with its own layout, separate from the `(main)` layout. The book list uses TanStack Table v8 via shadcn's Data Table component. The ingest flow uses a presigned URL for the manuscript upload to R2 (bypassing Next.js body limits), then an API route triggers the pipeline via Node.js `child_process.spawn()`, with status persisted to a new `IngestJob` Prisma model that the client polls. Admin protection uses `session.user.role === "admin"` checked in both proxy.ts (for early redirect) and each server component/action (defense in depth).

**Primary recommendation:** Dedicated `(admin)` route group + TanStack Table + presigned upload → ingest API route + IngestJob polling. No external queues needed for a single-founder tool running on self-hosted infra.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | 8.21.3 | Headless table with sorting, filtering, pagination | Official shadcn/ui Data Table integration; React 19 compatible |
| react-dropzone | 15.0.0 | Drag-and-drop file input | Minimal dependency, React hook-based, widely used |
| react-hook-form | 7.x (already installed) | Form state management | Already in project; pairs with Zod already installed |
| zod | 4.x (already installed) | Schema validation | Already in project; supports `z.instanceof(File)` for file validation |

### shadcn/ui Components Needed

All installed via `npx shadcn@canary add <component>` (canary required for Tailwind v4):

| Component | Purpose |
|-----------|---------|
| table | Base for TanStack Data Table rendering |
| dialog | Book create modal, re-ingest confirmation dialog |
| alert-dialog | Destructive confirmation (re-ingest replaces all chapters) |
| textarea | Synopsis, author bio (plain text/Markdown) |
| select | Access model picker, category selector |
| switch | Toggle: published/unpublished, open access |
| badge | Status indicators (draft, published, processing, error) |
| progress | Upload progress bar |
| tabs | Form field organization (Details / Content / Publishing) |
| skeleton | Loading states in table and form |
| separator | Visual dividers in form layout |

### Already Installed (No New Install Needed)

| Library | Already Provides |
|---------|-----------------|
| @aws-sdk/client-s3 | PutObjectCommand for presigned upload URL generation |
| @aws-sdk/s3-request-presigner | getSignedUrl for presigned PutObject |
| react-hook-form + @hookform/resolvers | Form state and Zod integration |
| zod | Schema validation |
| sonner | Toast notifications (replaces deprecated shadcn toast) |
| lucide-react | Icons |

### New Packages to Install

```bash
npm install @tanstack/react-table react-dropzone
npx shadcn@canary add table dialog alert-dialog textarea select switch badge progress tabs skeleton separator
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/
├── (admin)/
│   ├── layout.tsx              # Admin shell: sidebar nav + auth guard
│   └── admin/
│       ├── page.tsx            # Book list (data table)
│       ├── books/
│       │   ├── new/
│       │   │   └── page.tsx    # Create book form (metadata only, no file yet)
│       │   └── [bookId]/
│       │       ├── page.tsx    # Book detail / edit form
│       │       └── ingest/
│       │           └── page.tsx # Upload + ingest status page
src/app/api/
├── admin/
│   ├── books/
│   │   ├── route.ts            # GET (list all), POST (create book)
│   │   └── [bookId]/
│   │       ├── route.ts        # GET, PUT (update metadata), DELETE
│   │       └── publish/
│   │           └── route.ts    # POST (toggle publish state)
│   ├── ingest/
│   │   ├── upload-url/
│   │   │   └── route.ts        # POST: generate presigned PUT URL for manuscript
│   │   └── [jobId]/
│   │       └── route.ts        # GET: poll IngestJob status
│   └── ingest-start/
│       └── route.ts            # POST: spawn ingest pipeline, create IngestJob record
src/lib/
├── admin-queries.ts            # getAllBooks(), getBookAdmin(), etc. (no isPublished filter)
└── admin-actions.ts            # Server Actions: updateBook, togglePublish, createBook
src/components/admin/
├── BookTable.tsx               # TanStack Table with columns for admin book list
├── BookTableColumns.tsx        # Column definitions
├── BookEditForm.tsx            # react-hook-form for all metadata fields
├── IngestUploader.tsx          # react-dropzone + progress + polling
└── IngestStatus.tsx            # Status display component
```

### Pattern 1: Dedicated Admin Route Group

**What:** A `(admin)` route group with its own layout — completely separate from the `(main)` consumer layout with Header/Footer.

**Why:** The admin UI needs a sidebar for navigation between the book list and individual book editing. The consumer Header/Footer is irrelevant here. Following the same pattern as `(auth)` which already has its own isolated layout.

**Auth guard:** Check `session.user.role === "admin"` in the layout. Defense-in-depth: also check in each server component and Server Action.

```typescript
// src/app/(admin)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**proxy.ts extension:** Add `/admin/:path*` to the matcher to redirect non-session users before hitting the layout:

```typescript
// proxy.ts (extend existing)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

Note: `getSessionCookie` only verifies cookie presence, not role. Role check must happen in layout/server components (not proxy alone).

### Pattern 2: TanStack Table for Book List

**What:** Client-side sortable/filterable table using `@tanstack/react-table` with shadcn's table primitives.

**When to use:** ~20 books fits in a single fetch — no server-side pagination needed. All sort/filter happens client-side.

**Column definitions pattern:**

```typescript
// Source: https://ui.shadcn.com/docs/components/data-table
import { ColumnDef } from "@tanstack/react-table"
import type { BookAdminRow } from "@/lib/admin-queries"

export const columns: ColumnDef<BookAdminRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Title <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isPublished") ? "default" : "secondary"}>
        {row.getValue("isPublished") ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    accessorKey: "isOpenAccess",
    header: "Access",
    cell: ({ row }) => row.getValue("isOpenAccess") ? "Open" : "Paid",
  },
  {
    id: "formats",
    header: "Formats",
    cell: ({ row }) => (
      <>
        {row.original.pdfKey && <Badge>PDF</Badge>}
        {row.original.epubKey && <Badge>EPUB</Badge>}
      </>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => new Date(row.getValue("updatedAt")).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => <BookRowActions book={row.original} />,
  },
]
```

### Pattern 3: Presigned Upload → Ingest Pipeline Flow

**What:** The browser uploads the manuscript directly to R2 via a presigned PUT URL. The Next.js server never receives the file bytes. After R2 upload completes, a separate API call triggers the ingest pipeline.

**Why presigned over direct upload through API route:**
- Server Actions have a 1MB default body size limit (configurable, but manuscripts can be tens of MB)
- Direct upload through Next.js routes requires buffering the entire file in server memory
- Presigned URL uploads bypass both limits and match the existing R2 download pattern

**Flow:**

```
Client → POST /api/admin/ingest/upload-url → server generates PutObjectCommand presigned URL → returns { uploadUrl, r2Key }
Client → PUT uploadUrl (XHR with progress tracking, sends file directly to R2)
Client → POST /api/admin/ingest-start { bookId, r2Key } → server spawns ingest pipeline → creates IngestJob → returns { jobId }
Client → GET /api/admin/ingest/{jobId} (poll every 2s) → returns { status, progress, error }
```

**Presigned PUT URL generation (server):**

```typescript
// src/app/api/admin/ingest/upload-url/route.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client } from "@/lib/r2";

export async function POST(request: Request) {
  // Auth check: role === "admin"
  const { bookId, fileName, contentType } = await request.json();
  const key = `uploads/manuscripts/${bookId}/${Date.now()}-${fileName}`;

  const url = await getSignedUrl(
    createR2Client(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 } // 1 hour for large file uploads
  );

  return Response.json({ uploadUrl: url, r2Key: key });
}
```

**Client upload with XHR progress tracking:**

```typescript
// In IngestUploader.tsx client component
function uploadToR2(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
```

### Pattern 4: IngestJob Model for Status Polling

**What:** A new `IngestJob` Prisma model that stores pipeline status. The ingest API route creates a job record, spawns the pipeline as a child process, and updates the record as the process progresses.

**Why polling over SSE/WebSocket:** Single founder using a self-hosted app. Polling with 2s interval is simple and sufficient. No infrastructure complexity.

**New Prisma model to add:**

```prisma
model IngestJob {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  r2Key     String                          // manuscript key in R2 staging area
  status    String   @default("pending")   // pending | processing | success | error
  progress  String?                         // JSON: { step: "html_convert", pct: 25 }
  error     String?  @db.Text              // error message or health report JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("ingest_jobs")
}
```

And add to Book model: `ingestJobs IngestJob[]`

**Spawn pattern in ingest-start API route:**

```typescript
// src/app/api/admin/ingest-start/route.ts
import { spawn } from "child_process";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  // Auth check
  const { bookId, r2Key } = await request.json();

  const job = await prisma.ingestJob.create({
    data: { bookId, r2Key, status: "pending" },
  });

  // Spawn ingest pipeline as a detached child process
  // The pipeline downloads the manuscript from R2, runs the 6-step pipeline, writes to DB
  const proc = spawn(
    "npx",
    ["tsx", "scripts/ingest.ts", "--book-id", bookId, "--r2-key", r2Key, "--job-id", job.id],
    { detached: true, stdio: "ignore" }
  );
  proc.unref(); // Don't keep server alive for this process

  await prisma.ingestJob.update({
    where: { id: job.id },
    data: { status: "processing" },
  });

  return Response.json({ jobId: job.id });
}
```

**IMPORTANT:** The existing `scripts/ingest.ts` takes a local file path (`--input`), not an R2 key. The ingest pipeline needs a small wrapper to: (1) download the manuscript from R2 to a temp file, (2) run the existing pipeline, (3) clean up the temp file. Alternatively, add an `--r2-key` option to ingest.ts that handles the download step. Either way, this is a scripts-layer change, not a core pipeline change.

### Pattern 5: Book Metadata Form with React Hook Form

**What:** A single scrollable form with tabbed sections (Details / Content / Publishing) using react-hook-form + Zod + Server Actions for save.

**Form sections:**
- **Details tab:** title, slug, authorName, ISBN, pageCount, dimensions, printLink
- **Content tab:** synopsis (Textarea), authorBio (Textarea), authorImage (file upload), coverImage (file upload)
- **Publishing tab:** isPublished (Switch), isOpenAccess (Switch), categories (multi-select), price

**Server Action pattern:**

```typescript
// src/lib/admin-actions.ts
"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBook(bookId: string, data: BookUpdateInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  await prisma.book.update({ where: { id: bookId }, data });
  revalidatePath("/admin");
  revalidatePath(`/admin/books/${bookId}`);
}
```

**Cover/author image upload:** Use same presigned URL pattern as manuscripts (smaller files, could use server action, but keeping consistent). Generate presigned PUT URL for `images/{bookId}/cover.jpg`, upload client-side, then store the R2 key in the book record on save.

### Pattern 6: Preview Unpublished Books

**What:** Reuse the existing `/read/[bookSlug]/[chapterSlug]` reader, but allow the admin to access unpublished books.

**Current reader state:** `getBookChapters` queries `where: { slug: bookSlug, isPublished: true }` — this blocks preview of unpublished books.

**Solution:** Add an admin bypass to the reader queries, or create a separate `/admin/books/[bookId]/preview` route that renders the same chapter component without the `isPublished` filter.

**Recommended approach:** Create `/admin/books/[bookId]/preview/[chapterSlug]` page that calls `getChapterAdmin()` (no isPublished filter) and renders the chapter content with the same `dangerouslySetInnerHTML` pattern. This avoids modifying the public reader's auth logic.

### Anti-Patterns to Avoid

- **Passing file bytes through Server Actions:** Server Actions have 1MB default body limit. Use presigned URLs for all file uploads. Set `next.config.ts` `serverActions.bodySizeLimit` only if needed for small metadata uploads.
- **Running ingest synchronously in API route:** Pandoc + xelatex can take 30-120 seconds per book. Always run via spawn() with status polling.
- **Relying solely on proxy.ts for admin role checks:** `getSessionCookie` only checks cookie existence, not role. Always check `session.user.role === "admin"` in layout and individual server components/actions.
- **Exposing admin APIs without role check:** Every `/api/admin/*` route must independently verify admin role — don't assume proxy already filtered.
- **Using client-side navigation for presigned uploads:** XHR is required for upload progress events. `fetch()` does not support upload progress tracking.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable/filterable table | Custom table with useState sort | @tanstack/react-table | Column pinning, virtual rows, accessible keyboard nav |
| File drag-drop zone | Custom ondragover/ondrop | react-dropzone | MIME type filtering, multiple files, touch support, accessibility |
| Form validation | Manual validation functions | react-hook-form + Zod | Already installed; type-safe schemas; async server validation pattern |
| Upload progress | Manual byte counting | XHR upload.onprogress | Native browser API, no dependencies |
| Status polling | WebSocket or SSE | setInterval + fetch | Simple enough for single-user tool; no infra complexity |

**Key insight:** This phase is heavy on UI composition, not novel infrastructure. The hard parts (ingest pipeline, R2 upload, auth) are already built — the work is wiring them together and building the table/form UI.

---

## Common Pitfalls

### Pitfall 1: IngestJob Status Never Updates on Error
**What goes wrong:** Ingest pipeline crashes or errors; job stays in "processing" state forever.
**Why it happens:** `proc.unref()` disconnects the parent from the child — errors in the child process don't propagate to the API route.
**How to avoid:** The ingest script must write its own status to the IngestJob record — both success (`status: "success"`) and all error paths (`status: "error", error: message`). Add try/catch wrapping the full pipeline in the CLI script with a final status write.
**Warning signs:** Job polling returns "processing" after >5 minutes.

### Pitfall 2: Presigned URL CORS on R2
**What goes wrong:** Browser PUT to presigned R2 URL fails with CORS error.
**Why it happens:** R2 bucket doesn't have CORS configured for the app domain.
**How to avoid:** Configure CORS on the R2 bucket to allow PUT from the app's origin. Add `PUT` to AllowedMethods in R2 CORS settings. This is a deployment config step, not code.
**Warning signs:** Browser console shows "Access-Control-Allow-Origin" error on the PUT request.

### Pitfall 3: Book Table Data Shows Stale Data After Edit
**What goes wrong:** Admin edits a book, saves, returns to list — table shows old data.
**Why it happens:** Next.js caches the admin book list page; Server Action doesn't revalidate it.
**How to avoid:** Call `revalidatePath("/admin")` and `revalidatePath("/catalog")` in all Server Actions that mutate book data.

### Pitfall 4: Manuscript R2 Key Collision on Re-Ingest
**What goes wrong:** Re-ingest with a new manuscript overwrites the URL but the ingest still runs against the old file.
**Why it happens:** R2 PUT presigned URL is scoped to a specific key. If the UI reuses the same key for re-uploads (e.g., `uploads/manuscripts/{bookId}/manuscript.tex`), there's a race condition between the upload completing and the ingest starting.
**How to avoid:** Include a timestamp in the R2 key: `uploads/manuscripts/{bookId}/{timestamp}-{filename}`. The ingest job stores the exact key used.

### Pitfall 5: Publishing Books with No Chapters
**What goes wrong:** Founder publishes a book before ingest runs; readers see a book with no chapters.
**Why it happens:** No publish validation gate by design (locked decision: "trust the curator").
**How to avoid:** This is intentional per the locked decision. No code change needed. Consider a non-blocking warning badge in the UI if `chapters.count === 0` but don't block publishing.

### Pitfall 6: Admin Preview Reveals Unpublished Books to Public
**What goes wrong:** Admin preview URL leaks to a public user.
**Why it happens:** Preview route for unpublished books is under `/admin/` which is admin-protected, but if the reader route `/read/[bookSlug]` is extended to skip the isPublished filter, it becomes publicly accessible.
**How to avoid:** Keep preview as a distinct route under `(admin)` group. Never modify the public reader to skip `isPublished: true` — create a separate admin preview route that independently verifies admin role.

### Pitfall 7: Prisma 7 generate not run after migration
**What goes wrong:** TypeScript errors on new IngestJob type after adding to schema.
**Why it happens:** Prisma 7 no longer auto-runs `prisma generate` after `migrate dev`.
**How to avoid:** Explicitly run `npx prisma generate` after `npx prisma migrate dev` when adding the IngestJob model.

---

## Code Examples

### Admin Book List Query (no isPublished filter)

```typescript
// src/lib/admin-queries.ts
import prisma from "@/lib/prisma";

export async function getAllBooksAdmin() {
  return prisma.book.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { include: { category: true } },
      pricing: true,
      _count: { select: { chapters: true } },
    },
  });
}

export type BookAdminRow = Awaited<ReturnType<typeof getAllBooksAdmin>>[number];
```

### Admin-Only Chapter Preview Query

```typescript
// src/lib/admin-queries.ts (continued)
export async function getChapterAdmin(bookId: string, chapterSlug: string) {
  return prisma.chapter.findFirst({
    where: { slug: chapterSlug, bookId },
    include: {
      book: { select: { title: true, slug: true } },
    },
  });
}
```

### Book Publish/Unpublish Server Action

```typescript
// src/lib/admin-actions.ts
"use server"
export async function togglePublish(bookId: string, publish: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  await prisma.book.update({
    where: { id: bookId },
    data: { isPublished: publish },
  });

  // Revalidate public catalog and admin list
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath(`/admin/books/${bookId}`);
}
```

### IngestJob Polling Hook

```typescript
// src/components/admin/useIngestStatus.ts
"use client"
import { useEffect, useState } from "react";

export type IngestStatus = "pending" | "processing" | "success" | "error";

export function useIngestStatus(jobId: string | null) {
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/ingest/${jobId}`);
      const data = await res.json();
      setStatus(data.status);
      if (data.error) setError(data.error);
      if (data.status === "success" || data.status === "error") {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  return { status, error };
}
```

### TanStack Table Setup

```typescript
// src/components/admin/BookTable.tsx
"use client"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { columns } from "./BookTableColumns";
import type { BookAdminRow } from "@/lib/admin-queries";

export function BookTable({ data }: { data: BookAdminRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  // render with shadcn Table/TableBody/TableRow/TableCell primitives
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `middleware.ts` | `proxy.ts` with `export function proxy` | Next.js 16 renamed — already in use in this codebase |
| `react-table` v7 | `@tanstack/react-table` v8 | Completely different API — only v8 (TanStack) is current |
| API body size for file upload | Presigned URL upload to R2 | Bypasses server memory limits entirely |
| `prisma generate` auto-run | Must run manually in Prisma 7 | Already a known decision in STATE.md |

**Deprecated/outdated:**
- `@tanstack/react-table` v7 (react-table): Completely rewritten in v8 — do not use old docs
- shadcn `toast` component: Replaced by `sonner` in canary — already using sonner in this project
- `next/cache: revalidatePath` with `type: 'layout'` param: Unnecessary for app router pages, default 'page' is correct

---

## Recommendations for Claude's Discretion Areas

### Admin navigation structure: Dedicated `(admin)` route group
- Single `layout.tsx` with a compact left sidebar (book list, create book)
- Two main sections: `/admin` (book list) and `/admin/books/[bookId]` (edit)
- Route `/admin/books/[bookId]/ingest` for upload+status
- Reason: Keeps admin UI isolated; consistent with `(auth)` and `(reader)` pattern already in the codebase

### Upload pattern: Drag-and-drop + file picker
- react-dropzone gives both: click to open file picker AND drag-and-drop
- Accept: `.tex, .docx, .md, .markdown`
- Single file only (one manuscript per ingest)

### Ingest progress display: Step-by-step with named stages
- The ingest pipeline has 6 named steps (HTML convert, math render, chapter split, health report, PDF, EPUB)
- Display named steps as they complete — more useful than a spinner for a technical founder
- Implementation: IngestJob.progress stores `{ step: string, pct: number }` JSON
- The ingest script writes to IngestJob at each step completion

### Error presentation: Inline health report
- Display the structured `HealthReport` fields directly in the UI (math errors, pandoc warnings, unsupported commands)
- The `HealthReport` interface is already defined in `scripts/lib/health-report.ts`
- Store serialized HealthReport JSON in `IngestJob.error` when `report.halted === true`

### Cover image upload: Upload-on-save
- Cover image is part of the metadata form
- On form save, if a new image file is selected: (1) generate presigned PUT URL, (2) upload to R2, (3) store key in form state, (4) save book record with new key
- Simpler than live preview; avoids orphaned R2 objects from abandoned form sessions

### Form field organization: Tabbed sections
- Tab 1 "Details": title, slug, authorName, ISBN, pageCount, dimensions, printLink
- Tab 2 "Content": coverImage, synopsis, authorBio, authorImage
- Tab 3 "Publishing": isPublished, isOpenAccess, categories, price
- Keeps form scannable without scrolling through 12+ fields

### Preview experience: Reuse reader via separate admin route
- Route: `/admin/books/[bookId]/preview` → redirects to `/admin/books/[bookId]/preview/[firstChapterSlug]`
- Renders chapter content with the same `dangerouslySetInnerHTML` pattern as the public reader
- No `isPublished` filter in the query
- Includes navigation between chapters

---

## Open Questions

1. **IngestJob progress updates from CLI process**
   - What we know: The CLI script runs as a spawned child process (`proc.unref()` disconnects it from the server)
   - What's unclear: How the child process writes IngestJob status updates back to the database without importing from `src/` (the script currently imports from `scripts/lib/`)
   - Recommendation: The scripts already import from `src/lib/prisma` via `scripts/lib/db-write.ts`. The ingest script should call a new `updateIngestJob(jobId, status, progress?)` function added to `scripts/lib/db-write.ts`. No architectural changes needed.

2. **Manuscript temp file location after R2 download**
   - What we know: The existing ingest pipeline takes a local file path (`--input <path>`)
   - What's unclear: Where to write the temp manuscript file downloaded from R2 (needs write access)
   - Recommendation: Use `os.tmpdir()` + `crypto.randomUUID()` for a unique temp path. Clean up with `fs.unlink()` in the ingest script's finally block.

3. **Category management**
   - What we know: Categories exist in the DB; `BookCategory` join table exists
   - What's unclear: Whether the admin needs to create new categories from the dashboard, or just assign existing ones
   - Recommendation: Build a multi-select component for assigning existing categories. Creating new categories can be a simple inline form in the same component (type a name, press Enter). No separate category management page needed.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs (fetched 2026-02-16): Server Actions body size limits, FormData handling, route handler patterns
- shadcn/ui official docs (fetched 2026-02-19): Data Table component structure, available components list
- Better Auth official docs (fetched 2026-02-19): Admin plugin API, role checking, proxy.ts integration
- Existing codebase analysis: Prisma schema, scripts/ingest.ts, scripts/lib/*, proxy.ts, r2.ts

### Secondary (MEDIUM confidence)
- @tanstack/react-table v8 npm (verified current version 8.21.3)
- react-dropzone npm (verified current version 15.0.0)
- WebSearch: presigned URL upload pattern for R2 (multiple consistent sources, 2024-2025)
- WebSearch: TanStack Table + shadcn Data Table (multiple consistent sources)

### Tertiary (LOW confidence)
- WebSearch: child_process.spawn patterns for long-running tasks in Next.js (limited direct sources; core Node.js pattern is stable)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified package versions from npm; shadcn components verified from official docs
- Architecture: HIGH — patterns derived from existing codebase structure + official Next.js patterns
- Ingest integration: MEDIUM — spawn pattern is standard Node.js; IngestJob polling is straightforward; specific R2 download in CLI script needs implementation work
- Pitfalls: HIGH — R2 CORS, Prisma 7 generate, presigned URL CORS are all known issues from prior phases and official sources

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable stack; shadcn canary moves fast, re-verify component names if delayed)
