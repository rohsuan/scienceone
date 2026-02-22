---
phase: 15-polish-and-cross-linking
plan: "01"
subsystem: listing-pages
tags: [pagination, resources, blog, simulations, ux]
dependency_graph:
  requires: []
  provides: [paginated-resource-listing, paginated-blog-listing, shared-pagination-component]
  affects: [resource-queries, blog-queries, resources-page, blog-page, simulations-page]
tech_stack:
  added: []
  patterns: [offset-pagination, parallel-count-query, url-search-param-state]
key_files:
  created:
    - src/components/Pagination.tsx
  modified:
    - src/lib/resource-queries.ts
    - src/lib/blog-queries.ts
    - src/app/(main)/resources/page.tsx
    - src/app/(main)/blog/page.tsx
    - src/app/(main)/simulations/page.tsx
    - src/components/resources/ResourceFilters.tsx
    - src/components/blog/BlogFilters.tsx
    - src/components/resources/ResourceSearchInput.tsx
decisions:
  - "Pagination component uses conditional rendering (not disabled) to avoid asChild + disabled anchor pitfall"
  - "PAGE_SIZE = 12 exported from each query module so listing pages can compute totalPages without importing a separate constant"
  - "simulations/page.tsx fixed in place (Rule 1) as it calls getPublishedResources which now returns paginated shape"
metrics:
  duration: 2 min
  completed_date: "2026-02-22"
  tasks_completed: 2
  files_modified: 8
---

# Phase 15 Plan 01: Pagination for Resource and Blog Listing Pages Summary

Offset pagination (12 items/page) added to resource and blog listing pages with a shared Pagination component; filter and search inputs reset to page 1 on change.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add pagination to query functions and create shared Pagination component | ef43e78 | src/lib/resource-queries.ts, src/lib/blog-queries.ts, src/components/Pagination.tsx |
| 2 | Wire pagination into listing pages and fix filter/search page reset | df31b18 | src/app/(main)/resources/page.tsx, src/app/(main)/blog/page.tsx, src/components/resources/ResourceFilters.tsx, src/components/blog/BlogFilters.tsx, src/components/resources/ResourceSearchInput.tsx |

## Decisions Made

- **Conditional rendering over disabled**: The Pagination component simply does not render Previous/Next buttons at boundaries, avoiding the `disabled` + `asChild` + `<Link>` pitfall where the anchor remains clickable.
- **PAGE_SIZE exported from each query module**: Listing pages import PAGE_SIZE from the query module to compute `totalPages = Math.ceil(totalCount / PAGE_SIZE)`, keeping the constant co-located with the query.
- **parallel count query**: Both query functions use `Promise.all([findMany, count])` so the total count does not add a sequential round-trip.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed simulations page broken by query return type change**
- **Found during:** Task 2 (TypeScript check after Task 1)
- **Issue:** `src/app/(main)/simulations/page.tsx` called `getPublishedResources` and accessed the result as a raw array (`.length`, `.map`). After Task 1 changed the return type to `{ items, totalCount }`, the page would fail at runtime and throw TypeScript errors.
- **Fix:** Destructured `{ items: resources }` from the return value. Simulations page has no pagination (simulations are few in number), so no Pagination component was added.
- **Files modified:** src/app/(main)/simulations/page.tsx
- **Commit:** df31b18

## Self-Check: PASSED

All 9 key files verified present on disk. Both task commits (ef43e78, df31b18) confirmed in git log.
