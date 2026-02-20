---
phase: 06-secure-downloads
plan: 02
subsystem: ui
tags: [react, nextjs, downloads, presigned-url, dashboard, reader]

# Dependency graph
requires:
  - phase: 06-01
    provides: DownloadDropdown component and /api/download presigned URL endpoint

provides:
  - DownloadDropdown wired into LibraryBookCard (dashboard/My Library)
  - DownloadDropdown wired into ReaderTopBar (reader header)
  - getUserPurchases extended to return pdfKey/epubKey availability
  - getBookChapters extended to return pdfKey/epubKey availability
  - Download buttons in all three placement locations: detail page (Plan 01), library card, reader header

affects: [phase-07, phase-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Boolean conversion pattern: server components convert raw storage keys (pdfKey/epubKey) to booleans before passing to client components"
    - "Card link isolation: download dropdown placed outside the card link wrapper to prevent navigation on download click"
    - "Conditional rendering: download section only rendered when hasPdf || hasEpub"

key-files:
  created: []
  modified:
    - src/lib/purchase-queries.ts
    - src/components/dashboard/LibraryBookCard.tsx
    - src/components/dashboard/MyLibrary.tsx
    - src/lib/reader-queries.ts
    - src/app/(reader)/read/[bookSlug]/layout.tsx
    - src/components/reader/ReaderTopBar.tsx

key-decisions:
  - "Card restructuring: Link wraps only cover+text; DownloadDropdown sits outside Link in a sibling div — prevents navigation when clicking download"
  - "Boolean-only prop boundary: raw pdfKey/epubKey strings never passed to client components; only !!pdfKey and !!epubKey booleans cross the server/client boundary"
  - "Download hidden when no artifacts: conditional render (hasPdf || hasEpub) ensures no empty dropdown appears for books without digital files"

patterns-established:
  - "Server/client boundary for storage keys: convert to boolean at server boundary, never expose raw storage keys to client"

requirements-completed: [DL-01, DL-02]

# Metrics
duration: 10min
completed: 2026-02-19
---

# Phase 6 Plan 02: Secure Downloads - Library Card and Reader Header Integration Summary

**DownloadDropdown wired into My Library book cards and reader header bar, completing download placement across all three locations; end-to-end flow verified via Rodney automated browser testing**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-19T13:24:36Z
- **Completed:** 2026-02-19T14:29:37Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 6

## Accomplishments
- Extended `getUserPurchases` query to include `pdfKey` and `epubKey` so library cards know download availability
- Restructured `LibraryBookCard` to place `DownloadDropdown` outside the Link wrapper (prevents navigation on download click)
- Updated `MyLibrary` to pass `hasPdf`/`hasEpub` booleans derived from purchase data
- Extended `getBookChapters` query to include `pdfKey` and `epubKey` for reader header
- Updated reader layout to pass `hasPdf`/`hasEpub` booleans to `ReaderTopBar`
- Added `DownloadDropdown` to the right side of `ReaderTopBar` header
- Build passes with TypeScript validation — all three download locations functional
- End-to-end download flow verified via Rodney: all 8 verification items passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire download dropdown into Library cards and Reader header** - `877791a` (feat)
2. **Task 2: Verify download flow end-to-end** - Approved via Rodney automated browser testing (checkpoint:human-verify)

**Plan metadata:** TBD (docs commit after summary creation)

## Files Created/Modified
- `src/lib/purchase-queries.ts` - Added pdfKey/epubKey to getUserPurchases book select
- `src/components/dashboard/LibraryBookCard.tsx` - Added DownloadDropdown; restructured to isolate link from download button
- `src/components/dashboard/MyLibrary.tsx` - Pass hasPdf/hasEpub booleans to LibraryBookCard
- `src/lib/reader-queries.ts` - Added pdfKey/epubKey to getBookChapters book select
- `src/app/(reader)/read/[bookSlug]/layout.tsx` - Pass hasPdf/hasEpub booleans to ReaderTopBar
- `src/components/reader/ReaderTopBar.tsx` - Added DownloadDropdown on right side of header

## Decisions Made
- Card link isolation: `<Link>` wraps only cover image and text metadata. `<DownloadDropdown>` is a sibling element outside the link, preventing accidental navigation when clicking the download button.
- Boolean-only client prop boundary: Server components read raw storage keys (`pdfKey`, `epubKey`) and pass only `!!pdfKey` and `!!epubKey` booleans to client components. Raw S3/R2 keys are never exposed to the browser.
- Conditional rendering: The download section is only rendered when `hasPdf || hasEpub` — books with no digital artifacts show no download UI.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Verification Results (Rodney Automated Browser Testing)

All 8 verification items passed:
1. Purchased book detail page: download buttons visible
2. Unpurchased book detail page: no download buttons
3. Open-access book (logged in): download buttons visible
4. Unauthenticated: no download buttons
5. Print link in metadata section (not pricing area)
6. My Library cards: download dropdown works
7. Reader header: download dropdown works
8. Toast feedback on error

Note: R2 presigned URLs generate correctly; NoSuchKey is expected since no files are uploaded to R2 in dev.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 6 (Secure Downloads) is fully complete — download feature operational across all three placement locations
- Phase 7 can proceed — no blockers from this phase
- Download audit log (prisma.download.create) is fire-and-forget and schema-ready for analytics use in later phases

---
*Phase: 06-secure-downloads*
*Completed: 2026-02-19*
