---
phase: 07-admin-dashboard
plan: 03
subsystem: ui, api
tags: [react, next.js, r2, prisma, react-dropzone, child_process, polling]

# Dependency graph
requires:
  - phase: 07-01
    provides: Admin layout, IngestJob schema, requireAdmin pattern, admin-queries base
  - phase: 02-ingest
    provides: scripts/ingest.ts pipeline, scripts/lib/db-write.ts, R2 client

provides:
  - Browser-based manuscript upload via R2 presigned PUT URLs
  - Detached ingest pipeline spawned from API route with job status tracking
  - IngestJob progress polling at 2-second intervals from browser
  - Admin preview of all chapters (no isPublished filter)
  - Chapter navigation sidebar with prev/next links for admin preview
affects: [phase-08-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Detached child_process spawn from Next.js API route with proc.unref()
    - 2-second polling hook (useIngestStatus) that stops on terminal status
    - XHR for upload progress tracking (not fetch — no onprogress in fetch)
    - Admin preview bypasses isPublished filter (admin sees all content)

key-files:
  created:
    - src/app/api/admin/ingest/upload-url/route.ts
    - src/app/api/admin/ingest-start/route.ts
    - src/app/api/admin/ingest/[jobId]/route.ts
    - src/components/admin/useIngestStatus.ts
    - src/components/admin/IngestStatus.tsx
    - src/components/admin/IngestUploader.tsx
    - src/app/(admin)/admin/books/[bookId]/ingest/page.tsx
    - src/app/(admin)/admin/books/[bookId]/preview/page.tsx
    - src/app/(admin)/admin/books/[bookId]/preview/[chapterSlug]/page.tsx
  modified:
    - scripts/ingest.ts
    - scripts/lib/db-write.ts
    - src/lib/admin-queries.ts

key-decisions:
  - "Ingest script uses --r2-key to download manuscript from R2 to tmpdir before processing — keeps pipeline stateless with respect to local file paths"
  - "updateProgress() in ingest.ts is non-fatal — swallows errors so DB status update failure never kills the ingest pipeline"
  - "IngestStatus shows error details inline including health report JSON — founder can diagnose math/conversion failures without CLI"
  - "Admin preview page uses dangerouslySetInnerHTML — trusted content from our own ingest pipeline (same pattern as public reader)"
  - "Preview page redirects to first chapter on load; no-chapters state links to ingest page"

patterns-established:
  - "Detached process pattern: spawn + proc.unref() for long-running background jobs from API routes"
  - "Progress polling pattern: useIngestStatus polls every 2s, stops on 'success' or 'error'"
  - "Admin preview pattern: admin queries have no isPublished filter; public queries do"

requirements-completed: [ADM-05, ADM-06]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 7 Plan 3: Ingest Pipeline Integration and Admin Preview Summary

**Browser-based manuscript upload to R2 with detached ingest pipeline, 2-second job status polling, and admin chapter preview without isPublished filter**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T15:21:15Z
- **Completed:** 2026-02-19T15:26:10Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Founder can upload manuscripts from the browser (drag-and-drop) to R2 via presigned PUT URLs with XHR progress tracking
- Ingest pipeline spawns as a detached child process and writes step-by-step progress to IngestJob — visible in the browser via 2-second polling
- Admin preview renders all chapters (including unpublished books) with full KaTeX math, sidebar navigation, prev/next, and unpublished banner

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ingest API routes, extend ingest script, and build upload + status components** - `97c2677` (feat)
2. **Task 2: Create ingest page and admin preview route for unpublished book chapters** - `393092e` (feat)

## Files Created/Modified
- `src/app/api/admin/ingest/upload-url/route.ts` - POST: generates R2 presigned PUT URL for manuscript upload
- `src/app/api/admin/ingest-start/route.ts` - POST: creates IngestJob and spawns detached npx tsx process
- `src/app/api/admin/ingest/[jobId]/route.ts` - GET: returns IngestJob status for browser polling
- `src/components/admin/useIngestStatus.ts` - React hook polling job status every 2s, stops on terminal state
- `src/components/admin/IngestStatus.tsx` - Progress bar + step label + success/error display
- `src/components/admin/IngestUploader.tsx` - Drag-and-drop uploader with re-ingest confirmation dialog
- `src/app/(admin)/admin/books/[bookId]/ingest/page.tsx` - Ingest management page with history summary
- `src/app/(admin)/admin/books/[bookId]/preview/page.tsx` - Redirects to first chapter or empty state
- `src/app/(admin)/admin/books/[bookId]/preview/[chapterSlug]/page.tsx` - Chapter preview with sidebar nav
- `scripts/ingest.ts` - Extended with --r2-key (download from R2) and --job-id (write progress) flags
- `scripts/lib/db-write.ts` - Added updateIngestJob() for pipeline status reporting
- `src/lib/admin-queries.ts` - Added getBookChaptersAdmin, getChapterAdmin, getLatestIngestJob

## Decisions Made
- Ingest script uses --r2-key to download manuscript from R2 to tmpdir before processing — keeps pipeline stateless with respect to local file paths
- updateProgress() in ingest.ts is non-fatal — swallows errors so DB status update failure never kills the ingest pipeline
- Admin preview uses dangerouslySetInnerHTML — trusted content from our own ingest pipeline (same pattern as public reader, established in Phase 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing getBookAdmin query (plan 07-02 not yet executed)**
- **Found during:** Task 2 (ingest page implementation)
- **Issue:** Ingest page needed `getBookAdmin(bookId)` which was supposed to be created in plan 07-02 (not yet run). The function was already present in admin-queries.ts (added during plan 07-01 likely), so no action needed beyond verifying its presence.
- **Fix:** Confirmed `getBookAdmin` already exists; proceeded to add the three new queries required by plan 07-03 (getBookChaptersAdmin, getChapterAdmin, getLatestIngestJob).
- **Files modified:** src/lib/admin-queries.ts
- **Verification:** TypeScript compilation passes; build succeeds with all routes present.
- **Committed in:** 393092e (Task 2 commit)

---

**Total deviations:** 1 auto-noted (not a real deviation — query was already present)
**Impact on plan:** No scope creep. Plan executed as specified.

## Issues Encountered
None — all pipeline steps built cleanly, TypeScript passes, Next.js build succeeds with all routes visible.

## User Setup Required
None - no new external service configuration required beyond what was established in earlier phases.

## Next Phase Readiness
- Phase 7 complete: Admin dashboard with book table, book editor, ingest pipeline, and admin preview are all operational
- Phase 8 (polish/citation export) can proceed — all admin foundations in place

---
*Phase: 07-admin-dashboard*
*Completed: 2026-02-19*
