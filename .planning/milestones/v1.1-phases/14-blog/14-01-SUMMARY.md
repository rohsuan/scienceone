---
phase: 14-blog
plan: 01
subsystem: ui
tags: [react, nextjs, server-actions, tanstack-table, sonner, useTransition]

# Dependency graph
requires:
  - phase: 11-resource-admin
    provides: ResourceRowActions pattern with useTransition + toast inside ColumnDef cell
provides:
  - BlogRowActions component with useTransition, toast feedback, and disabled states
  - togglePublishBlogPost with slug revalidation and publishedAt clobber guard
affects: [blog-admin, blog-public]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RowActions pattern: extract named component above columns export to enable useTransition hook"
    - "publishedAt clobber guard: check existing value before setting to preserve original publish date"
    - "slug revalidation: fetch slug before update then revalidatePath after"

key-files:
  created: []
  modified:
    - src/lib/blog-admin-actions.ts
    - src/components/admin/BlogPostTableColumns.tsx

key-decisions:
  - "BlogRowActions follows ResourceRowActions verbatim — same useTransition/startTransition/try-catch pattern"
  - "publishedAt only set on first publish (existing?.publishedAt guard) — re-publish preserves original date"
  - "revalidatePath(/blog/{slug}) called after toggle — blog detail page immediately accessible after publish"

patterns-established:
  - "BlogRowActions: named component above columns export, single isPending covers both actions"

requirements-completed: [BLOG-01, BLOG-02]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 14 Plan 01: Blog Admin Actions Fix Summary

**BlogRowActions extracted with useTransition/toast (matching ResourceRowActions), and togglePublishBlogPost fixed with slug revalidation and publishedAt preservation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-22T04:00:00Z
- **Completed:** 2026-02-22T04:03:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed togglePublishBlogPost to fetch existing slug before update and revalidate /blog/{slug} detail page
- Added publishedAt clobber guard: only sets publishedAt on first publish, preserves original date on re-publish
- Extracted BlogRowActions component with useTransition — disables dropdown trigger while action is in-flight
- Added toast.success/toast.error feedback for publish, unpublish, and delete actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix togglePublishBlogPost server action** - `919f45d` (fix)
2. **Task 2: Extract BlogRowActions with useTransition and toast** - `6d9f3e1` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/lib/blog-admin-actions.ts` - Fixed togglePublishBlogPost with findUnique pre-fetch, publishedAt guard, slug revalidation
- `src/components/admin/BlogPostTableColumns.tsx` - Extracted BlogRowActions with useTransition, toast, isPending disabled states

## Decisions Made
- BlogRowActions follows ResourceRowActions verbatim in structure — same useTransition/startTransition/try-catch pattern
- publishedAt clobber guard: `publish && !existing?.publishedAt` — only sets date on first publish
- revalidatePath guarded by `if (existing?.slug)` — defensive null check

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Blog admin publish/unpublish/delete all work with proper UX feedback
- Blog detail page revalidated on publish — immediately accessible to public readers
- Ready for Phase 14 Plan 02 (next blog plan if any)

---
*Phase: 14-blog*
*Completed: 2026-02-22*
