# Phase 13: Simulations - Research

**Researched:** 2026-02-22
**Domain:** Next.js dynamic imports, HTML Canvas responsive layout, React animation loop lifecycle
**Confidence:** HIGH

## Summary

Phase 13 is a bug-fix and verification phase, not greenfield. All three simulation components (ProjectileMotion, WaveInterference, SpringMass) exist and are functionally complete at the physics and rendering level. The simulation gallery page, detail page, and embed component are all written. The database schema for the `Simulation` model with `componentKey`, `teacherGuide`, and `parameterDocs` is already migrated.

Two concrete bugs must be fixed before the phase succeeds. First, `src/lib/simulation-registry.ts` uses `React.lazy()` which is evaluated when the module is imported. The admin resource edit page imports `SIMULATION_KEYS` from this file at the server level, causing the `React.lazy()` call to execute in a server context — a known SSR error. The fix is to convert the registry to use `next/dynamic` with `ssr: false`, and to change `SimulationEmbed` from using Suspense around a `React.lazy` component to a simple call to the `next/dynamic`-created component (which handles its own loading state). Second, all three canvases have a hardcoded `width={600}` attribute while using CSS `w-full max-w-[600px]`. The canvas HTML attribute controls internal pixel buffer resolution; it does not make the canvas scale — on a 375px screen, the CSS makes it display at 375px wide but the internal coordinate space is still 600 units wide, causing correct visual scaling via browser stretching. However, drawing positions that reference pixel values (e.g., `WIDTH - trail.length + i` in SpringMass) will be off at narrow widths. The straightforward fix for v1 is to use a `useResizeObserver` pattern via native browser `ResizeObserver` (no new package needed) to track the container width and pass it as the canvas `width` attribute.

**Primary recommendation:** Fix simulation-registry.ts by splitting it into two files — a plain-data `SIMULATION_KEYS` array (safe for server import) and a client-only `SIMULATION_REGISTRY` with `next/dynamic` entries. Then audit and fix canvas coordinate logic for responsive sizes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIM-01 | Simulation gallery page with subject filtering | Gallery page exists at `/simulations/page.tsx`; uses `getPublishedResources({ type: "SIMULATION", subject })` — no code changes needed, only data must exist in DB |
| SIM-02 | Simulation detail pages embed interactive canvas simulations | Detail page exists at `/simulations/[slug]/page.tsx`; embeds `SimulationEmbed` — blocked by SIM-03 fix |
| SIM-03 | Simulations load via next/dynamic (SSR-safe, no React.lazy) | `simulation-registry.ts` uses `React.lazy` — must be converted to `next/dynamic({ ssr: false })` in a `"use client"` context only |
| SIM-04 | Simulation canvas is responsive across desktop, tablet, and mobile | All three canvases use hardcoded `width={600}` attribute; CSS `w-full` only affects display size, not internal coordinate space — coordinate math must adapt to container width |
| SIM-05 | Teacher guide and parameter docs display on simulation pages | Detail page already renders `simulation.teacherGuide` and `simulation.parameterDocs` using `sanitizeHtml` — only requires DB records with content |
| SIM-06 | Three simulations work correctly (projectile motion, wave interference, spring-mass) | All three components exist with correct physics; RAF cancellation pattern is correct in all three; verification via Rodney |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/dynamic | 16.1.6 (bundled) | SSR-safe lazy loading of client components | Official Next.js API; `React.lazy` is unsafe in server contexts |
| ResizeObserver | Browser native | Track container width for canvas sizing | No package needed; well-supported in all modern browsers |
| requestAnimationFrame | Browser native | Animation loop | Already used in all three simulations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useRef | 19.2.3 | Store canvas ref, animRef, physics state | Already used; no change needed |
| React useCallback | 19.2.3 | Memoize draw functions | Already used; no change needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native ResizeObserver | `use-resize-observer` npm package | Package adds dependency; native works fine for this use case |
| Responsive canvas coordinates | CSS `transform: scale()` | Transform-based scaling blurs canvas; coordinate scaling is cleaner |

**Installation:**
No new packages needed — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── simulation-registry.ts      # REMOVE React.lazy, use next/dynamic
│   └── simulation-keys.ts          # NEW: plain string array, server-safe
├── components/simulations/
│   ├── SimulationEmbed.tsx         # "use client" — uses dynamic registry
│   └── SimulationCard.tsx          # No changes needed
└── simulations/
    ├── ProjectileMotion.tsx        # Fix canvas responsive coordinates
    ├── WaveInterference.tsx        # Fix canvas responsive coordinates
    └── SpringMass.tsx              # Fix canvas responsive coordinates
