---
phase: 07-admin-dashboard
plan: 01
subsystem: ui
tags: [tanstack-table, prisma, admin, react, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: auth system (Better Auth with role field), proxy.ts pattern
  - phase: 06-secure-downloads
    provides: Book model with pdfKey/epubKey fields

provides:
  - Admin route group (admin) with role-based auth guard
  - AdminSidebar navigation component
  - IngestJob Prisma model (for pipeline status tracking)
  - /admin page with TanStack Table book data table
  - Book server actions: togglePublish, createBook, deleteBook
  - Admin queries: getAllBooksAdmin (no isPublished filter)
  - CreateBookDialog client component with slug auto-generation

affects: [07-02, 07-03]

# Tech tracking
tech-stack:
  added: ["@tanstack/react-table", "react-dropzone", "shadcn table", "shadcn dialog", "shadcn alert-dialog", "shadcn textarea", "shadcn select", "shadcn switch", "shadcn progress", "shadcn tabs", "shadcn skeleton"]
  patterns: ["Admin route group pattern with layout auth guard + defense-in-depth page-level check", "Server actions with requireAdmin() helper for role validation", "TanStack Table with SortingState for client-side sorting"]

key-files:
  created:
    - prisma/schema.prisma (IngestJob model added)
    - src/app/(admin)/layout.tsx
    - src/app/(admin)/admin/page.tsx
    - src/components/admin/AdminSidebar.tsx
    - src/components/admin/BookTable.tsx
    - src/components/admin/BookTableColumns.tsx
    - src/components/admin/CreateBookDialog.tsx
    - src/lib/admin-queries.ts
    - src/lib/admin-actions.ts
  modified:
    - proxy.ts (added /admin/:path* to matcher)
    - package.json (@tanstack/react-table, react-dropzone added)

key-decisions:
  - "Admin layout (route group) uses standalone (admin) route group — completely isolated from (main) Header/Footer, same pattern as (auth)"
  - "requireAdmin() helper centralizes admin role check in server actions — DRY pattern for all admin actions"
  - "CreateBookDialog extracted as client component — admin/page.tsx stays as server component to call getAllBooksAdmin() directly"
  - "Prisma migration created with --create-only (DB offline blocker from 01-01 still active)"

patterns-established:
  - "Admin route group: (admin)/layout.tsx checks session.user.role === 'admin', redirects non-admin to /"
  - "Defense-in-depth: proxy.ts blocks unauthenticated, layout blocks non-admin, page re-checks admin"
  - "Server actions pattern: requireAdmin() at top of every action, revalidatePath for cache invalidation"

requirements-completed: [ADM-06, ADM-04]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 7 Plan 01: Admin Dashboard Foundation Summary

**TanStack Table book management dashboard at /admin with IngestJob schema, admin auth guard, sortable data table, create-book dialog, and publish/delete row actions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T15:14:38Z
- **Completed:** 2026-02-19T15:17:53Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments
- IngestJob Prisma model added (with --create-only migration) ready for Phase 7 ingest pipeline
- Admin route group with role-based auth guard at layout level and defense-in-depth check at page level
- /admin page with TanStack Table showing all books (published + unpublished) with sorting, status badges, format badges, chapter counts
- Create Book dialog with slug auto-generation from title and useTransition for no double-submit
- Server actions for togglePublish, createBook, deleteBook with admin-only auth guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, add IngestJob model, create admin layout and route protection** - `3479902` (feat)
2. **Task 2: Build book data table with create book dialog and publish toggle** - `55646c1` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `prisma/schema.prisma` - Added IngestJob model and ingestJobs relation to Book
- `prisma/migrations/20260219151600_add_ingest_job/migration.sql` - Migration (create-only, DB offline)
- `proxy.ts` - Extended matcher to include /admin/:path*
- `src/app/(admin)/layout.tsx` - Admin layout with session.user.role === "admin" guard
- `src/app/(admin)/admin/page.tsx` - Books page server component with defense-in-depth auth
- `src/components/admin/AdminSidebar.tsx` - Left nav sidebar with Books link and Back to Site
- `src/components/admin/BookTable.tsx` - TanStack Table client component with SortingState
- `src/components/admin/BookTableColumns.tsx` - 7 column definitions with actions dropdown
- `src/components/admin/CreateBookDialog.tsx` - Dialog client component with useTransition
- `src/lib/admin-queries.ts` - getAllBooksAdmin() with no isPublished filter
- `src/lib/admin-actions.ts` - togglePublish, createBook, deleteBook server actions
- `src/components/ui/` - 9 new shadcn components (table, dialog, alert-dialog, textarea, select, switch, progress, tabs, skeleton)
- `package.json` - Added @tanstack/react-table, react-dropzone

## Decisions Made
- Admin route group follows same isolation pattern as (auth) — no Header/Footer from (main) layout
- requireAdmin() helper centralizes role check across all server actions (DRY pattern)
- CreateBookDialog extracted as client component so admin/page.tsx remains a server component
- Prisma migration created with --create-only since DB is offline (same pattern as prior migrations)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The IngestJob migration (20260219151600_add_ingest_job) needs to be applied when PostgreSQL is available: `npx prisma migrate deploy`.

## Next Phase Readiness
- Admin route group and book table foundation ready for Plan 02 (book editor/ingest uploader)
- IngestJob schema ready for use by ingest pipeline in Plan 02/03
- All shadcn components needed for remaining Phase 7 plans are now installed

---
*Phase: 07-admin-dashboard*
*Completed: 2026-02-19*
