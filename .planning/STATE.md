# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser
**Current focus:** Phase 9 - Audit Gap Closure — COMPLETE

## Current Position

Phase: 9 of 9 (Audit Gap Closure) — COMPLETE
Plan: 1 of 1 in current phase — ALL COMPLETE
Status: Phase 9 complete — all 1 plans done (Zod NaN-to-null, sign-in redirect, open access anonymous download)
Last activity: 2026-02-20 — 09-01 complete: Zod NaN fix, sign-in redirect prop flow, open access anonymous download UI and API

Progress: [████████████████████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 7 min
- Total execution time: 115 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4/4 | 43 min | 11 min |
| 02-ingest | 2/2 | 12 min | 6 min |
| 03-catalog | 2/2 | 23 min | 12 min |
| 04-reader | 2/2 | 11 min | 6 min |
| 05-payments | 2/2 | 8 min | 4 min |
| 06-secure-downloads | 2/2 | 12 min | 6 min |
| 07-admin-dashboard | 3/3 | 13 min | 4 min |

**Recent Trend:**
- Last 5 plans: 05-01 (3 min), 05-02 (5 min), 06-01 (2 min), 06-02 (10 min), 07-01 (3 min)
- Trend: fast

*Updated after each plan completion*
| Phase 08-reader-enhancements P01 | 3 | 2 tasks | 7 files |
| Phase 09 P01 | 3 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Ingest pipeline is Phase 2 (before catalog/reader) — highest-risk dependency; every feature depends on correctly ingested content with pre-rendered KaTeX math
- [Roadmap]: Auth split from admin dashboard — AUTH-01/02 in Phase 1 (foundation), AUTH-03/04 (My Library, receipt email) in Phase 5 (payments) where they are first needed
- [Roadmap]: ADM-07 (citation export) placed in Phase 8 — academic polish feature, does not block revenue path
- [01-01]: Prisma 7 prisma.config.ts lives at project root (not prisma/ subdirectory) — Prisma init behavior
- [01-01]: Prisma 7 generated client import path is @/generated/prisma/client (not @/generated/prisma — no index.ts)
- [01-01]: Seed users have no passwords — Better Auth manages hashing; use Better Auth API for test login accounts
- [Phase 01-02]: shadcn canary CLI required for Tailwind v4 — stable CLI errors on @theme inline syntax
- [Phase 01-02]: sonner replaces deprecated toast component in shadcn canary
- [Phase 01-02]: Route group (main)/page.tsx replaces boilerplate app/page.tsx — cannot coexist
- [Phase 01-02]: oklch color space used for academic navy/indigo palette in Tailwind v4 CSS variables
- [01-03]: sessionStorage passes email from sign-up form to verify-email page for resend flow — Better Auth sendVerificationEmail requires email as parameter
- [01-03]: Better Auth error codes (USER_ALREADY_EXISTS, INVALID_EMAIL_OR_PASSWORD, EMAIL_NOT_VERIFIED) checked alongside HTTP status codes for maximum compatibility
- [01-03]: Auth layout is a standalone route group (auth) with its own layout.tsx — completely isolated from main layout Header/Footer
- [01-04]: proxy.ts uses export function proxy (not middleware) — Next.js 16 renamed middleware to proxy
- [01-04]: Defense-in-depth route protection: proxy.ts (getSessionCookie) + server-side auth.api.getSession both check auth to guard against CVE-2025-29927
- [01-04]: signOut callback uses router.push('/') not redirect() — client component logout requires client-side navigation
- [01-04]: Empty state components (EmptyLibrary, EmptyRecentlyRead) are explicit phase slots for Phase 5 and Phase 4 respectively
- [02-01]: Pandoc spawned via spawn() not exec() with shell:false — array args prevent shell injection across all format types
- [02-01]: KaTeX throwOnError:true with manual catch — errors collected in caller-owned errors[] array, pipeline renders [MATH ERROR] placeholder and continues
- [02-01]: Chapter splitting uses cheerio DOM traversal not regex — handles nested HTML and Pandoc varied output safely
- [02-01]: Health report halted flag set when mathErrors.length > 0 OR unsupportedCommands.length > 0 — downstream storage should not process broken content
- [Phase 02-ingest]: R2 client uses WHEN_REQUIRED checksum config — CRC32 causes 400 errors from Cloudflare R2 S3-compatible API
- [Phase 02-ingest]: stripMathDelimiters() added to katex-render.ts — Pandoc wraps equation environments with $...$ in fallback mode; stripping normalises before KaTeX rendering
- [Phase 02-ingest]: writeChapters uses prisma.$transaction(deleteMany + createMany) — atomic re-ingest prevents partial chapter state on failure
- [Phase 03-catalog]: Prisma types imported from @/generated/prisma/client (Prisma 7 generated path) — BookWhereInput and BookOrderByWithRelationInput
- [Phase 03-catalog]: searchParams in Next.js 16 page is a Promise — must await before reading keys
- [Phase 03-catalog]: Suspense boundaries required around SearchInput and CatalogFilters because useSearchParams() requires Suspense in App Router
- [Phase 03-catalog]: URL-driven filter state pattern: client components use router.replace() with URLSearchParams; server page reads awaited searchParams
- [03-02]: KaTeX CSS must be imported in root layout (src/app/layout.tsx) — pre-rendered math HTML requires stylesheet available on page load
- [03-02]: Preview page uses dangerouslySetInnerHTML for chapter content — content is trusted (pre-rendered by our own ingest pipeline, not user input)
- [03-02]: getPreviewChapter fallback: if no isFreePreview chapter, returns position === 1 chapter — ensures preview always renders
- [03-02]: Schema.org JSON-LD rendered as script tag inside page component return (not in <head>) — Next.js App Router pattern
- [04-01]: TocSidebar is client component to accept onNavigate callback — used in both server layout and mobile Sheet
- [04-01]: MobileTocDrawer uses controlled open state (useState) not SheetTrigger — enables auto-close on chapter navigation
- [04-01]: useSelectedLayoutSegment returns [chapterSlug] segment because TocNavLink renders inside [bookSlug]/layout.tsx
- [04-01]: KaTeX display math overflow applied to [&_.katex-display] container not .katex — prevents double-scrollbar on mobile
- [04-01]: canRead = openAccess OR freePreview OR hasPurchased — access control in page component as defense-in-depth
- [04-01]: React.cache deduplicates getBookChapters called in both layout and chapter page within same request
- [04-02]: ScrollProgressTracker returns null — purely behavioral component with no UI of its own
- [04-02]: key={chapter.id} on ScrollProgressTracker forces fresh remount on chapter navigation, preventing stale initialScrollPercent from restoring wrong scroll position
- [04-02]: initialScrollPercent only set when progress.chapterId === chapter.id — no cross-chapter scroll restoration
- [04-02]: Anonymous users always start at chapter 1 with no progress tracking — per locked decision from research
- [04-02]: 2-second debounce via useDebouncedCallback prevents excessive API calls during active scrolling
- [05-01]: Stripe-hosted checkout (redirect) used — not embedded Elements; no @stripe/stripe-js needed
- [05-01]: Access granted via webhook (checkout.session.completed), never via success page redirect — prevents access without confirmed payment
- [05-01]: request.text() must be used in webhook route (not request.json()) — Stripe signature verification requires raw body
- [05-01]: Purchase confirmation email is fire-and-forget (void) — email failure does not block purchase completion
- [05-01]: Duplicate webhook events handled by Prisma upsert on @@unique([userId, bookId]) — idempotent by design
- [05-02]: MyLibrary renders EmptyLibrary directly (not wrapped) when no purchases — avoids duplicate headings since EmptyLibrary has its own heading
- [05-02]: My Library takes full dashboard width (not half-grid) — responsive book card grid uses its own column breakpoints
- [05-02]: EmptyRecentlyRead moved below MyLibrary with mt-6 — reflects content priority order
- [06-01]: window.location.href (not <a download>) for presigned URL redirect — cross-origin download requires redirect not anchor tag
- [06-01]: Download buttons hidden (not disabled) for unauthenticated/unpurchased users on detail page
- [06-01]: Print link relocated to right-column metadata section (near ISBN/pages/dimensions) — was in left-column pricing area
- [06-01]: Rate limit: 10 requests per user per book per format per 60 seconds — in-memory, resets on deploy
- [06-01]: Presigned URL expiry: 900 seconds (15 minutes); fire-and-forget audit log via void prisma.download.create()
- [Phase 06-02]: Card link isolation: Link wraps only cover+text; DownloadDropdown sits outside Link as sibling — prevents navigation when clicking download
- [Phase 06-02]: Boolean-only prop boundary: raw pdfKey/epubKey strings never passed to client components; only !!pdfKey and !!epubKey booleans cross the server/client boundary
- [Phase 06-02]: Download hidden when no artifacts: conditional render (hasPdf || hasEpub) ensures no empty dropdown appears for books without digital files
- [07-01]: Admin route group (admin) is completely isolated from (main) layout — no Header/Footer, same isolation pattern as (auth)
- [07-01]: requireAdmin() helper centralizes admin role check across all server actions — avoids repetition
- [07-01]: CreateBookDialog extracted as client component so admin/page.tsx stays as a server component calling getAllBooksAdmin() directly
- [07-01]: IngestJob migration created with --create-only (DB offline blocker still active from 01-01)
- [07-02]: z.coerce.number() in Zod v4 has input type unknown — breaks @hookform/resolvers type inference; use z.number() for react-hook-form schemas
- [07-02]: XHR used for image upload (not fetch) — XMLHttpRequest upload.progress event provides real-time progress; fetch has no streaming upload progress API
- [07-02]: Presigned URL upload pattern: /api/admin/upload-url issues admin-only PUT keys; client POSTs for URL then XHRs directly to R2 without proxying through Next.js
- [07-03]: Detached process pattern: spawn + proc.unref() for long-running background jobs from API routes — prevents server request timeout
- [07-03]: updateProgress() in ingest.ts is non-fatal — swallows errors so DB status update failure never kills the ingest pipeline
- [07-03]: Admin preview bypasses isPublished filter — admin queries have no publication check; public reader queries do
- [Phase 08-reader-enhancements]: publishYear Int? added to Book schema — createdAt is ingestion date, not publication year; admin override field needed for accurate academic citations
- [Phase 08-reader-enhancements]: APA author name used as-is (not parsed to Last, First) — free-form names like multi-word surnames break if split on spaces
- [Phase 08-reader-enhancements]: BibTeX citation key sanitized with .replace(/[^a-zA-Z0-9]/g, '') to prevent invalid keys from names like O'Brien or García
- [Phase 09]: [09-01] z.union([z.number(), z.nan().transform(() => null)]) used instead of z.preprocess for NaN-to-null — z.preprocess makes input type unknown, breaking @hookform/resolvers type inference in Zod 4

### Pending Todos

None yet.

### Blockers/Concerns

- [01-01 USER SETUP]: PostgreSQL not running — run `npx prisma migrate dev --name init` and `npx prisma db seed` after starting Docker postgres or setting up Neon (see 01-01-SUMMARY.md)
- [01-01 USER SETUP]: Resend API key placeholder — email verification needs RESEND_API_KEY in .env
- [01-01 USER SETUP]: Google OAuth placeholders — GOOGLE_CLIENT_ID/SECRET needed for Google sign-in
- [Phase 2 readiness]: KaTeX vs MathJax decision must be made before Phase 2 begins — audit manuscripts for \label/\eqref cross-reference usage; if heavy, switch to MathJax v3
- [Phase 2 readiness]: LaTeX package allowlist (amsmath, amsthm, tikz, physics, pgfplots) unknown until first real manuscript is processed; build allowlist during Phase 2
- [02-01 USER SETUP]: Migration 20260218144600_add_book_artifact_keys created with --create-only (DB offline) — run `npx prisma migrate deploy` when PostgreSQL is available

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 09-01-PLAN.md (Audit gap closure: Zod NaN-to-null, sign-in redirect, open access anonymous download)
Resume file: Phase 9 complete (all 1 plans done). All 9 phases complete — all v1 gaps closed, MVP fully delivered.
