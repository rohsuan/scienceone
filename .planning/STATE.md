# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Educators and students can discover STEM content — books, resources, simulations, and articles — with properly rendered math, directly in their browser
**Current focus:** v1.1 Content Hub — Phase 13: Simulations

## Current Position

Phase: 13 of 15 (Simulations)
Plan: 1 of 2 in current phase — Phase 13 Plan 01 complete
Status: In progress
Last activity: 2026-02-22 — Phase 13 Plan 01 complete

Progress: [█████░░░░░] 50% (v1.1) — Phase 13 Plan 01 complete (1/2 plans done)

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 19
- Total phases: 9
- Timeline: 3 days

**v1.1 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 10: Infrastructure | 1 | 3 min | 3 min |
| Phase 11: Resource Admin | 2 | 3 min | 1.5 min |
| Phase 12: Resource Public/Purchase | 2 | 4 min | 2 min |
| Phase 13: Simulations | 1 (of 2) | 9 min | 9 min |

*Updated after each plan completion*
| Phase 12-resource-public-purchase P01 | 6 | 2 tasks | 3 files |
| Phase 13-simulations P01 | 9 | 3 tasks | 9 files |

## Accumulated Context

### Decisions

All v1.0 decisions logged in PROJECT.md Key Decisions table.

**v1.1 decisions:**
- [Research]: No new npm packages needed for v1.1 — all dependencies already installed
- [Research]: Work is verification and bug-fix, not greenfield — first-pass code exists for all features
- [Research]: Build order: Infrastructure → Resource Admin → Resource Public/Purchase → Simulations → Blog → Polish
- [Phase 10-01]: Four subjects: Physics, Mathematics, Chemistry, Computer Science (replaces six granular subjects)
- [Phase 10-01]: Single shared sanitizeHtml utility in src/lib/sanitize-html.ts — no inline sanitize-html config anywhere else
- [Phase 11-01]: ImageUploadField uses entityId+uploadType generic interface — supports books, resources, blog in one component
- [Phase 11-01]: Full public URL stored on upload via NEXT_PUBLIC_R2_PUBLIC_URL prefix; bare R2 key as fallback
- [Phase 11-01]: SubjectSelect is read-only — createSubject server action removed, subjects are seeded only
- [Phase 11]: ResourceRowActions extracted as named component to enable useTransition hook usage inside ColumnDef cell
- [Phase 11]: Single isPending from one useTransition covers both toggle and delete actions — sequential operations, no parallelism needed
- [Phase 12-01]: Prisma where filter in include is invalid for one-to-one optional relations (ResourcePrice?) — filter isActive at application level using activePricing computed variable
- [Phase 12-01]: Neon production DB migration must be deployed separately from local — prisma.config.ts reads .env (local), Next.js reads .env.local (Neon)
- [Phase 12-02]: Stripe webhook routes by productType first (explicit intent), then validates IDs exist (defensive)
- [Phase 12-02]: Unknown/legacy productType logs warning but returns 200 per Stripe best practice
- [Phase 12-02]: No backward compatibility needed for productType — clean cutover, no real users yet
- [Phase 13-01]: simulation-keys.ts uses string[] (not readonly) to match ResourceEditForm prop type
- [Phase 13-01]: simulation-registry.tsx extension required for JSX in dynamic loading option
- [Phase 13-01]: Neon DB seeding requires a separate seed-neon.ts — Next.js reads .env.local (Neon), prisma.config.ts reads .env (local)

### Pending Todos

None.

### Blockers/Concerns

- [RESOLVED Phase 13-01]: React.lazy in simulation registry causes server-side errors — FIXED by splitting into simulation-keys.ts + simulation-registry.tsx with next/dynamic
- [RESOLVED Phase 10-01]: dangerouslySetInnerHTML called without sanitize-html in 4 locations — XSS vector fixed
- [RESOLVED Phase 12-02]: Stripe webhook routes by ID presence (dead code), not explicit productType — FIXED with productType metadata routing
- [CRITICAL]: togglePublishBlogPost does not revalidate /blog/{slug} — fix in Phase 14
- [USER SETUP]: PostgreSQL must be running and migrations applied before Phase 10 work begins

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 13-01-PLAN.md — Phase 13 Plan 01 complete
Resume file: None — continue with Phase 13 Plan 02 (Simulations admin/detail)
