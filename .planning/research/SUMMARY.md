# Project Research Summary

**Project:** ScienceOne v1.1
**Domain:** STEM education platform — blog, resource library, interactive physics simulations added to existing book platform
**Researched:** 2026-02-22
**Confidence:** HIGH — all findings from direct codebase inspection; no inference required

## Executive Summary

ScienceOne v1.1 is not a greenfield build — it is a first-pass-code integration milestone. The parallel researcher agents found that substantially all of the blog, resource library, and simulation features have already been written and live in the codebase as untested first-pass code. The primary work is not building features from scratch but auditing, fixing, and verifying what already exists. The recommended approach is a structured verification and bug-fix pass across three feature areas in dependency order: resource infrastructure first (payment flow is the riskiest), simulations second (SSR bugs are blocking), and blog last (simpler data path, fewer cross-dependencies). No new npm packages are required.

The most important finding across all four research areas is that first-pass code has well-documented bugs that will cause silent failures in production. The simulation registry uses `React.lazy` instead of `next/dynamic({ ssr: false })`, which will produce server-side errors when simulation pages load. `dangerouslySetInnerHTML` is called on database content without sanitization in four locations (XSS vector). The Stripe webhook handler has dead code and routes by metadata ID presence rather than explicit product type. Blog SEO will silently fail because `publishedAt` is nullable and `togglePublishBlogPost` doesn't revalidate the post's own detail URL. None of these are architectural missteps — they are tactical bugs in otherwise-sound code that must be fixed before anything is published.

The architectural decisions in the first-pass code are correct and should not be changed: Simulation as a Resource subtype avoids duplicating purchase/admin infrastructure; URL-param-driven server-side filtering is correct for current data volumes; the simulation component registry with `next/dynamic` (after the fix) is the right pattern for safe dynamic rendering. The shared Subject taxonomy across content types is a genuine asset that enables cross-linking features. The roadmap should focus on the build order prescribed in ARCHITECTURE.md: database schema migration, subject infrastructure, resource admin, resource public and purchase, simulations, blog admin, blog public, dashboard integration.

## Key Findings

### Recommended Stack

No new npm packages are required for v1.1. Every dependency needed for blog, resource library, and simulations is already installed. The stack is the existing production stack: Next.js 16 App Router, Prisma 7 on PostgreSQL, Better Auth, Tailwind v4, shadcn/ui, Stripe, Cloudflare R2, Resend, KaTeX, `sanitize-html`, `shiki`, `@tiptap/react`, `@tanstack/react-table`, `react-hook-form` + `zod`, `use-debounce`, `lucide-react`, `sonner`.

See `.planning/research/STACK.md` for full analysis.

**Core technologies (existing, reused for v1.1):**
- **Canvas API + `requestAnimationFrame`** — physics simulations are analytically simple 2D animations; no external physics library needed; all 3 simulations verified pure Canvas
- **`next/dynamic({ ssr: false })`** — replaces the first-pass `React.lazy` in simulation registry; this is the fix that unblocks SSR safety for simulations
- **`sanitize-html`** — already installed; must be applied before every `dangerouslySetInnerHTML` call (currently missing in 4 locations: blog content, resource content, simulation teacherGuide, simulation parameterDocs)
- **`shiki` `highlightCodeBlocks()`** — already installed and used in the book reader; must be applied to blog post content before render (currently missing)
- **URL params + Next.js Server Components** — for all filtering/search on blog, resources, simulations; no client-side state needed; already implemented
- **Stripe Checkout + webhook** — reused identically from book purchases; the webhook handler needs an explicit `productType` routing fix

**What NOT to add:** Physics engines (matter.js, cannon.js), p5.js, WebGL/Three.js, Markdown parsers (content is HTML not Markdown), headless CMS (data is in Prisma), react-query/SWR (filtering is server-driven), TipTap for blog admin (textarea is sufficient for single-founder use).

### Expected Features

See `.planning/research/FEATURES.md` for full tables with complexity and status per feature.

**Already built — P1 verify, don't rebuild:**
- Blog: listing page with cards, category/subject/sort/search filters, article detail with JSON-LD Article schema, SEO metadata, published/draft workflow, subject tags, author attribution
- Resources: listing with subject/type/level/sort/search, detail page with free/paid signaling, secure presigned R2 download, Stripe purchase flow, post-purchase access, "My Resources" in dashboard, view count display
- Simulations: gallery page, subject filtering, detail page with SimulationEmbed, Play/Reset/slider controls in all 3 simulations, teacher guide and parameter docs fields, free access convention, admin componentKey registry

