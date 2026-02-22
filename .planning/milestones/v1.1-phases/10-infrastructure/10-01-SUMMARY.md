---
phase: 10-infrastructure
plan: 01
subsystem: database
tags: [prisma, sanitize-html, xss, seed, subjects, html-sanitization]

# Dependency graph
requires: []
provides:
  - v1.1 database migration verified (subjects, resources, resource_prices, resource_purchases, resource_subjects, simulations, blog_posts, blog_post_subjects tables)
  - Four subjects seeded (Physics, Mathematics, Chemistry, Computer Science)
  - Shared sanitizeHtml utility at src/lib/sanitize-html.ts
  - XSS protection at all four user-content dangerouslySetInnerHTML sites
affects:
  - 11-resource-admin
  - 12-resource-public
  - 13-simulations
  - 14-blog

# Tech tracking
tech-stack:
  added: []
  patterns: [Shared sanitizeHtml wrapper — all user HTML passes through src/lib/sanitize-html.ts before rendering or saving]

key-files:
  created:
    - src/lib/sanitize-html.ts
    - src/app/(main)/blog/[slug]/page.tsx
    - src/app/(main)/resources/[slug]/page.tsx
    - src/app/(main)/simulations/[slug]/page.tsx
  modified:
    - prisma/seed.ts
    - src/lib/admin-actions.ts

key-decisions:
  - "Four subjects chosen: Physics, Mathematics, Chemistry, Computer Science (replaces six granular subjects)"
  - "Single shared sanitizeHtml utility in src/lib/sanitize-html.ts — no inline sanitize-html config anywhere else"
  - "sanitizeHtml allows KaTeX/MathML tags plus standard HTML; strips script/iframe/on* handlers"

patterns-established:
  - "sanitizeHtml wrapper: always import from @/lib/sanitize-html, never directly from sanitize-html"
  - "Seed idempotency: use createMany with skipDuplicates for chapters to avoid (bookId, position) constraint conflicts"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 10 Plan 01: Infrastructure Summary

**v1.1 database migration verified, four subjects seeded, and shared XSS-sanitizing HTML utility wired into all four user-content rendering paths**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T01:30:01Z
- **Completed:** 2026-02-22T01:33:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Verified v1.1 database migration applied (8 new tables: subjects, resources, resource_prices, resource_purchases, resource_subjects, simulations, blog_posts, blog_post_subjects)
- Seeded exactly four subjects (Physics, Mathematics, Chemistry, Computer Science) using idempotent upsert pattern
- Created `src/lib/sanitize-html.ts` as the single sanitizeHtml source of truth — full KaTeX/MathML + standard HTML allowlist, XSS vectors stripped
- Wired sanitizeHtml into all four dangerous call sites: blog content, resource content, simulation teacherGuide, simulation parameterDocs
- Refactored admin-actions.ts to use shared utility (eliminated duplicate inline config)

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify migration, update seed with four subjects** - `426e450` (chore)
2. **Task 2: Create shared sanitizeHtml utility and wire into all XSS call sites** - `76e09e9` (feat)

**Plan metadata:** committed with final docs commit

## Files Created/Modified

- `src/lib/sanitize-html.ts` - Shared sanitizeHtml utility; wraps sanitize-html with allowed-tags for standard HTML, pre/code/img/table, KaTeX/MathML
- `src/app/(main)/blog/[slug]/page.tsx` - Added sanitizeHtml import; wraps post.content
- `src/app/(main)/resources/[slug]/page.tsx` - Added sanitizeHtml import; wraps resource.content
- `src/app/(main)/simulations/[slug]/page.tsx` - Added sanitizeHtml import; wraps resource.content, simulation.teacherGuide, simulation.parameterDocs (3 call sites)
- `prisma/seed.ts` - Updated subjects list to four v1.1 subjects; fixed chapter createMany with skipDuplicates
- `src/lib/admin-actions.ts` - Replaced inline sanitize-html config with shared sanitizeHtml utility

## Decisions Made

- Four subjects (Physics, Mathematics, Chemistry, Computer Science) replace the previous six granular subjects — matches user decision captured in v1.1 research
- Single shared sanitizeHtml utility is the canonical config; both admin saves and public rendering use identical allowlists ensuring consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed seed chapter upsert: unique constraint (bookId, position) violation**
- **Found during:** Task 1 (verify migration, run seed)
- **Issue:** `prisma.chapter.upsert` with `where: { bookId_slug }` + `update: { content, position }` failed with P2002 because the existing database had chapters with different slugs at those positions. When `(bookId_slug)` lookup missed, the create branch tried to insert position N which was already taken by a chapter with a different slug.
- **Fix:** Changed all three chapter loops from `upsert` to `createMany({ data, skipDuplicates: true })`. The `update` was dropped (seed data is static), and `skipDuplicates` handles all uniqueness conflicts gracefully.
- **Files modified:** `prisma/seed.ts`
- **Verification:** `npx prisma db seed` completed successfully with "Seeding complete" output
- **Committed in:** `426e450` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Fix was required for seed to run. No scope creep. Subjects were seeded correctly before the bug manifested.

## Issues Encountered

- The chapter upsert bug was a pre-existing issue — previous seed runs must have used a fresh database. The fix (createMany + skipDuplicates) is strictly better for idempotency.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Database schema verified, all v1.1 tables present
- Four subjects available for tagging resources, simulations, and blog posts
- XSS protection in place on all public content rendering paths
- Phase 11 (Resource Admin) can proceed — subjects are seeded and schema is ready

---
*Phase: 10-infrastructure*
*Completed: 2026-02-22*
