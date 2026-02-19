---
phase: 07-admin-dashboard
plan: 02
subsystem: ui
tags: [react-hook-form, zod, r2, presigned-url, shadcn, tabs, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 07-01
    provides: Admin route group with role guard, requireAdmin() helper, shadcn components
  - phase: 06-secure-downloads
    provides: R2 client (createR2Client), Book model with R2 key fields
  - phase: 01-foundation
    provides: auth system (Better Auth), auth.api.getSession

provides:
  - /admin/books/[bookId] edit page (server component with defense-in-depth auth)
  - getBookAdmin() query with chapters, categories, pricing includes
  - getAllCategories() query
  - ImageUploadField client component (XHR upload with progress, presigned URL)
  - /api/admin/upload-url POST endpoint (admin-only presigned R2 PUT URL)
  - BookEditForm client component (react-hook-form + zod, 3 tabbed sections)
  - CategorySelect client component (click-to-toggle list + inline creation)
  - updateBook server action (book + pricing upsert + category sync + cache invalidation)
  - createCategory server action (kebab-case slug generation)

affects: [07-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Presigned URL upload pattern: client POSTs to /api/admin/upload-url, gets presigned PUT URL, XHR PUTs directly to R2"
    - "XHR for upload progress: XMLHttpRequest with upload.addEventListener('progress') for real-time progress bar"
    - "react-hook-form + zod v4: use z.number() not z.coerce.number() for type compatibility with @hookform/resolvers"
    - "Category sync pattern: deleteMany all BookCategory + createMany new ones in sequence (not atomic — acceptable for admin)"

key-files:
  created:
    - src/app/(admin)/admin/books/[bookId]/page.tsx
    - src/app/api/admin/upload-url/route.ts
    - src/components/admin/ImageUploadField.tsx
    - src/components/admin/BookEditForm.tsx
    - src/components/admin/CategorySelect.tsx
  modified:
    - src/lib/admin-queries.ts (added getBookAdmin, getAllCategories)
    - src/lib/admin-actions.ts (added bookUpdateSchema, updateBook, createCategory)

key-decisions:
  - "z.coerce.number() in Zod v4 has input type unknown — breaks @hookform/resolvers type inference; use z.number() instead and handle form coercion at the number input level"
  - "XHR used for image upload (not fetch) — XMLHttpRequest upload.progress event provides real-time progress; fetch has no streaming upload progress API"
  - "Category sync uses deleteMany + createMany (not smart diff) — simpler code for admin-only feature; acceptable given admin usage patterns"
  - "BookEditForm stub created first to unblock TS check, then replaced with full implementation in Task 2"

patterns-established:
  - "Presigned URL upload: /api/admin/upload-url issues admin-only PUT presigned URLs; client component does XHR PUT directly to R2"
  - "Image upload lifecycle: POST /api/admin/upload-url → XHR PUT to R2 → onUpload(r2Key) callback → setValue in react-hook-form state"
  - "updateBook revalidates all affected cache paths: /admin, /admin/books/[id], /catalog, /catalog/[slug]"

requirements-completed: [ADM-03, ADM-04]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 7 Plan 02: Book Metadata Edit Form Summary

**Tabbed book editor at /admin/books/[bookId] with presigned R2 image uploads via XHR, react-hook-form + Zod validation, inline category creation, and updateBook server action syncing all metadata**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T15:21:26Z
- **Completed:** 2026-02-19T15:26:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- /admin/books/[bookId] page with defense-in-depth admin check, loads book + categories server-side
- Presigned URL endpoint at /api/admin/upload-url — admin-only, generates R2 PUT keys for cover and author images
- ImageUploadField component handles full upload flow: presigned URL → XHR to R2 → progress bar → form state update
- BookEditForm with 3 tabs (Details, Content, Publishing) using react-hook-form + Zod v4 schema
- CategorySelect: scrollable click-to-toggle list + inline category creation calling createCategory server action
- updateBook server action: validates admin, updates book fields, upserts BookPrice, syncs BookCategory, revalidates caches

## Task Commits

Each task was committed atomically:

1. **Task 1: Book edit page, admin queries, presigned URL endpoint, and image upload component** - `fdefc56` (feat)
2. **Task 2: Book metadata edit form with tabs, category select, and save functionality** - `385f60b` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/app/(admin)/admin/books/[bookId]/page.tsx` - Server page with defense-in-depth auth, calls getBookAdmin + getAllCategories
- `src/app/api/admin/upload-url/route.ts` - POST endpoint verifies admin role, generates R2 presigned PUT URL (3600s expiry)
- `src/components/admin/ImageUploadField.tsx` - Upload component using XHR for progress tracking; accepts cover/author type
- `src/components/admin/BookEditForm.tsx` - react-hook-form form with 3 shadcn Tabs; useTransition for save; sonner toast feedback
- `src/components/admin/CategorySelect.tsx` - Scrollable toggle list + Input + Button for inline category creation
- `src/lib/admin-queries.ts` - Added getBookAdmin() with full includes, getAllCategories()
- `src/lib/admin-actions.ts` - Added bookUpdateSchema (Zod), updateBook, createCategory server actions

## Decisions Made
- Used `z.number()` instead of `z.coerce.number()` in Zod v4 schema — coerce creates `unknown` input type incompatible with @hookform/resolvers
- XHR for upload progress tracking — fetch API has no streaming upload progress event
- CategorySelect uses simple deleteMany + createMany approach (not smart diff) — sufficient for admin usage
- BookEditForm placeholder stub committed first so Task 1 TS check could pass before full implementation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created BookEditForm stub to unblock Task 1 TypeScript check**
- **Found during:** Task 1 (TypeScript verification step)
- **Issue:** `src/app/(admin)/admin/books/[bookId]/page.tsx` imports BookEditForm which doesn't exist yet in Task 1
- **Fix:** Created minimal BookEditForm placeholder stub, then fully replaced it in Task 2
- **Files modified:** `src/components/admin/BookEditForm.tsx`
- **Verification:** `npx tsc --noEmit` passes after stub creation
- **Committed in:** `fdefc56` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Zod v4 / react-hook-form type incompatibility**
- **Found during:** Task 2 (TypeScript check after BookEditForm implementation)
- **Issue:** `z.coerce.number()` in Zod v4 produces `unknown` input type which breaks @hookform/resolvers type inference — TS2322 errors
- **Fix:** Changed `z.coerce.number()` to `z.number()` in bookUpdateSchema; number inputs natively provide number values so coercion is unnecessary
- **Files modified:** `src/lib/admin-actions.ts`
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** `385f60b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration changes required. The R2 presigned URL endpoint uses the existing `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` environment variables.

## Next Phase Readiness
- Book edit page and image upload infrastructure ready for Plan 03 (ingest uploader)
- admin-queries.ts has additional helper functions (getBookChaptersAdmin, getChapterAdmin, getLatestIngestJob) ready for Plan 03 use
- All shadcn and react-hook-form dependencies already installed — Plan 03 can reuse them

---
*Phase: 07-admin-dashboard*
*Completed: 2026-02-19*