**Must fix before launch (blocking gaps):**
- Pagination on blog listing — currently loads all posts with no LIMIT
- Pagination on resource listing — same issue
- Canvas responsive layout — 600px hardcoded breaks on mobile/iPad, which STEM teachers use in the classroom
- Admin draft preview link — admin cannot verify how a post looks before publishing

**Add promptly after core is verified (high value, low cost):**
- Reading time estimate on blog cards (trivial: word count / 200 wpm)
- Prev/Next article navigation on blog posts (readers dead-end without it)
- RSS feed for blog (educators and aggregators expect it; signals maintained platform)
- File format and size label on resource detail ("PDF • 2.4 MB")
- Subject cross-links: blog post to related resources (data model supports it; needs query and UI only)
- Subject cross-links: simulation to matching lab guide (same; drives paid resource sales)

**Defer to later:**
- KaTeX math in blog post content (most posts will be prose; add when the author needs equations)
- "Show Code" panel consistency across all 3 simulations (ProjectileMotion has it; others may not)
- Canonical `<link rel="canonical">` meta tag (low SEO risk for a new platform)

**Explicitly out of scope:**
- Blog comments, guest posts, newsletter subscription, social share buttons
- User-uploaded resources, ratings/reviews, bulk download
- Simulation embed/iframe API, save-state presets, real-time multiplayer

### Architecture Approach

The first-pass architecture is sound and follows the patterns established in v1.0. Five key architectural patterns are in place and should be preserved. Simulation as Resource subtype: every simulation is a Resource with `type: SIMULATION` plus a linked Simulation record, eliminating duplicate admin/purchase/filter infrastructure. Static component registry: `simulation-registry.ts` maps string keys to dynamically-loaded components, with `SIMULATION_KEYS` driving the admin dropdown, making registry and simulation file an atomic two-file change. Shared Subject taxonomy: one Subject table used by both Resource and BlogPost, enabling cross-linking with no schema changes needed. URL-param-driven filtering: all filter state lives in URL params, server-rendered per request, bookmarkable, no client state management. Single upload URL route: `/api/admin/upload-url` handles all content types via a type union.

See `.planning/research/ARCHITECTURE.md` for full component inventory and data flows.

**Major components:**
1. **Server action and query layer** — feature-split into `{feature}-queries.ts` (public, `isPublished: true` enforced, React.cache) and `{feature}-admin-queries.ts` (all records, no filter); must never be mixed to prevent draft content leaking to public pages
2. **Admin UI** — React Hook Form + Zod + tabbed shadcn/ui forms for BlogPostEditForm and ResourceEditForm; ResourceEditForm shows a conditional Simulation tab when type=SIMULATION is selected
3. **Simulation system** — `SIMULATION_REGISTRY` (convert to `next/dynamic`) -> `SimulationEmbed` (Suspense boundary) -> canvas component in `src/simulations/`; each simulation is self-contained, no shared logic between them
4. **Purchase and download flow** — `createResourceCheckoutSession` -> Stripe hosted checkout -> webhook `resourcePurchase.upsert()` -> entitlement check in `/api/resource-download` -> presigned R2 GET URL returned as JSON for client to redirect to

**Prescribed build order:**
1. Prisma migration (new tables must exist first)
2. Subject infrastructure (shared dependency for both resources and blog)
3. Resource admin (file upload, CRUD, simulation tab)
4. Resource public and purchase (buy flow, download, webhook)
5. Simulation registry and components (convert to `next/dynamic`, verify all 3)
6. Blog admin (simpler; no purchase flow)
7. Blog public (listing, detail, SEO)
8. Dashboard and homepage integration

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for all 9 pitfalls with recovery strategies. The top 5 that will cause production failures if not addressed:

1. **`React.lazy` in simulation registry will cause server-side errors** — `performance.now()`, `canvas.getContext()`, and `requestAnimationFrame` are browser APIs. Convert all registry entries to `next/dynamic(() => import(...), { ssr: false })` before loading any simulation page. This is the first task in the simulations phase. Warning signs: server errors with `performance is not defined` or hydration mismatch warnings.