```

### Pattern 1: next/dynamic for SSR-unsafe components

**What:** Replace `React.lazy` with `next/dynamic({ ssr: false })` in a file that is only ever imported by client components.

**When to use:** Any component that uses browser APIs (canvas, requestAnimationFrame, window) that cannot run on the server.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading
// src/lib/simulation-registry.ts — must be inside "use client" component tree only
import dynamic from "next/dynamic";

export const SIMULATION_REGISTRY: Record<string, React.ComponentType> = {
  "projectile-motion": dynamic(
    () => import("@/simulations/ProjectileMotion"),
    { ssr: false }
  ),
  "wave-interference": dynamic(
    () => import("@/simulations/WaveInterference"),
    { ssr: false }
  ),
  "spring-mass": dynamic(
    () => import("@/simulations/SpringMass"),
    { ssr: false }
  ),
};
```

**Critical constraint from Next.js docs:** `ssr: false` option will only work for Client Components, and the `dynamic()` import path must be a literal string — it cannot be a template string or variable. Each simulation must have its own explicit `dynamic()` call.

**Critical constraint on server import:** The admin resource edit page (`/admin/resources/[resourceId]/page.tsx`) is a Server Component that imports `SIMULATION_KEYS` from `simulation-registry.ts`. This import chain causes the problem. The fix has two parts:
1. Create a separate server-safe file for keys: `src/lib/simulation-keys.ts` — a plain `const SIMULATION_KEYS = [...]` array with no dynamic imports.
2. Keep `SIMULATION_REGISTRY` in `simulation-registry.ts` but only import it from `SimulationEmbed` (which is `"use client"`).

### Pattern 2: Responsive Canvas via ResizeObserver

**What:** Track the container element width, set canvas `width` and `height` attributes dynamically, and scale all coordinate math proportionally.

**When to use:** Any HTML canvas that must render at variable widths (responsive layout).

**Example:**
```typescript
// Source: MDN ResizeObserver + canvas internal sizing
const containerRef = useRef<HTMLDivElement>(null);
const [canvasWidth, setCanvasWidth] = useState(600);
const canvasHeight = Math.round(canvasWidth * (400 / 600)); // maintain aspect ratio

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const ro = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    setCanvasWidth(Math.round(width));
  });
  ro.observe(container);
  return () => ro.disconnect();
}, []);

// In JSX:
<div ref={containerRef} className="w-full">
  <canvas
    ref={canvasRef}
    width={canvasWidth}
    height={canvasHeight}
    className="w-full border rounded-lg"
  />
</div>
```

Then pass `canvasWidth` and `canvasHeight` to draw functions as parameters instead of using module-level constants.

### Pattern 3: Suspense is unnecessary with next/dynamic

**What:** `next/dynamic` components handle their own loading state via the `loading` option. You do not wrap them in `<Suspense>`.

**When to use:** Always with `next/dynamic` + `ssr: false`.

**Example:**
```typescript
// SimulationEmbed.tsx — simplified without Suspense wrapper
const SimComponent = SIMULATION_REGISTRY[componentKey];
if (!SimComponent) return <div>Not found</div>;
return <SimComponent />;  // next/dynamic handles loading state internally
```

If a custom loading skeleton is desired, pass `loading: () => <Skeleton />` to the `dynamic()` call in the registry.

### Anti-Patterns to Avoid

