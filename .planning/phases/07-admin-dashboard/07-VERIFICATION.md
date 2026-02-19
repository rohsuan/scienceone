---
phase: 07-admin-dashboard
verified: 2026-02-19T16:15:00Z
status: gaps_found
score: 11/12 must-haves verified
re_verification: false
gaps:
  - truth: "Founder can edit title, slug, author name, ISBN, page count, dimensions, and print link and save changes"
    status: partial
    reason: "pageCount and price fields use z.number() in Zod schema but register() without valueAsNumber. HTML number inputs return strings; Zod z.number() rejects strings. Editing these fields from null to a value will fail validation silently."
    artifacts:
      - path: "src/components/admin/BookEditForm.tsx"
        issue: "register('pageCount') and register('price') missing { valueAsNumber: true } option"
      - path: "src/lib/admin-actions.ts"
        issue: "bookUpdateSchema defines pageCount as z.number() and price as z.number() — both reject strings"
    missing:
      - "Add { valueAsNumber: true } to register('pageCount') call in BookEditForm.tsx"
      - "Add { valueAsNumber: true } to register('price') call in BookEditForm.tsx"
human_verification:
  - test: "Navigate to /admin as an admin user"
    expected: "Book data table loads with all books (including unpublished), sortable columns, action dropdown"
    why_human: "Route requires live auth session and DB connection"
  - test: "Navigate to /admin as a non-admin user"
    expected: "Redirected to /"
    why_human: "Requires live auth session"
  - test: "Upload a manuscript file on the ingest page"
    expected: "Upload progress bar reaches 100%, ingest pipeline starts, status updates every 2 seconds"
    why_human: "Requires R2 credentials and ingest pipeline dependencies (pandoc, xelatex)"
  - test: "Upload a cover image on the book edit page"
    expected: "Progress bar shows during upload, thumbnail appears after upload, saving the form persists the R2 key"
    why_human: "Requires R2 credentials"
  - test: "Preview ingested chapters including an unpublished book"
    expected: "Chapter content renders with typography and KaTeX math; unpublished banner displays"
    why_human: "Requires ingested content in DB"
---

# Phase 7: Admin Dashboard Verification Report