2. **`dangerouslySetInnerHTML` on unsanitized content in 4 locations** — blog post content, resource content, simulation teacherGuide, simulation parameterDocs are all rendered without passing through `sanitize-html`. Even with admin-only input today, this is a stored XSS vector. Create a shared `sanitizeHtml()` utility and wrap all four call sites. Must be done before any content is published.

3. **Stripe webhook dead code and implicit routing will mask payment bugs** — the book branch has an unreachable `if (!bookId)` guard; routing is by ID presence, not explicit type. Add `productType: "book" | "resource"` to Stripe metadata in both checkout session creators. Route webhook by `metadata.productType`. Do this during resource purchase flow verification.

4. **Blog SEO silent failures from nullable `publishedAt`** — `JSON.stringify` drops `undefined`, so `datePublished` disappears from JSON-LD when `publishedAt` is null. Fix: fall back to `createdAt` in the JSON-LD generator. In `togglePublishBlogPost`, only set `publishedAt` if not already populated (prevents date clobbering on re-publish). Also: no `app/sitemap.ts` exists — add it before publishing the first post.

5. **`togglePublishBlogPost` doesn't revalidate the post's detail URL** — the action revalidates `/blog` and `/admin/blog` but not `/blog/${slug}`. Publishing a post and immediately visiting its URL may return a 404 or stale content. Fix: fetch the slug before updating, then `revalidatePath(\`/blog/${slug}\`)` after. The pattern already exists in `updateBlogPost`.

**Additional pitfalls to address (not launch-blocking but important):**
- RAF cancellation not verified in SpringMass and WaveInterference — potential memory leak at 60fps
- `componentKey` registry drift produces silent broken simulation pages; add admin warning for mismatched keys
- Resource success page has no user ownership check — information disclosure if session_id URL is shared
- Old URLs not revalidated when slug changes in either blog posts or resources

## Implications for Roadmap

Based on the combined research, the suggested phase structure follows ARCHITECTURE.md's build order, grouped to minimize integration risk and respect the dependency graph. The core insight: this is a verification and bug-fix project, not a build project. Phases should be structured as "fix and verify" passes over existing code, not feature development phases.

### Phase 1: Infrastructure — DB Migration and Subject System

**Rationale:** The Prisma schema for all three feature areas must exist before any other work can run. The migration already exists at `prisma/migrations/20260222002050_add_resources_blog_simulations/` and may need review. Subject is a shared dependency for both resources and blog; it must be verified working before either admin form can be tested.
**Delivers:** All new tables created and migrated. `SubjectSelect` component + `createSubject` server action verified working. Initial subjects seeded (Physics, Mathematics, Chemistry, etc.).
**Addresses:** No user-facing features, but unblocks all subsequent phases.
**Avoids:** Building admin UI before tables exist; blocking on shared dependency mid-phase.

### Phase 2: Resource Admin

**Rationale:** Resource admin is the most complex admin form (4 tabs, file upload, simulation conditional tab, subject multi-select). Verifying it first surfaces any upload-route bugs before they affect the public side. Admin correctness gates Phase 3. The ImageUploadField prop naming bug (`bookId` used for blog/resource context) should be fixed here.
**Delivers:** Admin can create/edit/publish/delete resources; upload file and cover image to R2; assign subjects; set type=SIMULATION and enter componentKey via dropdown; toggle publish.
**Addresses:** Admin CRUD, FileUploadField, SubjectSelect, upload URL route extension for resource and blog upload types.
**Avoids:** Draft/published query mixing (public queries must always enforce `isPublished: true`); trusting client-sent prices (server action fetches price from DB, never accepts client amount).

### Phase 3: Resource Public and Purchase Flow

**Rationale:** The purchase flow (Stripe -> webhook -> entitlement) is the highest-risk path in the entire milestone. It touches external services, involves money, and has known bugs in the webhook handler. Verify it in test mode before simulations or blog, so it can be isolated and debugged without noise from other features.
**Delivers:** Resource listing with filters and pagination, detail page, free download via client-side fetch of presigned URL, paid purchase via Stripe Checkout, post-purchase access gating, "My Resources" on dashboard.
**Addresses:** Pagination (add `take: 12` + cursor pagination to resource listing query), download button client component fix (must fetch JSON then redirect, not navigate to API route directly), resource success page ownership check, Stripe webhook explicit `productType` routing.
**Avoids:** Stripe webhook implicit routing pitfall — add `productType` metadata during this phase; the unreachable dead code `if (!bookId)` should be removed at the same time.

