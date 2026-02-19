---
phase: 03-catalog
plan: 02
subsystem: ui
tags: [nextjs, prisma, schema-org, katex, seo, tailwind]

# Dependency graph
requires:
  - phase: 03-01
    provides: book-queries.ts helpers, BookCoverImage, CategoryBadge, catalog listing page
  - phase: 02-ingest
    provides: pre-rendered KaTeX HTML chapter content stored in DB
provides:
  - Book detail page at /catalog/[slug] with two-column layout, JSON-LD, generateMetadata
  - TableOfContents component listing chapters with free-preview badges
  - Sample chapter preview page at /catalog/[slug]/preview (public, no auth)
  - Loading skeleton for detail page
affects: [04-reader, 05-payments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema.org Book JSON-LD injected as script tag in page component (not <head>)"
    - "generateMetadata co-located in page.tsx for book-specific Open Graph"
    - "dangerouslySetInnerHTML for trusted pre-rendered KaTeX HTML from ingest pipeline"
    - "getPreviewChapter falls back to position === 1 if no isFreePreview chapter"

key-files:
  created:
    - src/app/(main)/catalog/[slug]/page.tsx
    - src/app/(main)/catalog/[slug]/loading.tsx
    - src/app/(main)/catalog/[slug]/preview/page.tsx
    - src/components/catalog/TableOfContents.tsx
  modified:
    - src/lib/book-queries.ts
    - src/app/layout.tsx

key-decisions:
  - "KaTeX CSS must be imported in root layout (src/app/layout.tsx) for pre-rendered math HTML to display — katex/dist/katex.min.css"
  - "Preview page uses dangerouslySetInnerHTML for chapter content: content is trusted (pre-rendered by our own ingest pipeline, stored in DB)"
  - "getPreviewChapter fallback: if no isFreePreview chapter, returns position === 1 chapter — ensures preview always renders"

patterns-established:
  - "JSON-LD pattern: render Schema.org script tag inside page component return, not in <head>"
  - "Two-column detail layout: grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 lg:gap-12"
  - "Upsell block: bg-muted/50 rounded-lg p-6 text-center — understated, academic"

requirements-completed: [CAT-02, CAT-04, CAT-05]

# Metrics
duration: ~20min (including human verification)
completed: 2026-02-19
---

# Phase 3 Plan 02: Book Detail and Sample Preview Summary

**Book detail pages with Schema.org JSON-LD, two-column layout, and public sample chapter preview with KaTeX math rendering via root layout CSS import.**

## Performance

- **Duration:** ~20 min (including human verification checkpoint)
- **Started:** 2026-02-19T00:00:00Z
- **Completed:** 2026-02-19
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- Book detail page at /catalog/[slug] with cover-left/info-right two-column layout, generateMetadata, and Schema.org Book JSON-LD for SEO
- TableOfContents component listing all chapters with free-preview badges
- Public sample chapter preview at /catalog/[slug]/preview rendering pre-rendered KaTeX HTML content from DB with end-of-sample upsell block
- KaTeX CSS imported in root layout so pre-rendered math HTML displays correctly without client-side rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Book detail page with two-column layout, JSON-LD, and generateMetadata** - `ac85f68` (feat)
2. **Task 2: Sample chapter preview page with upsell section** - `c550268` (feat)
3. **Deviation: KaTeX CSS import for math display** - `9e18e73` (fix)
4. **Task 3: Human verification checkpoint** - approved by user (no commit — verification only)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `src/lib/book-queries.ts` - Added getBookBySlug() and getPreviewChapter() query helpers
- `src/app/(main)/catalog/[slug]/page.tsx` - Book detail page: two-column layout, generateMetadata, Schema.org JSON-LD
- `src/app/(main)/catalog/[slug]/loading.tsx` - Loading skeleton matching two-column layout
- `src/app/(main)/catalog/[slug]/preview/page.tsx` - Public sample chapter preview with upsell section
- `src/components/catalog/TableOfContents.tsx` - Chapter list with position numbers and free-preview badges
- `src/app/layout.tsx` - Added KaTeX CSS import (katex/dist/katex.min.css)

## Decisions Made
- KaTeX CSS must be globally imported in root layout (not per-page) because pre-rendered chapter HTML is injected via dangerouslySetInnerHTML and needs stylesheet available on page load
- Preview page uses dangerouslySetInnerHTML: content is trusted output from our own ingest pipeline (not user input), pre-rendered by katex-render.ts and stored in DB
- getPreviewChapter falls back to the chapter with position === 1 if no chapter has isFreePreview: true — ensures preview page always has content to render

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added missing KaTeX CSS import for math rendering**
- **Found during:** Task 2 (sample chapter preview page)
- **Issue:** Pre-rendered chapter HTML contains KaTeX-generated class names (katex, katex-html, etc.) but without the KaTeX stylesheet imported, all math renders as unstyled/broken text
- **Fix:** Added `import 'katex/dist/katex.min.css'` to src/app/layout.tsx so the stylesheet is available globally for all pages that render pre-rendered math content
- **Files modified:** src/app/layout.tsx
- **Verification:** User confirmed math equations display correctly after fix
- **Committed in:** 9e18e73

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug: missing CSS for pre-rendered math)
**Impact on plan:** Necessary for correct math display. No scope creep — this was a missing piece required by the ingest pipeline's pre-rendering approach.

## Issues Encountered
- None beyond the KaTeX CSS deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Catalog experience complete: /catalog listing, /catalog/[slug] detail, /catalog/[slug]/preview all working
- Phase 4 (Reader) can now build on the preview page pattern — full reader will add chapter navigation and authentication gating for paid content
- Phase 5 (Payments) can reference the upsell section's "View Book Details" link as the handoff point from preview to purchase

## Self-Check: PASSED

All files verified present:
- FOUND: src/app/(main)/catalog/[slug]/page.tsx
- FOUND: src/app/(main)/catalog/[slug]/loading.tsx
- FOUND: src/app/(main)/catalog/[slug]/preview/page.tsx
- FOUND: src/components/catalog/TableOfContents.tsx
- FOUND: src/app/layout.tsx
- FOUND: .planning/phases/03-catalog/03-02-SUMMARY.md

All commits verified:
- FOUND: ac85f68 (Task 1 - book detail page)
- FOUND: c550268 (Task 2 - preview page)
- FOUND: 9e18e73 (KaTeX CSS fix deviation)

---
*Phase: 03-catalog*
*Completed: 2026-02-19*
