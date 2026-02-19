---
phase: 03-catalog
plan: 01
subsystem: ui
tags: [nextjs, react, prisma, tailwind, use-debounce, next/image]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema with Book, Category, BookCategory, BookPrice models; shadcn components (Badge, Card, Button, Input)
  - phase: 02-ingest
    provides: Published books in database with cover images stored in R2
provides:
  - /catalog page server component with URL-driven filter/sort/search via searchParams
  - getPublishedBooks() and getCategories() Prisma query helpers
  - BookCard, BookCoverImage, CategoryBadge, CatalogFilters, SearchInput reusable components
affects:
  - 03-02: book detail page uses BookCoverImage and slug-based routing established here
  - 04-reader: catalog links are entry point to chapter reader
  - 05-payments: catalog displays pricing and open-access status

# Tech tracking
tech-stack:
  added:
    - use-debounce@10.1.0 (debounced URL updates for search)
  patterns:
    - URL-driven filter state via router.replace() with URLSearchParams
    - Client components (CatalogFilters, SearchInput) wrapped in Suspense for useSearchParams compatibility
    - Async searchParams in Next.js 16 page components (must await Promise)
    - Prisma typed with Prisma.BookWhereInput and Prisma.BookOrderByWithRelationInput from generated client
    - BookCoverImage with next/image fill for external R2 URLs or gradient placeholder fallback

key-files:
  created:
    - src/lib/book-queries.ts
    - src/app/(main)/catalog/page.tsx
    - src/app/(main)/catalog/loading.tsx
    - src/components/catalog/BookCard.tsx
    - src/components/catalog/BookCoverImage.tsx
    - src/components/catalog/CategoryBadge.tsx
    - src/components/catalog/CatalogFilters.tsx
    - src/components/catalog/SearchInput.tsx
  modified:
    - next.config.ts (added images.remotePatterns for R2)
    - package.json (added use-debounce)

key-decisions:
  - "Prisma.BookWhereInput / Prisma.BookOrderByWithRelationInput used for type safety in book-queries.ts — import path is @/generated/prisma/client not @prisma/client"
  - "BookCard uses @prisma/client/runtime/client for Decimal type (Prisma 7 generated client path)"
  - "next.config.ts remotePatterns uses *.r2.cloudflarestorage.com wildcard for any R2 bucket subdomain"
  - "Suspense boundaries required around SearchInput and CatalogFilters because useSearchParams() requires Suspense in Next.js App Router"
  - "searchParams in Next.js 16 page is a Promise — must await before reading keys"

patterns-established:
  - "Catalog filter pattern: client components read/write URL via router.replace() with URLSearchParams; server page reads from awaited searchParams"
  - "BookCoverImage pattern: next/image fill with aspect-[2/3] container for external URLs; gradient + initial letter fallback for null"
  - "Component organization: catalog-specific components live in src/components/catalog/"

requirements-completed:
  - CAT-01
  - CAT-03

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 3 Plan 01: Catalog Listing Summary

**URL-driven catalog page with server Prisma queries, Suspense-wrapped client filter/sort/search components, and reusable BookCard with next/image R2 support**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T02:17:41Z
- **Completed:** 2026-02-19T02:20:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- /catalog page renders published books in a 3-col responsive grid using server-side Prisma queries
- Category filter pills and sort dropdown update URL searchParams, driving server re-render
- Debounced search input (300ms) live-filters books by title, author, or subject via URL state
- BookCard shows next/image cover (with R2 remotePatterns) or gradient placeholder, pricing, and category badges
- Loading skeleton (animate-pulse) provides instant visual feedback during navigation

## Task Commits

1. **Task 1: Book query helpers, use-debounce, next.config.ts** - `257d0a3` (feat)
2. **Task 2: Catalog page, BookCard, filters, search, loading** - `1c8fefc` (feat)

## Files Created/Modified

- `src/lib/book-queries.ts` - getPublishedBooks (filter, sort, search) and getCategories Prisma helpers
- `src/app/(main)/catalog/page.tsx` - Async server component reading awaited searchParams
- `src/app/(main)/catalog/loading.tsx` - Animated skeleton grid with 6 placeholder cards
- `src/components/catalog/BookCard.tsx` - Card component with cover, title, author, categories, pricing
- `src/components/catalog/BookCoverImage.tsx` - next/image fill or gradient+initial fallback
- `src/components/catalog/CategoryBadge.tsx` - shadcn Badge pill with secondary variant
- `src/components/catalog/CatalogFilters.tsx` - Category pill buttons + sort select via URL state
- `src/components/catalog/SearchInput.tsx` - Debounced search input with lucide Search icon
- `next.config.ts` - Added images.remotePatterns for *.r2.cloudflarestorage.com
- `package.json` - Added use-debounce@10.1.0

## Decisions Made

- Prisma types imported from `@/generated/prisma/client` (Prisma 7 generated path) — not `@prisma/client`
- `Decimal` type for BookPrice.amount uses `@prisma/client/runtime/client` import path
- `searchParams` in Next.js 16 is a `Promise<>` — must `await` before accessing keys
- Both `SearchInput` and `CatalogFilters` wrapped in individual `<Suspense>` boundaries required for `useSearchParams()` in App Router

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma type annotation approach in book-queries.ts**
- **Found during:** Task 1 (book-queries.ts creation)
- **Issue:** Used `Parameters<typeof prisma.book.findMany>[0]["where"]` type extraction which fails TypeScript — `findMany` params type is potentially `undefined`
- **Fix:** Replaced with direct `Prisma.BookWhereInput` and `Prisma.BookOrderByWithRelationInput` from `@/generated/prisma/client`
- **Files modified:** src/lib/book-queries.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 257d0a3 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Decimal type import path in BookCard.tsx**
- **Found during:** Task 2 (BookCard creation)
- **Issue:** Used `@prisma/client/runtime/library` which does not exist in Prisma 7 — correct path is `@prisma/client/runtime/client`
- **Fix:** Changed import path to `@prisma/client/runtime/client`
- **Files modified:** src/components/catalog/BookCard.tsx
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** 1c8fefc (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug, TypeScript type path corrections)
**Impact on plan:** Both fixes were Prisma 7 import path issues caught during TypeScript compilation. No scope creep.

## Issues Encountered

- Prisma 7 changed the generated client location (`@/generated/prisma/client`) and runtime path (`@prisma/client/runtime/client`) — required adjusting both type import paths vs. Prisma 5/6 conventions documented in plan

## User Setup Required

None - no external service configuration required for this plan. (R2 remotePatterns configured for when covers are stored; books without covers show placeholder.)

## Next Phase Readiness

- /catalog page is complete and build-verified
- BookCard links to `/catalog/${book.slug}` — slug-based routing ready for 03-02 book detail page
- BookCoverImage component reusable for book detail page hero image
- next/image R2 remotePatterns in place for cover images across all future phases

---
*Phase: 03-catalog*
*Completed: 2026-02-19*