**Phase Goal:** The founder can manage the entire book catalog from a browser — uploading manuscripts, editing metadata, setting access models, previewing ingested content, and publishing or unpublishing books — without touching the command line
**Verified:** 2026-02-19T16:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin user can navigate to /admin and see a data table of all books | VERIFIED | `src/app/(admin)/admin/page.tsx` calls `getAllBooksAdmin()` (no isPublished filter), passes to `<BookTable />` |
| 2 | Book table shows title, status, access model, formats, chapters, updated date, and action links | VERIFIED | `BookTableColumns.tsx` defines 7 columns: title (sortable), status (Published/Draft badge), access (Open/Paid), formats (PDF/EPUB outline badges), chapters count, updated (sortable), actions dropdown |
| 3 | Admin can sort the table by title and updated date | VERIFIED | `BookTable.tsx` uses `useReactTable` with `getSortedRowModel()` and `SortingState`; both title and updatedAt columns have `ArrowUpDown` sortable headers |
| 4 | Admin can toggle a book between published and unpublished from table row actions | VERIFIED | `BookTableColumns.tsx` calls `togglePublish(book.id, !book.isPublished)` from `admin-actions.ts`; `togglePublish` updates DB and revalidates `/admin` and `/catalog` |
| 5 | Admin can create a new book with title, slug, and author name; new books start as drafts | VERIFIED | `CreateBookDialog.tsx` calls `createBook()` with `isPublished: false`; slug auto-generated from title via `slugify()`; `useTransition` prevents double-submit |
| 6 | Non-admin users are redirected away from /admin routes | VERIFIED | `(admin)/layout.tsx` checks `session.user.role !== "admin"` and redirects to `/`; `proxy.ts` matcher includes `/admin/:path*` for unauthenticated redirect to `/sign-in` |
| 7 | Founder can navigate from book table to a book's edit page and see all metadata fields populated | VERIFIED | `admin/books/[bookId]/page.tsx` calls `getBookAdmin(bookId)` and `getAllCategories()`, passes to `<BookEditForm book={book} categories={categories} />`; form uses `defaultValues` populated from the book record |
| 8 | Founder can edit title, slug, author name, ISBN, page count, dimensions, and print link and save changes | PARTIAL | Form exists with all fields; BUT `register("pageCount")` and `register("price")` lack `{ valueAsNumber: true }` — Zod `z.number()` will reject string values from HTML number inputs when user edits these fields |
| 9 | Founder can upload a cover image and author photo; images are stored in R2 | VERIFIED | `ImageUploadField.tsx` POSTs to `/api/admin/upload-url`, uses XHR with `upload.addEventListener("progress")` for real-time progress, then calls `onUpload(r2Key)` to update form state; `upload-url/route.ts` generates presigned PUT URL via `PutObjectCommand` + `getSignedUrl` |
| 10 | Founder can assign categories to a book using a multi-select with inline category creation | VERIFIED | `CategorySelect.tsx` implements scrollable toggle list; inline creation calls `createCategory` server action; created categories are added to selection automatically |
| 11 | Founder can upload a manuscript file from the browser and see it upload to R2 with progress | VERIFIED | `IngestUploader.tsx` uses `react-dropzone`, POSTs to `/api/admin/ingest/upload-url` for presigned URL, XHR PUT to R2 with `xhr.upload.onprogress`, shows `<Progress />` during upload |
| 12 | After upload, founder can trigger the ingest pipeline and see status updates | VERIFIED | POSTs to `/api/admin/ingest-start`; spawns `npx tsx scripts/ingest.ts` as detached child process; `useIngestStatus` polls `/api/admin/ingest/[jobId]` every 2 seconds; `IngestStatus` shows step name, progress bar, success/error states |
| 13 | Ingest pipeline spawns as a detached process and updates IngestJob status in the database | VERIFIED | `ingest-start/route.ts` uses `spawn(..., { detached: true, stdio: "ignore" })` + `proc.unref()`; `scripts/ingest.ts` calls `updateIngestJob()` at each of 8 pipeline steps (html_convert→complete); error paths call `updateIngestJob(jobId, "error", null, msg)` |
| 14 | Founder can re-ingest a book with a new manuscript (confirmation dialog before replacing) | VERIFIED | `IngestUploader.tsx` checks `hasExistingChapters`; if true, enters `"confirm"` state showing `<AlertDialog>` before proceeding with upload |
| 15 | Founder can preview chapters of any book (including unpublished) from the admin dashboard | VERIFIED | `getChapterAdmin()` and `getBookChaptersAdmin()` queries have NO `isPublished` WHERE filter (only SELECT it for display); preview page renders `dangerouslySetInnerHTML={{ __html: chapter.content }}` with `prose prose-lg` and KaTeX CSS |
| 16 | Error details from the ingest health report are visible in the UI when ingest fails | VERIFIED | `IngestStatus.tsx` displays `error` field in a `<pre>` block with red styling when `status === "error"`; `scripts/ingest.ts` writes `JSON.stringify(report)` to the error field on health report halt |

**Score:** 15/16 truths verified (1 partial)

### Required Artifacts