### Phase 4: Simulations

**Rationale:** Simulations depend on resources (they are Resource records with type=SIMULATION). The registry-to-`next/dynamic` conversion must happen before any simulation page is loaded in production or it causes server errors. The canvas responsive layout fix is required before classroom use on iPads and phones.
**Delivers:** Simulation gallery with subject filter, simulation detail with working embedded canvas, all 3 simulations rendering correctly with Play/Reset/sliders, teacher guide and parameter docs populated in admin, responsive canvas layout.
**Addresses:** `React.lazy` -> `next/dynamic({ ssr: false })` conversion (first task, must not be skipped), RAF cancellation audit for SpringMass and WaveInterference, canvas 600px fixed-width responsive fix, componentKey error message replaced with generic text, admin dropdown labels improved from raw keys to human-readable names.
**Avoids:** Simulation SSR errors; simulation component key drift (add admin validation banner for mismatched keys).

### Phase 5: Blog Admin and Public

**Rationale:** Blog has no purchase flow complexity, making it the safest phase to verify last. The sanitization and SEO fixes are the most important items and must be done before any content is published.
**Delivers:** Admin can create/edit/publish blog posts with cover image, author photo, subject tags. Public blog listing with category/subject/sort/search and pagination. Article detail page with correct JSON-LD, Shiki-highlighted code blocks, working SEO metadata.
**Addresses:** HTML sanitization via `sanitize-html` applied to `post.content` before render (Pitfall 1 — XSS), `app/sitemap.ts` covering all three content types (must exist before first publish), `publishedAt` fallback to `createdAt` in JSON-LD (Pitfall 5 — SEO), `togglePublishBlogPost` slug revalidation fix (Pitfall 8), old-slug revalidation on slug changes (Pitfall 9), Shiki `highlightCodeBlocks()` applied to blog post content before render.
**Avoids:** Publishing a post with broken SEO; stale cache after slug changes; XSS from unsanitized admin HTML.

### Phase 6: Polish and Cross-Linking

**Rationale:** Once all three content areas are verified in isolation, add the high-value low-cost features that connect them and complete the user experience. These features depend on all three content types existing and working, so they belong last.
**Delivers:** Blog pagination, reading time estimates on blog cards, prev/next article navigation, RSS feed for blog, file format/size labels on resource detail, subject cross-links from blog posts to related resources, subject cross-links from simulation pages to related lab guides.
**Addresses:** FEATURES.md P2 items — all high-value, low-implementation-cost improvements that require stable underlying content.
**Avoids:** Shipping cross-links before the underlying content types are stable and verified.

### Phase Ordering Rationale

- Database migration must come first — all other phases are blocked on tables existing.
- Subject infrastructure before both resource admin and blog admin — it is a shared dependency for both forms.
- Resource admin before resource public — cannot verify public pages without seed data created by admin.
- Resource purchase before simulations — the purchase flow is the highest-risk integration point; isolating its verification prevents noise from simulation bugs.
- Simulations after resource admin — simulations are a Resource subtype; they need resource infrastructure working first.
- Blog last among content areas — fewest dependencies, no purchase flow, safest to verify in isolation.
- Cross-linking polish last — requires all three content types to be stable before connecting them.

### Research Flags

Phases with well-documented patterns (standard — skip `/gsd:research-phase`):
- **Phase 1 (Infrastructure):** Database migration is mechanical; schema already written in the migration file. Subject infrastructure reuses existing SubjectSelect pattern.
- **Phase 2 (Resource Admin):** Admin form pattern is identical to existing BookEditForm in the codebase. No novel patterns.
- **Phase 3 (Resource Purchase):** Stripe Checkout + webhook is the same pattern as the existing book purchase flow. The fix (explicit `productType`) is clearly prescribed.
- **Phase 5 (Blog Admin and Public):** Blog follows a simpler path than resources; all patterns are established by resources phase.
- **Phase 6 (Polish):** All items are well-understood features with clear implementation paths (RSS = route handler + XML, reading time = word count / 200, pagination = `take`/`skip`).

