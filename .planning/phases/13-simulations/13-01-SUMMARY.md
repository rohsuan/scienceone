---
phase: 13-simulations
plan: 01
subsystem: ui
tags: [react, next-dynamic, canvas, resizeobserver, prisma, simulation]

requires:
  - phase: 12-resource-public-purchase
    provides: Resource model with Simulation relation, resource-queries.ts with getPublishedResources

provides:
  - simulation-keys.ts — server-safe array of simulation component key strings
  - simulation-registry.tsx — client-only next/dynamic registry with ssr: false
  - SimulationEmbed.tsx — client component rendering simulation by key (no Suspense wrapper)
  - Responsive simulation canvases for ProjectileMotion, WaveInterference, SpringMass via ResizeObserver
  - Three simulation Resource+Simulation DB records seeded in Neon

affects:
  - 13-02-simulations (simulation admin integration, SimulationCard component)
  - future phases using simulation embed

tech-stack:
  added: []
  patterns:
    - "Server/client split: simulation-keys.ts (server-safe) + simulation-registry.tsx (client-only with next/dynamic)"
    - "ResizeObserver pattern for responsive canvas: containerRef + canvasWidth state + computed canvasHeight"
    - "Neon-specific seed script (seed-neon.ts) when .env points to local, .env.local points to Neon"

key-files:
  created:
    - src/lib/simulation-keys.ts
    - src/lib/simulation-registry.tsx
    - prisma/seed-neon.ts
  modified:
    - src/components/simulations/SimulationEmbed.tsx
    - src/app/(admin)/admin/resources/[resourceId]/page.tsx
    - src/simulations/ProjectileMotion.tsx
    - src/simulations/WaveInterference.tsx
    - src/simulations/SpringMass.tsx
    - prisma/seed.ts

key-decisions:
  - "simulation-keys.ts uses string[] (not readonly) to match ResourceEditForm's simulationKeys?: string[] prop type"
  - "simulation-registry.tsx extension required for JSX in dynamic loading option — .ts does not parse JSX"
  - "Neon DB seeding requires a separate seed-neon.ts script — Next.js reads .env.local (Neon) while prisma.config.ts reads .env (local)"

patterns-established:
  - "ResizeObserver pattern: containerRef wraps canvas, setCanvasWidth on contentRect.width > 0, canvasHeight derived proportionally"
  - "Coordinate scaling in canvas draw: SCALE = canvasWidth / reference_width for proportional math"

requirements-completed:
  - SIM-01
  - SIM-02
  - SIM-03
  - SIM-04
  - SIM-05
  - SIM-06

duration: 9min
completed: 2026-02-22
---

# Phase 13 Plan 01: Simulations SSR Fix and Responsive Canvas Summary

**React.lazy SSR bug fixed via server/client registry split, three simulation canvases made responsive via ResizeObserver, and three simulation records seeded in Neon for end-to-end testing**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-22T03:04:57Z
- **Completed:** 2026-02-22T03:14:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Split simulation registry into `simulation-keys.ts` (server-safe) and `simulation-registry.tsx` (client-only with next/dynamic), eliminating the React.lazy SSR error
- Made all three simulation canvases responsive using ResizeObserver — canvas width tracks container, height maintains aspect ratio
- Seeded three simulation Resource+Simulation records (Projectile Motion, Wave Interference, Spring-Mass) in Neon; all appear on /simulations gallery and detail pages with teacher guide and parameter docs

## Task Commits

Each task was committed atomically:

1. **Task 1: Split simulation registry into server-safe keys and client-only dynamic registry** - `d4161f1` (feat)
2. **Task 2: Make all three simulation canvases responsive via ResizeObserver** - `44c2051` (feat)
3. **Task 3: Seed simulation database records for end-to-end testing** - `1af0f24` (feat)

