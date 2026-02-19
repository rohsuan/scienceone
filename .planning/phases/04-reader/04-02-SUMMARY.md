---
phase: 04-reader
plan: 02
subsystem: ui
tags: [reading-progress, scroll-tracking, prisma, nextjs, debounce]

# Dependency graph
requires:
  - phase: 04-01
    provides: Reader layout, chapter page, ToC sidebar, and access control
  - phase: 01-foundation
    provides: Better Auth session management used for authenticated user checks
  - phase: 02-ingest
    provides: ReadingProgress Prisma model and chapter/book IDs

provides:
  - Reading progress API (PATCH to save, GET to load) with Prisma upsert
  - ScrollProgressTracker client component with 2-second debounced saves
  - ReadingProgressBar visual indicator of scroll position within chapter
  - Resume redirect: book entry page redirects authenticated users to last chapter
  - Scroll position restoration on chapter mount via initialScrollPercent prop

affects: [05-payments, 04-reader]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Purely behavioral React component returning null (ScrollProgressTracker)
    - Debounced scroll event pattern with useDebouncedCallback at 2s interval
    - key={chapter.id} on tracker forces fresh mount on chapter change, preventing stale scroll
    - Compound Prisma upsert pattern: userId_bookId unique index for idempotent saves

key-files:
  created:
    - src/app/api/reading-progress/route.ts
    - src/components/reader/ScrollProgressTracker.tsx
    - src/components/reader/ReadingProgressBar.tsx
  modified:
    - src/lib/reader-queries.ts
    - src/app/(reader)/read/[bookSlug]/page.tsx
    - src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx

key-decisions:
  - "ScrollProgressTracker returns null — purely behavioral component with no UI of its own"
  - "key={chapter.id} on ScrollProgressTracker forces fresh remount on chapter navigation, preventing stale initialScrollPercent from restoring wrong scroll position"
  - "initialScrollPercent only set when progress.chapterId === chapter.id — no cross-chapter scroll restoration"
  - "Anonymous users always start at chapter 1 with no tracking — per locked decision from research"
  - "2-second debounce via useDebouncedCallback prevents excessive API calls during active scrolling"

patterns-established:
  - "Behavioral null-render pattern: client component with side effects but no UI renders null"
  - "Debounced scroll save pattern: useDebouncedCallback 2s + passive scroll listener on #reader-content"
  - "Progress guard pattern: isAuthenticated checked in both client component and API route for defense-in-depth"

requirements-completed: [READ-04]

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 4 Plan 02: Reading Progress Persistence Summary

**Reading progress API with Prisma upsert, debounced scroll tracker, visual progress bar, and resume redirect for authenticated users — anonymous users always start at chapter 1**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-19T03:34:00Z
- **Completed:** 2026-02-19T03:42:00Z
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 6

## Accomplishments
- Reading progress API (PATCH + GET) saves and loads chapter + scroll position via Prisma upsert with userId_bookId compound unique
- ScrollProgressTracker client component tracks scroll on #reader-content, debounces saves at 2-second intervals, and silently restores scroll position on mount
- ReadingProgressBar thin visual indicator fixed below the top bar tracks scroll percentage within the current chapter
- Book entry page redirects authenticated users to their last-read chapter; anonymous users always start at chapter 1
- Chapter page passes initialScrollPercent only when the saved chapterId matches the current chapter (no cross-chapter stale restoration)

## Task Commits

Each task was committed atomically:

1. **Task 1: Reading progress API, scroll tracker, progress bar, and integrate with reader pages** - `cdb8b1e` (feat)
2. **Task 2: Verify complete reader experience** - Approved by user (human-verify checkpoint)

## Files Created/Modified
- `src/app/api/reading-progress/route.ts` - PATCH handler saves progress via Prisma upsert; GET handler loads progress for authenticated users
- `src/components/reader/ScrollProgressTracker.tsx` - Null-render client component: attaches passive scroll listener to #reader-content, debounces PATCH saves at 2s, restores scroll on mount via setTimeout(100ms)
- `src/components/reader/ReadingProgressBar.tsx` - Visual thin progress bar fixed at top-12, left offset accounts for sidebar width on desktop
- `src/lib/reader-queries.ts` - Added getReadingProgress(userId, bookId) using React.cache and Prisma findUnique
- `src/app/(reader)/read/[bookSlug]/page.tsx` - Added resume redirect: authenticated users with saved progress redirected to last chapter
- `src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx` - Renders ScrollProgressTracker with key={chapter.id} and ReadingProgressBar; loads scrollPercent only when chapter matches saved progress

## Decisions Made
- ScrollProgressTracker returns null (purely behavioral) — scroll tracking and save logic require no UI of their own
- key={chapter.id} on ScrollProgressTracker ensures fresh mount per chapter, so initialScrollPercent from a previous chapter never bleeds into a new chapter
- initialScrollPercent conditional: only set when progress.chapterId === chapter.id to prevent restoring wrong scroll position on first-visit chapters
- Scroll listener attaches to #reader-content (the scrollable main element), not window — consistent with how the reader layout is structured
- Silent restore: no toast or visual indicator on scroll position restoration, per research recommendation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The complete reader experience is shipped and verified: ToC navigation, KaTeX math rendering, access control, and reading progress persistence all working
- Phase 4 (Reader) is now fully complete — all 2 plans done
- Phase 5 (Payments) is ready to begin: book purchase flow, Stripe integration, My Library for purchased books

## Self-Check: PASSED

- FOUND: src/app/api/reading-progress/route.ts
- FOUND: src/components/reader/ScrollProgressTracker.tsx
- FOUND: src/components/reader/ReadingProgressBar.tsx
- FOUND: .planning/phases/04-reader/04-02-SUMMARY.md
- FOUND commit: cdb8b1e (feat: reading progress persistence, scroll tracker, and progress bar)

---
*Phase: 04-reader*
*Completed: 2026-02-19*
