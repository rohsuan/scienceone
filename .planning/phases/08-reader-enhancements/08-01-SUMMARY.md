---
phase: 08-reader-enhancements
plan: 01
subsystem: ui
tags: [citation, bibtex, apa, clipboard, prisma, schema]

# Dependency graph
requires:
  - phase: 03-catalog
    provides: Book detail page at /catalog/[slug] where CitationExport is placed
  - phase: 07-admin-dashboard
    provides: BookEditForm and updateBook server action where publishYear field is added
provides:
  - Academic citation export (BibTeX and APA) on book detail page
  - publishYear Int? field on Book model with migration
  - Pure citation formatting library (buildBibtex, buildApa)
  - Publication Year input in admin book edit form
affects: [catalog, admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure citation formatter pattern: CitationData interface + buildBibtex/buildApa pure functions in src/lib/citation.ts"
    - "Client component clipboard copy: navigator.clipboard.writeText + sonner toast + useState copiedFormat reset via setTimeout"

key-files:
  created:
    - src/lib/citation.ts
    - src/components/catalog/CitationExport.tsx
    - prisma/migrations/20260219171232_add_publish_year/migration.sql
  modified:
    - prisma/schema.prisma
    - src/app/(main)/catalog/[slug]/page.tsx
    - src/lib/admin-actions.ts
    - src/components/admin/BookEditForm.tsx

key-decisions:
  - "publishYear Int? added to schema with migration (create-only, DB offline) — createdAt is ingestion date, not publication year; dedicated field allows admin override for accurate academic citations"
  - "Citation generation is pure string formatting — no external library used (cite.js/citeproc-js would be overkill for two fixed formats)"
  - "APA author name used as-is (not parsed into Last, First format) — free-form names like multi-word surnames would break if split"
  - "CitationExport visible to all users (no auth gate) — citation metadata (title, author, ISBN) is already public on the detail page"
  - "BibTeX citation key sanitized with .replace(/[^a-zA-Z0-9]/g, '') — avoids invalid keys from accented names like O'Brien or García"

patterns-established:
  - "Pure citation formatter: CitationData interface + resolveYear fallback (publishYear ?? createdAt year)"
  - "Transient copy feedback: useState copiedFormat + setTimeout 2000ms reset to null"

requirements-completed: [ADM-07]

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 8 Plan 01: Academic Citation Export Summary

**BibTeX and APA citation export via navigator.clipboard with sonner toast, publishYear schema field, pure formatting library, and admin form integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T17:12:17Z
- **Completed:** 2026-02-19T17:15:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Book detail page at /catalog/[slug] now renders a "Cite This Book" section with two one-click copy buttons (Copy BibTeX, Copy APA)
- Pure citation formatting library (src/lib/citation.ts) generates correct BibTeX @book{} and APA 7th edition strings from book data
- publishYear Int? schema field added with Prisma migration (create-only for offline DB) and client regenerated
- Admin book edit form has a Publication Year number input in the Details tab that persists to the database via updateBook

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration, citation library, and CitationExport component** - `732f633` (feat)
2. **Task 2: Add publishYear to admin edit form and updateBook action** - `b33efb4` (feat)

**Plan metadata:** (final commit below)

## Files Created/Modified
- `prisma/schema.prisma` - Added publishYear Int? field to Book model
- `prisma/migrations/20260219171232_add_publish_year/migration.sql` - ALTER TABLE books ADD COLUMN publishYear INTEGER
- `src/lib/citation.ts` - CitationData interface, buildBibtex, buildApa, buildCitationKey, resolveYear pure functions
- `src/components/catalog/CitationExport.tsx` - "use client" component with two copy buttons and sonner toast feedback
- `src/app/(main)/catalog/[slug]/page.tsx` - Added CitationExport import and render after print metadata section
- `src/lib/admin-actions.ts` - Added publishYear to bookUpdateSchema and prisma.book.update data
- `src/components/admin/BookEditForm.tsx` - Added publishYear to defaultValues and Publication Year input field in Details tab

## Decisions Made
- publishYear Int? field added to schema — createdAt is the ingestion date, not publication year; admin override field is correct for academic citations
- No external citation library — BibTeX and APA are fixed two-format templates; pure string formatting is 30 lines and trivially correct
- APA author name is used as-is (not parsed to Last, First) — free-form names like multi-word surnames break if split on spaces
- BibTeX citation key sanitized with regex — strips non-alphanumeric characters to prevent invalid keys from names like O'Brien
- CitationExport visible to all users without auth — title, author, ISBN are already public on the page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 8 (Reader Enhancements / ADM-07) is complete — all academic polish citation export feature delivered
- When PostgreSQL is available: run `npx prisma migrate deploy` to apply the publishYear migration to the live database
- Admin can set Publication Year in the book edit form Details tab immediately once migration is applied

## Self-Check: PASSED

All created files exist on disk. Both task commits (732f633, b33efb4) confirmed in git log.

---
*Phase: 08-reader-enhancements*
*Completed: 2026-02-20*
