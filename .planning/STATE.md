# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Educators and students can discover STEM content — books, resources, simulations, and articles — with properly rendered math, directly in their browser
**Current focus:** v1.1 Content Hub — Phase 11: Resource Admin

## Current Position

Phase: 11 of 15 (Resource Admin)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-22 — Phase 11 Plan 01 complete

Progress: [██░░░░░░░░] 25% (v1.1) — Phase 11 Plan 1 complete (1/2 in phase)

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 19
- Total phases: 9
- Timeline: 3 days

**v1.1 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 10: Infrastructure | 1 | 3 min | 3 min |
| Phase 11: Resource Admin | 1 | 2 min | 2 min |

*Updated after each plan completion*

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

### Pending Todos

None.

### Blockers/Concerns

- [CRITICAL]: React.lazy in simulation registry causes server-side errors — must fix before any simulation page loads
- [RESOLVED Phase 10-01]: dangerouslySetInnerHTML called without sanitize-html in 4 locations — XSS vector fixed
- [CRITICAL]: Stripe webhook routes by ID presence (dead code), not explicit productType — fix in Phase 12
- [CRITICAL]: togglePublishBlogPost does not revalidate /blog/{slug} — fix in Phase 14
- [USER SETUP]: PostgreSQL must be running and migrations applied before Phase 10 work begins

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 11-01-PLAN.md — Phase 11 Plan 01 complete
Resume file: None — continue with 11-02-PLAN.md