- **Importing simulation-registry.ts from a Server Component:** The file uses `next/dynamic` which must live in the client component boundary. Admin pages that need the key list must import from `simulation-keys.ts` instead.
- **Using `React.lazy` in files that can be imported server-side:** The entire file is evaluated at import time; `React.lazy()` calls execute at module evaluation, not at render time.
- **Hardcoded pixel coordinates in draw functions:** Using `WIDTH = 600` as a module constant and then using `WIDTH - x` in coordinate math means the canvas will have wrong positions when rendered at non-600px internal widths. All `WIDTH`/`HEIGHT` references inside draw callbacks must use the reactive state values.
- **Not removing the Suspense wrapper:** If SimulationEmbed keeps `<Suspense>` around a `next/dynamic` component, the combination of `ssr: false` and `Suspense` can cause "server could not finish this Suspense boundary" errors (confirmed Next.js issue #36636).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas container width tracking | Custom event listeners on window resize | ResizeObserver | Window resize doesn't fire for element-level layout changes; ResizeObserver is correct |
| SSR-safe lazy loading | Custom dynamic import with useEffect | next/dynamic | Edge cases around hydration, streaming, and bundle splitting |

**Key insight:** `next/dynamic` is the only correct solution for canvas-based React components in Next.js App Router — browser APIs like `requestAnimationFrame`, `canvas.getContext`, and `performance.now()` are unavailable on the server, and the components must never be pre-rendered.

## Common Pitfalls

### Pitfall 1: React.lazy in server-imported modules
**What goes wrong:** A file that uses `React.lazy()` is imported from a Server Component. The `lazy()` call executes during module evaluation and throws or produces undefined behavior in the Node.js SSR context.
**Why it happens:** `simulation-registry.ts` exports both `SIMULATION_REGISTRY` (using `React.lazy`) and `SIMULATION_KEYS`. The admin resource edit page is a Server Component that imports `SIMULATION_KEYS`. Even though it only uses the keys, the entire module executes, including the `lazy()` calls.
**How to avoid:** Split into two files: server-safe `simulation-keys.ts` (plain array) and client-only `simulation-registry.ts` (uses `next/dynamic`). The registry file should only be imported by client components.
**Warning signs:** Server-side errors like "This module cannot be imported from a Server Component module" or hydration boundary errors on the simulations pages.

### Pitfall 2: Canvas width attribute vs CSS display width confusion
**What goes wrong:** `className="w-full max-w-[600px]"` makes the canvas display at container width in CSS, but the internal coordinate space is still 600 units wide (the `width={600}` attribute). On a 375px container, the canvas displays at 375px via CSS stretching, which actually works visually for the pattern-based simulations (WaveInterference) but coordinate math like `WIDTH - trail.length + i` in SpringMass uses `600` directly and will place the trail incorrectly.
**Why it happens:** The HTML `width` and `height` attributes set the canvas bitmap resolution. CSS controls display dimensions only. They are independent.
**How to avoid:** Use ResizeObserver to track container width, store it in state, pass it as the canvas `width` attribute, and use the state variable in all draw coordinate math.
**Warning signs:** Trail or trajectory appears at wrong horizontal position on narrow screens; canvas content appears cut off or stretched non-uniformly.

### Pitfall 3: RAF not cancelled on parameter change
**What goes wrong:** A slider changes (e.g., gravity), which triggers the `useEffect` with a new closure, starting a new RAF loop — but the old loop was not cancelled. Two loops run simultaneously.
**Why it happens:** The `draw` callback is memoized with `useCallback` and listed as a dependency of the animation `useEffect`. When slider values change, `draw` is recreated, the effect re-runs, and the cleanup from the previous effect run must cancel the previous RAF.
**How to avoid:** The current code already returns `() => cancelAnimationFrame(animRef.current)` from the animation `useEffect` — this is correct. Verify this cleanup is in place after any refactor.
**Warning signs:** Canvas appears to speed up or duplicate trails when sliders are moved during animation.

### Pitfall 4: SimulationEmbed on server with React.lazy (current state)
**What goes wrong:** `SimulationEmbed` is a `"use client"` component but it imports from `simulation-registry.ts` which uses `React.lazy`. Because `SimulationEmbed` is a client component, this should work in isolation — but the admin page also imports the same registry file server-side for `SIMULATION_KEYS`, causing the server-side evaluation problem.
**How to avoid:** The split-file approach resolves this entirely.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Fixed simulation-registry.ts (client-only)
```typescript
// src/lib/simulation-registry.ts
// Only import this from "use client" components
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const SIMULATION_REGISTRY: Record<string, ComponentType> = {
  "projectile-motion": dynamic(
    () => import("@/simulations/ProjectileMotion"),
    { ssr: false }
  ),
  "wave-interference": dynamic(
    () => import("@/simulations/WaveInterference"),
    { ssr: false }
  ),
  "spring-mass": dynamic(
    () => import("@/simulations/SpringMass"),
    { ssr: false }
  ),
};
```

### New server-safe simulation-keys.ts
```typescript
// src/lib/simulation-keys.ts
// Safe to import from Server Components — no dynamic imports
export const SIMULATION_KEYS = [
  "projectile-motion",
  "wave-interference",
  "spring-mass",
] as const;
```

### Fixed SimulationEmbed.tsx (remove Suspense wrapper)
```typescript
"use client";
import { SIMULATION_REGISTRY } from "@/lib/simulation-registry";

interface SimulationEmbedProps {
  componentKey: string;
}

export default function SimulationEmbed({ componentKey }: SimulationEmbedProps) {
  const SimComponent = SIMULATION_REGISTRY[componentKey];
  if (!SimComponent) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>Simulation &quot;{componentKey}&quot; not found.</p>
      </div>
    );
  }
  // next/dynamic handles its own loading state — no Suspense needed
  return <SimComponent />;
}
```

### Responsive canvas pattern (for each simulation)
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [dims, setDims] = useState({ width: 600, height: 400 });

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const ro = new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    setDims({ width: w, height: Math.round(w * (400 / 600)) });
  });
  ro.observe(container);
  return () => ro.disconnect();
}, []);

