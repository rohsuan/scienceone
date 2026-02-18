---
phase: 01-foundation
plan: "02"
subsystem: ui
tags: [nextjs, tailwind, shadcn, lora, inter, next-font, typescript, header, footer, landing-page]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Next.js 16 scaffold, Better Auth client (useSession), Tailwind v4 base"
provides:
  - "Tailwind v4 academic design system with navy/indigo oklch palette and CSS variables"
  - "Lora (serif) + Inter (sans) fonts loaded via next/font/google with CSS variable injection"
  - "shadcn/ui initialized (New York style, Tailwind v4 canary) with 10 components"
  - "Header component: sticky, ScienceOne logo, Catalog nav placeholder, auth controls (login/avatar)"
  - "Footer component: brand, tagline, Company links, copyright"
  - "Main layout shell (main)/layout.tsx wrapping all (main) pages with Header + Footer"
  - "Landing page at / with hero, 3-column feature cards, CTA section — redirect to /dashboard if logged in"
affects:
  - 01-03
  - 01-04
  - all-subsequent-phases

# Tech tracking
tech-stack:
  added:
    - "shadcn/ui@canary (via npx shadcn@canary)"
    - "tw-animate-css (shadcn dependency)"
    - "class-variance-authority (shadcn dependency)"
    - "clsx (shadcn dependency)"
    - "tailwind-merge (shadcn dependency)"
    - "sonner (shadcn toast replacement)"
    - "@radix-ui/react-avatar"
    - "@radix-ui/react-dropdown-menu"
    - "@radix-ui/react-label"
    - "@radix-ui/react-separator"
    - "lucide-react"
  patterns:
    - "Tailwind v4 CSS variables via @theme inline block with oklch colors"
    - "next/font/google: Lora + Inter with --font-serif / --font-sans CSS variable injection"
    - "heading-serif utility class for applying Lora font to headings"
    - "Route group (main) for shared Header+Footer layout across public pages"
    - "Server-side auth.api.getSession() with await headers() for logged-in redirect"

key-files:
  created:
    - "src/components/layout/Header.tsx"
    - "src/components/layout/Footer.tsx"
    - "src/app/(main)/layout.tsx"
    - "src/app/(main)/page.tsx"
    - "src/components/ui/button.tsx"
    - "src/components/ui/input.tsx"
    - "src/components/ui/label.tsx"
    - "src/components/ui/card.tsx"
    - "src/components/ui/form.tsx"
    - "src/components/ui/sonner.tsx"
    - "src/components/ui/badge.tsx"
    - "src/components/ui/avatar.tsx"
    - "src/components/ui/separator.tsx"
    - "src/components/ui/dropdown-menu.tsx"
    - "src/lib/utils.ts"
    - "components.json"
  modified:
    - "src/app/globals.css"
    - "src/app/layout.tsx"
    - "package.json"

key-decisions:
  - "shadcn canary CLI required for Tailwind v4 compatibility — stable CLI does not support v4 @theme inline"
  - "sonner used instead of deprecated toast component — shadcn canary deprecates toast in favor of sonner"
  - "Removed boilerplate src/app/page.tsx — replaced by (main)/page.tsx route group; both cannot coexist in Next.js"
  - "oklch color space used for academic navy palette — perceptually uniform, excellent browser support"
  - "Landing page uses server-side auth.api.getSession() for redirect — avoids client flash of landing for logged-in users"

patterns-established:
  - "Pattern: heading-serif utility class on all headings for consistent Lora typography"
  - "Pattern: (main) route group for pages that share Header+Footer; (auth) route group for auth-only layout"
  - "Pattern: auth.api.getSession({ headers: await headers() }) for server component session checks"

requirements-completed: [AUTH-02]

# Metrics
duration: 6min
completed: 2026-02-18
---

# Phase 1 Plan 02: Design System & Layout Summary

**Tailwind v4 academic design system (navy/indigo oklch palette), Lora+Inter fonts via next/font, shadcn/ui with 10 components, and full site layout shell (Header, Footer, landing page) with academic aesthetic**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-18T12:15:45Z
- **Completed:** 2026-02-18T12:21:51Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- shadcn/ui initialized with Tailwind v4 canary CLI, New York style, 10 components available for auth forms and beyond
- Academic color palette applied: deep navy primary `oklch(0.30 0.12 260)`, indigo accent `oklch(0.45 0.15 270)`, with muted grays — overrides shadcn defaults
- Lora (serif) + Inter (sans) loaded via `next/font/google` as `--font-serif` / `--font-sans` CSS variables; `heading-serif` utility class established
- Full layout shell: sticky Header with logo/nav/auth controls, Footer with branding/links/copyright, (main) route group wrapping all public pages
- Landing page: hero with serif headline, 3-column feature cards (Beautiful Math, Read Anywhere, Academic Quality), navy CTA section; server-side redirect for logged-in users

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure design system — Tailwind v4 theme, shadcn/ui, fonts** - `77b53d7` (feat)
2. **Task 2: Build Header, Footer, main layout, and landing page** - `52212f2` (feat)

