---
phase: 04-reader
plan: 01
subsystem: ui
tags: [next.js, react, katex, tailwindcss-typography, shadcn, prisma, better-auth]

# Dependency graph
requires:
  - phase: 03-catalog
    provides: "book-queries patterns, KaTeX CSS in root layout, dangerouslySetInnerHTML for trusted content"
  - phase: 02-ingest
    provides: "pre-rendered KaTeX HTML stored in chapter.content field"
  - phase: 01-foundation
    provides: "Better Auth session, Prisma schema with Chapter/Purchase/Book models"
provides:
  - "Reader route group at /read/[bookSlug]/[chapterSlug] with dedicated minimal chrome layout"
  - "Table of contents sidebar with active chapter highlighting via useSelectedLayoutSegment"
  - "Mobile ToC access via Sheet drawer with auto-close on navigation"
  - "Chapter content rendering with prose typography and KaTeX overflow handling"
  - "Server-side access control: openAccess OR freePreview OR hasPurchased"
  - "Prev/next chapter navigation at bottom of each chapter"
  - "Book entry redirect from /read/[bookSlug] to first chapter"
  - "React.cache-based reader-queries for efficient data fetching"
affects: [04-reader-02, 05-payments]

# Tech tracking
tech-stack:
  added: ["@tailwindcss/typography", "shadcn Sheet component"]
  patterns:
    - "React.cache for deduplicating server component data fetches within a request"
    - "useSelectedLayoutSegment for active navigation highlighting in nested layouts"
    - "Controlled Sheet component with useState for mobile drawer"
    - "(reader) route group for layout isolation (no site Header/Footer)"
    - "Access control as defense-in-depth in page component (not middleware-only)"

key-files:
  created:
    - "src/lib/reader-queries.ts"
    - "src/app/(reader)/layout.tsx"
    - "src/app/(reader)/read/[bookSlug]/layout.tsx"
    - "src/app/(reader)/read/[bookSlug]/page.tsx"
    - "src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx"
    - "src/components/reader/TocSidebar.tsx"
    - "src/components/reader/TocNavLink.tsx"
    - "src/components/reader/ReaderTopBar.tsx"
    - "src/components/reader/MobileTocDrawer.tsx"
    - "src/components/reader/ChapterNav.tsx"
    - "src/components/ui/sheet.tsx"
  modified:
    - "src/app/globals.css"
    - "package.json"

key-decisions:
  - "(reader) route group layout wraps without <html>/<body> tags — nested under root layout that provides those"
  - "TocSidebar is client component to accept onNavigate callback from both server layout and mobile Sheet"
  - "MobileTocDrawer uses controlled open state (useState) rather than SheetTrigger — enables auto-close on chapter nav"
  - "useSelectedLayoutSegment returns [chapterSlug] segment because TocNavLink renders inside [bookSlug]/layout.tsx"
  - "KaTeX display math overflow fix applied to .katex-display container not .katex itself — prevents double-scrollbar"
  - "canRead = openAccess OR freePreview OR hasPurchased — applied at page level as defense-in-depth"
  - "ChapterNav is server component — purely renders links, no client state needed"
  - "getBookChapters called in both layout and chapter page — React.cache deduplicates within the request"

patterns-established:
  - "Route groups for layout isolation: (reader) separates reader chrome from (main) and (auth)"
  - "React.cache wrapping for server-side query deduplication across layout+page trees"
  - "Trusted pre-rendered HTML via dangerouslySetInnerHTML (established in Phase 3, extended here)"
  - "Client component wrappers for server-rendered data that needs browser interactivity"

requirements-completed: [READ-01, READ-02, READ-03]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 4 Plan 01: Reader Layout and Chapter Rendering Summary

**Server-rendered reader at /read/[bookSlug]/[chapterSlug] with KaTeX HTML, ToC sidebar, Sheet drawer on mobile, and access control gate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T03:26:41Z
- **Completed:** 2026-02-19T03:29:41Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Reader route group layout isolates reader chrome from site Header/Footer using (reader) route group
- Table of contents sidebar highlights active chapter via useSelectedLayoutSegment, mobile users get Sheet drawer
- Chapter pages render pre-rendered KaTeX HTML with prose-slate typography and correct overflow handling
- Access control: open-access books free for all, paid books require purchase unless chapter is free preview

## Task Commits

Each task was committed atomically:

1. **Task 1: Reader layout, ToC sidebar, mobile drawer, and reader queries** - `3605d6d` (feat)
2. **Task 2: Chapter content page with KaTeX rendering, access control, and chapter nav** - `5747a0d` (feat)

**Plan metadata:** (created next)

## Files Created/Modified

- `src/lib/reader-queries.ts` - React.cache-wrapped getBookChapters, getChapter, hasPurchased queries
- `src/app/(reader)/layout.tsx` - Reader route group layout (no site Header/Footer)
- `src/app/(reader)/read/[bookSlug]/layout.tsx` - Book-level layout with ReaderTopBar and desktop ToC sidebar
- `src/app/(reader)/read/[bookSlug]/page.tsx` - Book entry redirect to first chapter
- `src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx` - Chapter page with access control, KaTeX rendering, ChapterNav
- `src/components/reader/TocSidebar.tsx` - Chapter list with TocNavLink, client component for onNavigate callback
- `src/components/reader/TocNavLink.tsx` - Active highlighting via useSelectedLayoutSegment
- `src/components/reader/ReaderTopBar.tsx` - Top bar with back-to-catalog link and MobileTocDrawer
- `src/components/reader/MobileTocDrawer.tsx` - Controlled Sheet with auto-close on chapter navigation
- `src/components/reader/ChapterNav.tsx` - Prev/next chapter navigation at bottom of chapter
- `src/components/ui/sheet.tsx` - shadcn Sheet component (added via canary CLI)
- `src/app/globals.css` - Added @plugin "@tailwindcss/typography"
- `package.json` - Added @tailwindcss/typography dev dependency

## Decisions Made

- TocSidebar is a client component to accept onNavigate callback — used in both server layout (no callback) and mobile Sheet (with setOpen(false) callback). Making it client avoids prop drilling complexity.
- MobileTocDrawer uses controlled open state rather than uncontrolled SheetTrigger — enables the TocSidebar to close the drawer by calling onNavigate when user selects a chapter.
- React.cache deduplication: getBookChapters called in both [bookSlug]/layout.tsx and [chapterSlug]/page.tsx. React.cache ensures single DB query per request.
- KaTeX overflow applied to [&_.katex-display] container with overflow-x-auto and overflow-y-hidden — per research notes, applying to .katex itself causes double-scrollbar on mobile.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Reader is fully functional; chapter URLs /read/[bookSlug]/[chapterSlug] route correctly
- Access control implemented: unauthorized users redirected to /catalog/[slug]?access=required
- Plan 04-02 (reading progress tracking) can build on top of the chapter page — scroll position hooks can be added to the chapter page without structural changes
- Payments phase (05) will use the hasPurchased check already wired in

## Self-Check: PASSED

All created files exist on disk. Both task commits (3605d6d, 5747a0d) verified in git log.

---
*Phase: 04-reader*
*Completed: 2026-02-19*