// Pass dims.width and dims.height to all draw functions as parameters
// Replace module-level WIDTH/HEIGHT constants with dims.width/dims.height in callbacks
```

### Admin page fix: import from simulation-keys
```typescript
// src/app/(admin)/admin/resources/[resourceId]/page.tsx
// Change this import:
import { SIMULATION_KEYS } from "@/lib/simulation-registry";  // BROKEN
// To this:
import { SIMULATION_KEYS } from "@/lib/simulation-keys";  // FIXED
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `React.lazy()` + `<Suspense>` | `next/dynamic({ ssr: false })` in Client Component | Next.js App Router (v13+) | `React.lazy` in server-evaluated modules causes SSR errors |
| Fixed canvas `width`/`height` attributes | ResizeObserver + dynamic canvas attributes | Always correct; explicit CSS pattern widespread post-2020 | Correct rendering at all viewport sizes |

**Deprecated/outdated:**
- `React.lazy` in files that may be imported server-side: unsafe in App Router; use `next/dynamic` in client component trees only.

## Open Questions

1. **Do simulation DB records exist yet?**
   - What we know: The schema is migrated (`simulations` table exists). The admin UI for managing resources/simulations exists.
   - What's unclear: Whether any simulation records with `componentKey`, `teacherGuide`, and `parameterDocs` have been seeded or created via admin.
   - Recommendation: Plan 13-01 should include a seed step or manual admin creation for at least the three simulations to test end-to-end.

2. **Does WaveInterference require coordinate scaling?**
   - What we know: WaveInterference iterates `for px = 0 to WIDTH, for py = 0 to HEIGHT` to fill `createImageData(WIDTH, HEIGHT)`. If WIDTH changes, the loop naturally uses the new value — it's relative, not absolute-pixel-positioned.
   - What's unclear: Whether source marker positions (`s1x = cx - separation/2, s2x = cx + separation/2`) are safe at narrow widths (they are relative to `WIDTH/2` so they scale correctly).
   - Recommendation: WaveInterference may need less fix than ProjectileMotion/SpringMass; verify with Rodney at 375px.

3. **Should loading skeleton be added to dynamic() calls?**
   - What we know: Current SimulationEmbed has an elaborate `<Suspense>` fallback skeleton. With `next/dynamic`, this moves to a `loading:` option on each `dynamic()` call.
   - What's unclear: Whether the skeleton is a requirement or a nice-to-have.
   - Recommendation: Pass a minimal loading skeleton via `loading: () => <div className="aspect-[3/2] bg-muted animate-pulse rounded-lg" />` on each `dynamic()` call. This matches the existing pattern.

## Sources

### Primary (HIGH confidence)
- Next.js official docs (https://nextjs.org/docs/app/guides/lazy-loading) — `next/dynamic` API, `ssr: false` behavior, Suspense interaction, import path must be literal string
- Codebase reading — all three simulation files, registry, embed component, gallery page, detail page, admin page
- MDN ResizeObserver — responsive canvas pattern, cleanup via `ro.disconnect()`

### Secondary (MEDIUM confidence)
- Next.js GitHub issue #36636 — `suspense: true` + `ssr: false` causes "server could not finish Suspense boundary" error; verified as known issue
- Next.js docs constraint: "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component" — direct quote from official docs

### Tertiary (LOW confidence)
- WebSearch results on canvas responsive scaling — consistent with MDN behavior but not cross-referenced from Next.js sources directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from official Next.js docs (fetched live at doc-version 16.1.6)
- Architecture: HIGH — based on direct codebase reading; bugs are evident from code inspection
- Pitfalls: HIGH — pitfall 1 is confirmed by official docs quote; pitfall 2 is confirmed by HTML canvas spec; pitfalls 3/4 are confirmed from code reading

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable APIs)