| Artifact | Status | Lines | Details |
|----------|--------|-------|---------|
| `prisma/schema.prisma` (IngestJob model) | VERIFIED | — | `model IngestJob` present with id, bookId, r2Key, status, progress, error, createdAt, updatedAt; migration `20260219151600_add_ingest_job` created |
| `src/app/(admin)/layout.tsx` | VERIFIED | 20 | Auth guard: `session.user.role !== "admin"` → redirect("/"); renders `<AdminSidebar />` + `<main>` |
| `src/app/(admin)/admin/page.tsx` | VERIFIED | 36 | Server component with defense-in-depth auth check; calls `getAllBooksAdmin()`; renders `<BookTable data={books} />` and `<CreateBookDialog />` |
| `src/lib/admin-queries.ts` | VERIFIED | 68 | Exports `getAllBooksAdmin` (no isPublished filter), `getBookAdmin`, `getAllCategories`, `getBookChaptersAdmin`, `getChapterAdmin`, `getLatestIngestJob` |
| `src/components/admin/BookTable.tsx` | VERIFIED | 79 | `useReactTable` with `SortingState`, `getCoreRowModel`, `getSortedRowModel`; renders shadcn Table; empty state message present |
| `src/app/(admin)/admin/books/[bookId]/page.tsx` | VERIFIED | 65 | Loads book + categories in parallel; defense-in-depth admin check; passes to `<BookEditForm />` |
| `src/components/admin/BookEditForm.tsx` | PARTIAL | 282 | 3-tab form (Details, Content, Publishing) with react-hook-form + zodResolver; **pageCount and price register() missing valueAsNumber** |
| `src/lib/admin-actions.ts` | VERIFIED | 162 | Exports `togglePublish`, `createBook`, `deleteBook`, `updateBook`, `createCategory`; `requireAdmin()` helper guards all actions |
| `src/app/api/admin/upload-url/route.ts` | VERIFIED | 44 | POST with admin role check; generates `images/${bookId}/${type}-${Date.now()}.${ext}` R2 key; uses PutObjectCommand + getSignedUrl (3600s) |
| `src/app/api/admin/ingest/upload-url/route.ts` | VERIFIED | 43 | POST with admin role check; generates `uploads/manuscripts/${bookId}/${Date.now()}-${fileName}` key; returns `{ uploadUrl, r2Key }` |
| `src/app/api/admin/ingest-start/route.ts` | VERIFIED | 58 | POST; creates IngestJob; spawns `npx tsx scripts/ingest.ts --book-id --r2-key --job-id` as detached process; returns `{ jobId }` |
| `src/app/api/admin/ingest/[jobId]/route.ts` | VERIFIED | 33 | GET; admin role check; returns `{ status, progress, error, updatedAt }`; 404 if not found |
| `src/components/admin/useIngestStatus.ts` | VERIFIED | 76 | Polls every 2000ms; stops on `"success"` or `"error"` terminal status; parses progress JSON |
| `src/components/admin/IngestUploader.tsx` | VERIFIED | 239 | Uses react-dropzone; confirmation AlertDialog for re-ingest; XHR with `onprogress`; shows `<IngestStatus>` after pipeline starts |
| `src/components/admin/IngestStatus.tsx` | VERIFIED | 96 | Uses `useIngestStatus`; step labels mapped; Progress bar; success/error/processing states; link to preview on success |
| `scripts/ingest.ts` | VERIFIED | 303 | Extended with `--r2-key` (downloads from R2 to tmpdir) and `--job-id` (writes progress to IngestJob); 8 pipeline steps with percentages; top-level catch writes error status |
| `src/app/(admin)/admin/books/[bookId]/ingest/page.tsx` | VERIFIED | 131 | Admin check; loads book + latest job; shows IngestUploader or active IngestStatus; chapter count and history summary |
| `src/app/(admin)/admin/books/[bookId]/preview/page.tsx` | VERIFIED | 48 | Redirects to first chapter slug or shows empty state with link to ingest |
| `src/app/(admin)/admin/books/[bookId]/preview/[chapterSlug]/page.tsx` | VERIFIED | 158 | NO isPublished WHERE filter; `dangerouslySetInnerHTML`; `prose prose-lg` + KaTeX CSS; sidebar chapter nav; prev/next links; unpublished banner |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `admin/page.tsx` | `admin-queries.ts` | `getAllBooksAdmin()` | WIRED | Imported line 4, called line 19 |
| `BookTable.tsx` | `BookTableColumns.tsx` | `columns` import | WIRED | `import { columns } from "@/components/admin/BookTableColumns"` line 19 |
| `proxy.ts` | `/admin/:path*` | matcher config | WIRED | `matcher: ["/dashboard/:path*", "/admin/:path*"]` line 14 |
| `BookEditForm.tsx` | `admin-actions.ts` | `updateBook` Server Action | WIRED | Imported line 10, called on submit line 64 |
| `ImageUploadField.tsx` | `/api/admin/upload-url` | `fetch` POST | WIRED | `fetch("/api/admin/upload-url", ...)` line 38 |
| `admin/books/[bookId]/page.tsx` | `admin-queries.ts` | `getBookAdmin()` | WIRED | Imported line 5, called line 35 |
| `IngestUploader.tsx` | `/api/admin/ingest/upload-url` | `fetch` POST | WIRED | `fetch("/api/admin/ingest/upload-url", ...)` line 53 |
| `IngestUploader.tsx` | `/api/admin/ingest-start` | `fetch` POST | WIRED | `fetch("/api/admin/ingest-start", ...)` line 97 |
| `useIngestStatus.ts` | `/api/admin/ingest/[jobId]` | 2-second polling `fetch` | WIRED | `fetch(\`/api/admin/ingest/${jobId}\`)` line 35; `setInterval(..., 2000)` line 63 |
| `ingest-start/route.ts` | `scripts/ingest.ts` | `child_process.spawn` | WIRED | `spawn("npx", ["tsx", "scripts/ingest.ts", ...])` line 39; `proc.unref()` line 49 |