**Plan metadata:** (pending — created after summary)

## Files Created/Modified

- `src/app/globals.css` - Academic navy/indigo palette, font CSS variables, heading-serif utility, overrides shadcn defaults
- `src/app/layout.tsx` - Lora + Inter via next/font, ScienceOne metadata, font CSS variable injection on html element
- `components.json` - shadcn config: New York style, Tailwind v4, CSS variables, lucide icons
- `src/lib/utils.ts` - shadcn cn() utility (clsx + tailwind-merge)
- `src/components/ui/` - 10 components: button, input, label, card, form, sonner, badge, avatar, separator, dropdown-menu
- `src/components/layout/Header.tsx` - Sticky header, serif logo, Catalog nav, login/signup or avatar dropdown
- `src/components/layout/Footer.tsx` - Brand, tagline, Company links (About/Contact/Terms/Privacy), copyright
- `src/app/(main)/layout.tsx` - Main layout: min-h-screen flex-col, Header + main + Footer
- `src/app/(main)/page.tsx` - Landing page: hero, feature cards, CTA; server-side redirect for logged-in users
- `package.json` - shadcn dependencies added (radix-ui components, clsx, tailwind-merge, lucide-react, sonner)

## Decisions Made

- **shadcn canary CLI:** Used `npx shadcn@canary` for Tailwind v4 compatibility — stable CLI throws errors with v4 `@theme inline` syntax
- **sonner over toast:** shadcn@canary deprecates the `toast` component; used `sonner` as the replacement
- **Route conflict resolved:** Removed `src/app/page.tsx` (Next.js boilerplate) since `src/app/(main)/page.tsx` serves the same `/` route — cannot have both
- **oklch palette:** Used oklch color space for all custom colors — perceptually uniform, supports P3 gamut, recommended for Tailwind v4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used sonner instead of deprecated toast component**
- **Found during:** Task 1 (shadcn component installation)
- **Issue:** `npx shadcn@canary add toast` exits with error: "The toast component is deprecated. Use the sonner component instead."
- **Fix:** Replaced `toast` with `sonner` in the component list — sonner is the correct shadcn v2+ notification system
- **Files modified:** Added `src/components/ui/sonner.tsx`, `sonner` package installed
- **Verification:** Component install succeeded with sonner
- **Committed in:** `77b53d7` (Task 1 commit)

**2. [Rule 3 - Blocking] Removed boilerplate page.tsx to fix duplicate route**
- **Found during:** Task 2 (after creating (main)/page.tsx)
- **Issue:** Next.js App Router cannot have both `src/app/page.tsx` and `src/app/(main)/page.tsx` serving `/` — route group parents are transparent
- **Fix:** Deleted `src/app/page.tsx` (Next.js create-next-app boilerplate); `(main)/page.tsx` now exclusively handles `/`
- **Files modified:** Deleted `src/app/page.tsx`
- **Verification:** `npm run build` succeeds; `npx tsc --noEmit` passes
- **Committed in:** `52212f2` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes required for correct operation. No scope creep.

## Issues Encountered

- **Stale .next/ cache:** After deleting `src/app/page.tsx`, TypeScript reported errors from `.next/types/validator.ts` referencing the deleted file. Fixed by clearing the `.next/` build cache — no code changes needed.

## User Setup Required

None — this plan is purely front-end UI with no external service dependencies.

## Next Phase Readiness

- Design system is complete and documented — serif/sans typography, navy/indigo palette, heading-serif utility
- All shadcn/ui components needed for auth forms (input, label, button, card, form) are available
- (auth) route group layout already exists from Phase 1 Plan 01 — auth pages (sign-in, sign-up) can be built immediately
- Header auth controls are wired to `useSession()` — will automatically show/hide login buttons once auth is working
- Build is clean: `npm run build` succeeds with 5 routes, no TypeScript errors

---
*Phase: 01-foundation*
*Completed: 2026-02-18*

## Self-Check: PASSED

All created files verified present on disk. Both task commits verified in git history.

- FOUND: src/app/globals.css
- FOUND: src/app/layout.tsx
- FOUND: src/app/(main)/layout.tsx
- FOUND: src/app/(main)/page.tsx
- FOUND: src/components/layout/Header.tsx
- FOUND: src/components/layout/Footer.tsx
- FOUND: components.json
- FOUND: 01-02-SUMMARY.md
- FOUND commit: 77b53d7 (Task 1)
- FOUND commit: 52212f2 (Task 2)
