# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 8 (Foundation)
Plan: 2 of 4 in current phase
Status: Executing
Last activity: 2026-02-18 — 01-02 complete: Tailwind v4 academic design system, shadcn/ui, Header/Footer/landing page

Progress: [██░░░░░░░░] 6%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 10 min
- Total execution time: 21 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/4 | 21 min | 10 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15 min), 01-02 (6 min)
- Trend: accelerating

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

### Pending Todos

None yet.

### Blockers/Concerns

- [01-01 USER SETUP]: PostgreSQL not running — run `npx prisma migrate dev --name init` and `npx prisma db seed` after starting Docker postgres or setting up Neon (see 01-01-SUMMARY.md)
- [01-01 USER SETUP]: Resend API key placeholder — email verification needs RESEND_API_KEY in .env
- [01-01 USER SETUP]: Google OAuth placeholders — GOOGLE_CLIENT_ID/SECRET needed for Google sign-in
- [Phase 2 readiness]: KaTeX vs MathJax decision must be made before Phase 2 begins — audit manuscripts for \label/\eqref cross-reference usage; if heavy, switch to MathJax v3
- [Phase 2 readiness]: LaTeX package allowlist (amsmath, amsthm, tikz, physics, pgfplots) unknown until first real manuscript is processed; build allowlist during Phase 2

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 01-02-PLAN.md — Tailwind v4 academic design system, shadcn/ui, layout shell, landing page
Resume file: .planning/phases/01-foundation/01-03-PLAN.md
