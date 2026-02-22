---
phase: 14-blog
plan: 02
subsystem: ui
tags: [blog, seo, json-ld, shiki, sitemap, next.js]

# Dependency graph
requires:
  - phase: 14-blog-01
    provides: Blog admin, public listing, and queries already in place
provides:
  - Blog detail page with complete JSON-LD Article schema (datePublished never undefined)
  - Shiki syntax highlighting applied to code blocks before sanitizeHtml
  - Sitemap at /sitemap.xml covering blog posts, resources, and simulations
affects: [phase-15-polish, seo, blog]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - highlightCodeBlocks called before sanitizeHtml on all blog post content
    - Sitemap queries split by resource type (SIMULATION vs non-SIMULATION) for correct URL path

key-files:
  created:
    - src/app/sitemap.ts
  modified:
    - src/app/(main)/blog/[slug]/page.tsx

key-decisions:
  - "JSON-LD datePublished falls back to createdAt so the field is never undefined/dropped by JSON.stringify"
  - "JSON-LD description uses empty string fallback (not undefined) to ensure key is always present"
  - "highlightCodeBlocks runs before sanitizeHtml — Shiki transforms pre/code HTML, then sanitize allows class/style attributes through"
  - "Simulations use /simulations/{slug} path in sitemap; non-simulation resources use /resources/{slug}"

patterns-established:
  - "Shiki highlighting pattern: await highlightCodeBlocks(content) then sanitizeHtml(highlightedContent)"
  - "Sitemap type split: type: { not: 'SIMULATION' } for resources, type: 'SIMULATION' for simulations"

requirements-completed: [BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 14 Plan 02: Blog SEO, Shiki Highlighting, and Sitemap Summary

**JSON-LD Article schema with createdAt fallback for datePublished, Shiki code highlighting before sanitizeHtml, and sitemap serving blog posts, resources, and simulations**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-22T03:41:02Z
- **Completed:** 2026-02-22T03:42:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed JSON-LD datePublished bug: now uses `(publishedAt ?? createdAt).toISOString()` so the field is never silently dropped
- Fixed JSON-LD description: now uses `post.excerpt ?? ""` instead of `?? undefined` so key is always present
- Added Shiki code highlighting to blog detail page: `highlightCodeBlocks(post.content)` runs before `sanitizeHtml`
- Created `src/app/sitemap.ts` covering static routes, published blog posts, resources, and simulations with correct URL paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix JSON-LD datePublished and add Shiki code highlighting** - `2762322` (fix)
2. **Task 2: Create sitemap covering blog posts, resources, and simulations** - `c16ca42` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/app/(main)/blog/[slug]/page.tsx` - Added highlightCodeBlocks import, fixed datePublished/description JSON-LD fields, updated content rendering to use highlightedContent
- `src/app/sitemap.ts` - New sitemap with static routes and dynamic entries for all published content types

## Decisions Made
- JSON-LD datePublished falls back to createdAt (not undefined) — ensures valid JSON-LD for posts that were never published via the publishedAt field
- JSON-LD description uses empty string fallback so the key is always present in JSON-LD output
- highlightCodeBlocks runs before sanitizeHtml per the existing sanitize-html config that already allows `class` on `code` and `style` on all elements
- Simulations use `/simulations/{slug}` path in sitemap; non-simulation resources use `/resources/{slug}` to match actual public routes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Blog detail page now has complete JSON-LD, Shiki highlighting, and sanitization
- Sitemap at /sitemap.xml is live for SEO crawlers
- Ready for Phase 15: Polish

---
*Phase: 14-blog*
*Completed: 2026-02-22*