## Files Created/Modified
- `src/lib/simulation-keys.ts` - Plain `string[]` of simulation keys, safe to import from Server Components
- `src/lib/simulation-registry.tsx` - Client-only registry using next/dynamic with ssr: false and skeleton loading states
- `src/components/simulations/SimulationEmbed.tsx` - Removed Suspense wrapper; next/dynamic handles loading state
- `src/app/(admin)/admin/resources/[resourceId]/page.tsx` - Updated import to use simulation-keys.ts
- `src/simulations/ProjectileMotion.tsx` - Added ResizeObserver, containerRef, canvasWidth/canvasHeight state; removed hardcoded WIDTH/HEIGHT
- `src/simulations/WaveInterference.tsx` - Added ResizeObserver, containerRef, canvasWidth/canvasHeight state; removed hardcoded WIDTH/HEIGHT
- `src/simulations/SpringMass.tsx` - Added ResizeObserver, containerRef, canvasWidth/canvasHeight state; ANCHOR_X, MAX_TRAIL scale proportionally
- `prisma/seed.ts` - Added three simulation upserts with teacherGuide and parameterDocs
- `prisma/seed-neon.ts` - Neon-specific seed script reading DATABASE_URL from .env.local

## Decisions Made
- `simulation-keys.ts` uses `string[]` not `as const` — the `ResourceEditForm` prop expects `string[]`, and `as const` produces `readonly string[]` causing a type error
- `simulation-registry.tsx` extension required — the `.ts` extension does not parse JSX syntax needed for the dynamic `loading:` option
- Created separate `seed-neon.ts` script to seed Neon — `prisma.config.ts` reads `.env` (local Postgres), but Next.js reads `.env.local` (Neon), so running the standard seed would populate the wrong database

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] simulation-registry.ts renamed to .tsx for JSX parsing**
- **Found during:** Task 1 (registry rewrite)
- **Issue:** Plan specified rewriting `simulation-registry.ts` to use JSX in the loading option, but `.ts` files do not parse JSX. Build failed with "Expected '>', got 'ident'" parsing error.
- **Fix:** Created `simulation-registry.tsx`, deleted the `.ts` file.
- **Files modified:** src/lib/simulation-registry.tsx (created), src/lib/simulation-registry.ts (deleted)
- **Verification:** Build passed cleanly after rename
- **Committed in:** d4161f1 (Task 1 commit)

**2. [Rule 1 - Bug] simulation-keys.ts type changed from `as const` to `string[]`**
- **Found during:** Task 1 (TypeScript type check)
- **Issue:** Plan used `as const` making the array `readonly ["projectile-motion", ...]` which is not assignable to `string[]` expected by `ResourceEditForm`.
- **Fix:** Changed export to `export const SIMULATION_KEYS: string[] = [...]`
- **Files modified:** src/lib/simulation-keys.ts
- **Verification:** Build TypeScript check passed
- **Committed in:** d4161f1 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for the build to succeed. No scope creep.

## Issues Encountered
- Neon database did not have subjects seeded — created `seed-neon.ts` to handle the two-database environment (local vs Neon) where the standard seed targets local Postgres but Next.js uses Neon. The seed-neon.ts script seeds both subjects and simulations idempotently.

## User Setup Required
None - simulation data is seeded. No external service configuration required.

## Next Phase Readiness
- All three simulations load, render interactively, and display teacher guides and parameter docs
- Gallery page at /simulations shows all three simulation cards with Physics subject filtering
- Admin resource edit page at /admin/resources/[id] still loads correctly (SIMULATION_KEYS import fixed)
- Ready for Phase 13 Plan 02 (simulation admin integration, SimulationCard improvements)

## Self-Check: PASSED

All files verified:
- src/lib/simulation-keys.ts — FOUND
- src/lib/simulation-registry.tsx — FOUND
- src/components/simulations/SimulationEmbed.tsx — FOUND
- src/simulations/ProjectileMotion.tsx — FOUND
- src/simulations/WaveInterference.tsx — FOUND
- src/simulations/SpringMass.tsx — FOUND
- prisma/seed-neon.ts — FOUND

All commits verified:
- d4161f1 (Task 1) — FOUND
- 44c2051 (Task 2) — FOUND
- 1af0f24 (Task 3) — FOUND

---
*Phase: 13-simulations*
*Completed: 2026-02-22*