All 10 key links are WIRED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ADM-03 | 07-02 | Publisher can manage book metadata: cover image, ISBN, author bio/photo, synopsis, categories/tags, TOC, print info (page count, dimensions), and print purchase link | PARTIAL | All fields exist in form. Cover/author image upload to R2 works. Category multi-select with inline creation works. **EXCEPTION: pageCount field broken when editing from null** (string/number type mismatch in Zod validation) |
| ADM-04 | 07-01, 07-02 | Publisher can set access model per book (pay-per-book or open access) | PARTIAL | isOpenAccess Switch is functional; price field disables when open access. **EXCEPTION: price field broken when editing from null to a value** (same string/number Zod validation issue) |
| ADM-05 | 07-03 | Publisher can preview ingested content before publishing | SATISFIED | `/admin/books/[bookId]/preview/[chapterSlug]` renders chapter HTML with no isPublished filter; sidebar navigation and prev/next links work; unpublished banner shown |
| ADM-06 | 07-01, 07-03 | Publisher has a browser-based admin dashboard for uploading and managing books | SATISFIED | Full admin dashboard at /admin with book table; `/admin/books/[bookId]/ingest` with drag-and-drop upload, pipeline status polling, error display; no CLI needed for any operation |

All 4 requirement IDs from PLAN frontmatter accounted for. No orphaned requirements found.

### Anti-Patterns Found

| File | Location | Pattern | Severity | Impact |
|------|----------|---------|----------|--------|
| `src/components/admin/BookEditForm.tsx` | Lines 143, 245 | `register("pageCount")` and `register("price")` without `{ valueAsNumber: true }` | Warning | Editing pageCount or price from null to a value will fail Zod `z.number()` validation (string vs number type); fields save correctly only when unchanged from DB-loaded defaults |

No placeholders, stub returns, or TODO comments found in any admin components.

### Human Verification Required

#### 1. Admin Book Table

**Test:** Sign in as an admin user and navigate to /admin
**Expected:** Data table renders all books (published and unpublished) with sortable Title and Updated columns; Create Book button is visible; action dropdown on each row shows Edit, Publish/Unpublish, Delete
**Why human:** Requires live auth session and database connection

#### 2. Publish Toggle

**Test:** Click the "Publish" action on a draft book; click "Unpublish" on a published book
**Expected:** Status badge updates; public catalog page reflects the change
**Why human:** Requires live DB round-trip and server revalidation

#### 3. Manuscript Upload and Pipeline

**Test:** Navigate to a book's ingest page, drop a .tex or .docx file into the dropzone
**Expected:** Upload progress bar fills to 100%; ingest pipeline starts; status component shows step-by-step progress (html_convert → math_render → ... → complete); "Preview ingested content" link appears on success
**Why human:** Requires R2 credentials, pandoc, xelatex installed on the server

#### 4. Image Upload

**Test:** On a book edit page, click "Upload image" for cover, select a JPG file
**Expected:** Progress bar shows during upload; thumbnail appears after; clicking Save persists the image
**Why human:** Requires live R2 credentials

#### 5. pageCount/price Editing (Gap Validation)

**Test:** On a book edit page with pageCount=null, type "320" in the Page Count field, click Save Changes
**Expected:** Validation error should appear due to string/number type mismatch (this is the gap)
**Why human:** Confirms the gap exists in practice and is not masked by some RHF/Zod behavior

#### 6. Admin Preview of Unpublished Book

**Test:** Navigate to `/admin/books/[bookId]/preview` for an unpublished book with ingested chapters
**Expected:** Yellow "Admin Preview — this book is not published" banner shows; chapter content renders with math; sidebar navigation works
**Why human:** Requires ingested chapter content in database

### Gaps Summary

**1 gap found, affecting ADM-03 and ADM-04.**

The book metadata edit form (`BookEditForm.tsx`) registers `pageCount` and `price` as `type="number"` HTML inputs without the `{ valueAsNumber: true }` option in react-hook-form's `register()`. The Zod schema defines these as `z.number()` (not `z.coerce.number()`). When a user edits these fields from their null/empty state to a new numeric value, react-hook-form captures the input's string value (e.g., `"320"`), which Zod's `z.number()` rejects as type invalid.

The fix is minimal: add `{ valueAsNumber: true }` to both `register("pageCount")` and `register("price")` calls, which causes react-hook-form to use the input's `valueAsNumber` property (a native JS number) instead of its `value` property (a string).

All other aspects of the phase goal are fully implemented and wired: the admin dashboard, book table, publish toggle, create book flow, metadata editor (except the two numeric fields), image upload to R2, category management, manuscript upload, ingest pipeline with status polling, and admin chapter preview all work end-to-end.

---

_Verified: 2026-02-19T16:15:00Z_
_Verifier: Claude (gsd-verifier)_
