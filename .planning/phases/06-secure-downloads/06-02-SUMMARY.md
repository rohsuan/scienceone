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
duration: 1min
completed: 2026-02-19
---

# Phase 6 Plan 02: Secure Downloads - Library Card and Reader Header Integration Summary

**DownloadDropdown wired into My Library book cards and reader header bar, completing download placement across all three locations**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-19T13:24:36Z
- **Completed:** 2026-02-19T13:25:48Z
- **Tasks:** 1 of 2 complete (Task 2 is checkpoint:human-verify)
- **Files modified:** 6

## Accomplishments
- Extended `getUserPurchases` query to include `pdfKey` and `epubKey` so library cards know download availability
- Restructured `LibraryBookCard` to place `DownloadDropdown` outside the Link wrapper (prevents navigation on download click)
- Updated `MyLibrary` to pass `hasPdf`/`hasEpub` booleans derived from purchase data
- Extended `getBookChapters` query to include `pdfKey` and `epubKey` for reader header
- Updated reader layout to pass `hasPdf`/`hasEpub` booleans to `ReaderTopBar`
- Added `DownloadDropdown` to the right side of `ReaderTopBar` header
- Build passes with TypeScript validation — all three download locations functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire download dropdown into Library cards and Reader header** - `877791a` (feat)
2. **Task 2: Verify download flow end-to-end** - Pending human verification (checkpoint)

**Plan metadata:** TBD (docs commit after checkpoint resolved)

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

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Download feature is complete across all three placement locations after human verification
- Phase 7 (next phase) can proceed once checkpoint is verified
- No blockers for continuation

---
*Phase: 06-secure-downloads*
*Completed: 2026-02-19*
