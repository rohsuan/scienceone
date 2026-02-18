# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser
**Current focus:** Phase 2 - Ingest Pipeline

## Current Position

Phase: 2 of 8 (Ingest Pipeline)
Plan: 1 of ? in current phase
Status: In Progress
Last activity: 2026-02-19 — 02-01 complete: Pandoc wrapper, KaTeX server-side math renderer, chapter splitter, health reporter, Book pdfKey/epubKey migration

Progress: [█████░░░░░] 16%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 9 min
- Total execution time: 48 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4/4 | 43 min | 11 min |
| 02-ingest | 1/? | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15 min), 01-02 (6 min), 01-03 (7 min), 01-04 (15 min), 02-01 (5 min)
- Trend: fast

*Updated after each plan completion*

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

Last session: 2026-02-19
Stopped at: Completed 02-01-PLAN.md — Four tsx-importable pipeline modules (pandoc wrapper, KaTeX renderer, chapter splitter, health reporter) and Book pdfKey/epubKey migration
Resume file: .planning/phases/02-ingest/02-02-PLAN.md