Phases that may benefit from targeted research during planning:
- **Phase 4 (Simulations) — canvas responsive layout:** The research identifies the problem (600px hardcoded) but does not prescribe one canonical fix. The implementation phase should spike on CSS `aspect-ratio` container scaling vs. viewport-relative canvas dimensions vs. CSS `transform: scale()` to pick the approach that works consistently across all 3 different simulation layouts.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct `package.json` and source file inspection. Zero new dependencies needed — verified by checking every feature against installed packages. No inference. |
| Features | HIGH | Table stakes verified against PhET, TPT, OER Commons. First-pass code status verified by direct file inspection for each feature row. Status is fact, not estimate. |
| Architecture | HIGH | All findings from direct codebase inspection at commit `a7ee42c`. Data flows traced from source to destination. Anti-patterns identified from actual code, not hypotheticals. |
| Pitfalls | HIGH | Bugs are directly observable in the code (grep for `React.lazy`, `dangerouslySetInnerHTML`, dead code in webhook). External sources cited for severity assessment (XSS, RAF leak, SSR errors). |

**Overall confidence:** HIGH

### Gaps to Address

- **Canvas responsive layout strategy:** Research identifies the problem clearly but does not prescribe one fix. The implementation phase should spike on the three candidate approaches before committing. Affects all 3 simulation components so the choice must work universally.
- **Pagination UX pattern:** Research identifies pagination as missing and necessary but does not specify "load more" button vs. numbered pages vs. infinite scroll. For educators browsing a low-frequency-updated catalog, "load more" is likely correct (they want to see all), but confirm with the founder before building.
- **Email template for resource purchases:** The current webhook reuses `PurchaseConfirmationEmail` with `bookSlug`/`bookTitle` fields repurposed for resource data. A dedicated `ResourcePurchaseConfirmationEmail` template is the correct fix but research did not determine whether this is blocking for v1.1 or can be deferred.
- **Sitemap priority values:** Research flags the absence of a sitemap as critical but does not specify priority/changefreq values per content type. Standard practice: blog posts and resources at 0.8, simulations at 0.7, homepage at 1.0.

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- All source files in `src/app/(main)/blog/`, `src/app/(main)/resources/`, `src/app/(main)/simulations/`, `src/app/(admin)/admin/blog/`, `src/app/(admin)/admin/resources/`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/resource-download/route.ts`, `src/lib/simulation-registry.ts`, `src/components/simulations/SimulationEmbed.tsx`, `src/simulations/` — all directly inspected
- `package.json` — all installed dependencies verified, confirming zero new packages needed
- `prisma/migrations/20260222002050_add_resources_blog_simulations/` — schema migration already written
- `git log` — commit `a7ee42c` documents `isomorphic-dompurify` removal and `sanitize-html` adoption

### Secondary (MEDIUM confidence — official docs and established platforms)

- [Next.js lazy loading guide](https://nextjs.org/docs/app/guides/lazy-loading) — `next/dynamic` vs `React.lazy`; `ssr: false` semantics
- [Next.js `revalidatePath` docs](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) — path-specific cache invalidation
- [Next.js sitemap API reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — sitemap.ts file convention
- [PhET Interactive Simulations](https://phet.colorado.edu/en/simulations/category/physics) — gallery patterns, teacher guide format, free access model
- [Teachers Pay Teachers help docs](https://help.teacherspayteachers.com/hc/en-us/articles/360042469472) — "My Purchases" pattern, post-purchase access expectations
- [Stripe metadata documentation](https://docs.stripe.com/metadata) — explicit `productType` routing pattern
- [Google Search Central — pagination best practices](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) — SEO implications of load-all vs. paginated
- [Yoast — estimated reading time](https://yoast.com/features/estimated-reading-time/) — 200 wpm standard, UX pattern

### Tertiary (supporting context)

- [Sourcery XSS vulnerability database](https://www.sourcery.ai/vulnerabilities/typescript-react-security-audit-react-dangerouslysetinnerhtml) — `dangerouslySetInnerHTML` XSS severity framing
- [RAF memory leak empirical study](https://stackinsight.dev/blog/memory-leak-empirical-study) — 1,230 instances of missing cancellation in OSS repos; validates prioritization
- [OER Commons](https://oercommons.org/) — resource library filter taxonomy patterns for educational platforms

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
