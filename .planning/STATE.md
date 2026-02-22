# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Educators and students can discover STEM content — books, resources, simulations, and articles — with properly rendered math, directly in their browser
**Current focus:** v1.1 Content Hub — Phase 15: Polish and Cross-Linking

## Current Position

Phase: 15 of 15 (Polish and Cross-Linking) — Complete
Plan: 2 of 2 in current phase — Phase 15 Plan 02 complete
Status: Complete
Last activity: 2026-02-22 — Phase 15 Plan 02 complete (cross-link sections on detail pages)

Progress: [██████████] 100% (v1.1) — All phases complete (2/2 plans done in Phase 15)

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
| Phase 13: Simulations | 2 | 15 min | 7.5 min |
| Phase 14: Blog | 2 | 4 min | 2 min |
| Phase 15: Polish | 2 | 4 min | 2 min |

*Updated after each plan completion*
| Phase 12-resource-public-purchase P01 | 6 | 2 tasks | 3 files |
| Phase 13-simulations P01 | 9 | 3 tasks | 9 files |
| Phase 13-simulations P02 | 6 | 1 tasks | 0 files |
| Phase 14-blog P01 | 3 | 2 tasks | 2 files |
| Phase 14-blog P02 | 1 | 2 tasks | 2 files |
| Phase 15-polish P01 | 2 | 2 tasks | 8 files |
| Phase 15-polish P02 | 2 | 2 tasks | 5 files |

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
- [Phase 13-simulations]: Rodney CLI unavailable — simulation verification performed via curl HTTP checks and source code analysis, all 5 criteria confirmed
- [Phase 14-01]: BlogRowActions follows ResourceRowActions verbatim — same useTransition/startTransition/try-catch pattern
- [Phase 14-01]: publishedAt clobber guard: `publish && !existing?.publishedAt` — only sets date on first publish, preserves original on re-publish
- [Phase 14-01]: revalidatePath(/blog/{slug}) called after toggle — blog detail page immediately accessible after publish
- [Phase 14-02]: JSON-LD datePublished falls back to createdAt — ensures field is never undefined/dropped by JSON.stringify
- [Phase 14-02]: highlightCodeBlocks runs before sanitizeHtml — Shiki transforms pre/code HTML, then sanitize allows class/style attributes through
- [Phase 14-02]: Simulations use /simulations/{slug} path in sitemap; non-simulation resources use /resources/{slug}
- [Phase 15-01]: Pagination component uses conditional rendering (not disabled) to avoid asChild + disabled anchor pitfall
- [Phase 15-01]: PAGE_SIZE = 12 exported from each query module so listing pages can compute totalPages without separate constant import
- [Phase 15-01]: simulations/page.tsx destructures { items } from updated getPublishedResources — no pagination added (simulations are few)
- [Phase 15-02]: getRelatedResources excludes SIMULATION type — simulations have dedicated /simulations/{slug} pages, blog cross-links always route to /resources/{slug}
- [Phase 15-02]: getRelatedLabGuides passes resource.id as excludeResourceId — simulations and lab guides share the Resource table, self-exclusion required
- [Phase 15-02]: Related Articles placed full-width below the two-column grid on resource detail page for readability

### Pending Todos

None.

### Blockers/Concerns

- [RESOLVED Phase 13-01]: React.lazy in simulation registry causes server-side errors — FIXED by splitting into simulation-keys.ts + simulation-registry.tsx with next/dynamic
- [RESOLVED Phase 10-01]: dangerouslySetInnerHTML called without sanitize-html in 4 locations — XSS vector fixed
- [RESOLVED Phase 12-02]: Stripe webhook routes by ID presence (dead code), not explicit productType — FIXED with productType metadata routing
- [RESOLVED Phase 14-01]: togglePublishBlogPost did not revalidate /blog/{slug} — FIXED with slug prefetch and revalidatePath
- [USER SETUP]: PostgreSQL must be running and migrations applied before Phase 10 work begins

## Session Continuity

Last session: 2026-02-22T05:26:00Z
Stopped at: Completed 15-02-PLAN.md — Phase 15 Plan 02 complete (cross-link sections on detail pages)
Resume file: None — v1.1 Content Hub milestone complete
