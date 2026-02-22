---
phase: 12-resource-public-purchase
plan: 01
subsystem: ui
tags: [resources, download, prisma, nextjs, presigned-url]

# Dependency graph
requires:
  - phase: 11-resource-admin
    provides: Resource model, ResourcePrice, ResourcePurchase tables, admin upload/manage flow

provides:
  - ResourceDownloadButton client component — fetches presigned URL then redirects (no JSON-in-browser)
  - Resource detail page using client download button instead of plain <a> link
  - isActive pricing filter applied at application level in detail page
  - Neon production database has migration 20260222002050_add_resources_blog_simulations applied

affects:
  - 12-resource-public-purchase (next plans in phase — buy button flow, Stripe webhook)
  - simulations page (same DB migration unlocks simulation queries)
  - blog page (same DB migration unlocks blog queries)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ResourceDownloadButton follows book DownloadButton pattern: fetch presigned URL client-side then set window.location.href"
    - "isActive pricing filter: applied in application layer (activePricing computed variable) not Prisma include, because Prisma cannot filter one-to-one optional relations with where clause"

key-files:
  created:
    - src/components/resources/ResourceDownloadButton.tsx
  modified:
    - src/app/(main)/resources/[slug]/page.tsx
    - src/lib/resource-queries.ts

key-decisions:
  - "Prisma where filter in include is invalid for one-to-one optional relations (ResourcePrice?) — must filter isActive at application level using activePricing = resource.pricing?.isActive ? resource.pricing : null"
  - "ResourceDownloadButton uses useState (not useTransition) for loading state, matching book DownloadButton pattern"
  - "Neon production DB migration deployed during Task 2 verification — migration was pending, causing PrismaClientKnownRequestError on all resource queries"

patterns-established:
  - "Client download button pattern: useState(false) loading, fetch API route, check res.ok, parse { url }, set window.location.href = url, toast.error on failure"
  - "Application-level relation filtering when Prisma where-in-include is not supported for optional one-to-one relations"

requirements-completed: [RES-03, RES-04, RES-05, RES-09]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 12 Plan 01: Resource Download Button Fix Summary

**ResourceDownloadButton client component with fetch-then-redirect pattern, isActive pricing filter at app level, Neon migration deployed to unblock resource pages**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T02:38:56Z
- **Completed:** 2026-02-22T02:44:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ResourceDownloadButton client component that fetches a presigned URL from `/api/resource-download` then redirects — fixing the JSON-in-browser bug where `<a href="/api/resource-download...">` caused the browser to render raw `{ url }` JSON
- Updated resource detail page to use ResourceDownloadButton, removed the plain `<a>` link, and added `activePricing` computed variable to filter out inactive pricing at the application level
- Deployed pending migration to Neon production database so resources, subjects, pricing, and related tables exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ResourceDownloadButton, fix detail page and pricing query** - `7d73929` (feat)
2. **Task 2: Bug fix — revert invalid Prisma include filter, handle isActive at app level, deploy migration** - `fefcf2a` (fix)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `src/components/resources/ResourceDownloadButton.tsx` - Client component: fetch presigned URL on click, redirect via window.location.href, loading/error states
- `src/app/(main)/resources/[slug]/page.tsx` - Uses ResourceDownloadButton; activePricing computed variable filters inactive pricing
- `src/lib/resource-queries.ts` - Reverted isActive filter (invalid for one-to-one relations); pricing: true kept for both queries

## Decisions Made
- Prisma `include: { pricing: { where: { isActive: true } } }` is invalid for `ResourcePrice?` (one-to-one optional relation) — Prisma throws `PrismaClientKnownRequestError`. Fixed by computing `activePricing = resource.pricing?.isActive ? resource.pricing : null` in the page component.
- Neon production database had migration `20260222002050_add_resources_blog_simulations` unapplied — deployed with `prisma migrate deploy` during verification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma include-level isActive filter invalid for one-to-one relations**
- **Found during:** Task 2 (Rodney verification — page showed PrismaClientKnownRequestError)
- **Issue:** `pricing: { where: { isActive: true } }` in Prisma `include` is only valid for list relations. `ResourcePrice?` is an optional one-to-one relation — Prisma rejects the where clause at runtime.
- **Fix:** Reverted to `pricing: true` in both resource queries. Added `activePricing = resource.pricing?.isActive ? resource.pricing : null` in the detail page. Updated all `resource.pricing` references in conditional display to use `activePricing`.
- **Files modified:** `src/lib/resource-queries.ts`, `src/app/(main)/resources/[slug]/page.tsx`
- **Verification:** TypeScript check passes; `/resources` page loads without errors in Rodney
- **Committed in:** fefcf2a

**2. [Rule 3 - Blocking] Deployed pending migration to Neon production database**
- **Found during:** Task 2 (Rodney verification — `/resources` showed server error)
- **Issue:** Neon database was missing migration `20260222002050_add_resources_blog_simulations` — resources, blog, simulation tables did not exist, causing all resource queries to fail
- **Fix:** Ran `DATABASE_URL="<neon-url>" npx prisma migrate deploy`
- **Files modified:** None (database state only)
- **Verification:** `/resources` page loaded with empty state after migration applied
- **Committed in:** fefcf2a (tracked in SUMMARY)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes essential for correctness and page availability. No scope creep.

## Issues Encountered
- Neon production database migration was unapplied — the first-pass code existed but the DB schema was never deployed to Neon. This blocked all resource page testing until resolved.

## User Setup Required
None - no external service configuration required. Migration to Neon was deployed automatically.

## Next Phase Readiness
- Resource listing page renders with working search, subject/type/level filters, and correct empty states
- Resource detail page correctly uses ResourceDownloadButton (client fetch-then-redirect) for free resources
- Active pricing filter works at application level — inactive pricing is hidden
- Ready for Phase 12 Plan 02 (Stripe webhook and purchase flow verification)

## Self-Check: PASSED

- FOUND: `src/components/resources/ResourceDownloadButton.tsx`
- FOUND: `src/app/(main)/resources/[slug]/page.tsx`
- FOUND: `src/lib/resource-queries.ts`
- FOUND: `.planning/phases/12-resource-public-purchase/12-01-SUMMARY.md`
- FOUND commit: 7d73929 (feat: create ResourceDownloadButton)
- FOUND commit: fefcf2a (fix: handle isActive filter at app level, deploy migration)

---
*Phase: 12-resource-public-purchase*
*Completed: 2026-02-22*
