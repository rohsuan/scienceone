# Feature Research

**Domain:** STEM Education Platform — Blog, Resource Library, Interactive Physics Simulations (v1.1 additions)
**Researched:** 2026-02-22
**Confidence:** HIGH for table stakes (verified against PhET, TPT, OER Commons, schema.org docs); MEDIUM for differentiators (pattern from multiple platforms, some extrapolation); LOW for anti-features (domain pattern + first-pass code inspection)

---

## Scope Note

This file covers ONLY the v1.1 additions: blog, resource library, and interactive simulations. The v1.0 book platform features are documented in an earlier FEATURES.md iteration. The existing first-pass code for all three domains has been inspected; this file maps what is already built vs. what is missing to be production-quality.

---

## Feature Landscape

### Blog

#### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Status in Code | Notes |
|---------|--------------|------------|----------------|-------|
| Article listing page with cards | Every blog has a listing page; cards with title, excerpt, cover, date, author are the universal pattern | LOW | BUILT — BlogPostCard, /blog | Complete |
| Category filtering | Readers arrive via interest area (Teaching, Computation, etc.); uncategorized blogs feel like a dump | LOW | BUILT — BlogFilters | 4 categories hardcoded in enum |
| Full-text search | "Find me that article about harmonic oscillators" — users search by keyword, not just category | LOW | BUILT — title/excerpt search | Already works |
| Article detail page | Title, content, author byline, date, cover image, subject tags — the minimum viable article page | LOW | BUILT — /blog/[slug] | Complete |
| Excerpt on cards | Readers scan before committing; missing excerpt = higher bounce from listing | LOW | BUILT | Optional field, sensible |
| Author attribution | STEM credibility is tied to author identity; anonymous articles feel unreliable | LOW | BUILT — name + photo + bio | Complete |
| Open Graph / SEO metadata | Blog articles spread via social sharing; og:title, og:image, og:description are table stakes for sharing | LOW | BUILT — generateMetadata | OG tags present |
| Article JSON-LD structured data | Google rich results (sitelinks, article carousels) require Article schema; missing = SEO penalty | LOW | BUILT — schema.org/Article | JSON-LD in page |
| Slug-based clean URLs | /blog/my-article-title not /blog?id=123 — URL is expected to be human-readable | LOW | BUILT | Slug-based routing |
| Published/draft workflow | Admin needs to draft before publishing; public page only shows published | LOW | BUILT — isPublished flag | Missing: admin preview of draft |
| Subject/topic tags on articles | Cross-links to resource library by subject; teachers filter by Physics, Math, etc. | LOW | BUILT — subjects M2M | Shared Subject model |
| Empty state messages | "No posts match your search" with a clear reset path — users notice when this is missing | LOW | BUILT | Implemented |
| Pagination or infinite scroll | At >20 posts, listing must paginate; without it the page becomes slow and hard to navigate | MEDIUM | MISSING | Currently loads all posts; no LIMIT |
| RSS feed | Tech-savvy educators and aggregators subscribe to RSS; absence signals an unmaintained platform | MEDIUM | MISSING | Not implemented |

#### Differentiators (Blog — Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| KaTeX math in blog posts | Other blogs force educators to screenshot equations; inline math renders properly for STEM readers | MEDIUM | MISSING — content is HTML but math not pre-rendered; TipTap+KaTeX pattern from ChapterEditor could carry over |
| Subject-based cross-links to resources | "Related resources on this topic" at bottom of article — turns blog readers into resource library customers | LOW | MISSING — data model supports it (shared subjects) but no UI |
| Reading time estimate | "5-minute read" sets expectations; reduces bounce for educators with limited planning periods | LOW | MISSING — trivial to compute (word count / 200 wpm) |
| Prev/Next article navigation | After reading, reader should see adjacent posts; without it they dead-end | LOW | MISSING — no nav between articles |
| Canonical URL on articles | Required if content is ever cross-posted; also best practice for duplicate-content prevention | LOW | PARTIALLY — OG URL present but no <link rel="canonical"> |

#### Anti-Features (Blog)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Comments section | "Let teachers discuss articles" | Requires moderation, spam handling, notification emails; academic STEM audience prefers asynchronous discussion elsewhere; support burden with zero business model benefit | Keep a contact/feedback email link; let discourse happen on Twitter/LinkedIn |
| User-submitted guest posts | "Community content expands reach" | Curator model is ScienceOne's brand; self-serve submissions bring quality control problems and review burden for a solo operator | If collaborators emerge, give them admin access and maintain editorial control |
| Newsletter subscription (Mailchimp/ConvertKit) | "Build a list" | Requires GDPR compliance, unsubscribe flows, and ongoing editorial commitment; premature for v1.1 | Add RSS first; newsletter can be built later when content cadence is proven |
| Social share buttons | "More sharing = more traffic" | Add JavaScript weight and privacy issues (tracking pixels); Google/social crawlers already pick up OG tags | OG tags already handle social previews; readers who want to share copy the URL |

---

### Resource Library

#### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Status in Code | Notes |
|---------|--------------|------------|----------------|-------|
| Resource listing page with cards | Card grid is the universal pattern for TPT, OER Commons, and every resource marketplace | LOW | BUILT — ResourceCard, /resources | Complete |
| Filter by subject | Teachers arrive with a discipline in mind (Physics, Calculus, etc.); subject filter is non-negotiable | LOW | BUILT — subject pill filters | Shared Subject model |
| Filter by type | Lesson Plan vs. Problem Set vs. Lab Guide are fundamentally different use cases; conflating them frustrates users | LOW | BUILT — type dropdown | 5 types |
| Filter by level | AP vs. intro university vs. advanced university determines fit; teachers will not dig through wrong-level content | LOW | BUILT — level dropdown | 3 levels |
| Sort by title / newest / popular | Title A-Z for browsing; newest for returning users; most popular for discovery | LOW | BUILT — sort dropdown | viewCount tracks popularity |
| Full-text search | Teachers search by topic keyword, not just filter; "find me a Newton's law problem set" needs keyword search | LOW | BUILT — title/description/subject search | Works |
| Resource detail page | Title, description, type/level badges, subject tags, cover image, download or purchase button | LOW | BUILT — /resources/[slug] | Complete |
| Free vs. paid signaling | "Free" badge or price must be visible on the card and detail page; hidden pricing creates distrust | LOW | BUILT — Free badge + price on card | Complete |
| Secure file download | Files must be behind auth/purchase check; direct R2 URL exposure is a security failure | LOW | BUILT — /api/resource-download presigned URL | R2 presigned, 900s expiry |
| Purchase flow for paid resources | Stripe checkout + webhook entitlement — same pattern as books; needed for paid resources | MEDIUM | BUILT — resource checkout + webhook | Implemented |
| Post-purchase access | After purchase, the download button should immediately appear; no re-login or page hunt | LOW | BUILT — hasResourcePurchase check | Works |
| "My Resources" in dashboard | Purchased resources must be findable; not showing them = users contact support | LOW | BUILT — dashboard MyResources section | Complete |
| Empty state messages | "No resources match filters" with clear reset — users notice broken empty states | LOW | BUILT | Implemented |
| Pagination | At >30 resources, listing must paginate or lazy-load; without it performance degrades | MEDIUM | MISSING | Currently loads all; no LIMIT |

#### Differentiators (Resource Library)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Content preview / description rich text | A plain-text description sells nothing; HTML content with headings and bullets (already wired) lets admin describe what's inside the resource | LOW | PARTIALLY BUILT — HTML content field exists; no rich editor for admin (raw textarea) |
| Cross-link to related simulations | A "Projectile Motion" lesson plan should surface the Projectile Motion simulation; closes the loop for teachers | LOW | MISSING — data model supports it (shared subjects) but no UI |
| Free sample / preview page | Teacher will not pay for a resource they haven't seen; a preview or sample page reduces purchase hesitation | HIGH | MISSING — schema doesn't support partial-file preview |
| Download format labeling | "PDF, 14 pages" or "ZIP, includes worksheets" tells the teacher exactly what they get | LOW | MISSING — fileName stored but file type and page count not displayed |
| View count display | Social proof ("1,243 views") builds trust on newer platforms; visible on detail page already | LOW | BUILT — viewCount shown on detail page | Already exists |
| Admin isPublished toggle separate from isFree | Resource can be drafted (not yet public) independently of whether it will be free or paid | LOW | BUILT — isPublished + isFree are separate fields | Complete |

#### Anti-Features (Resource Library)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Teacher ratings and reviews | "Community vetting increases trust" | Requires moderation, conflict-of-interest controls, and sufficient volume to be statistically meaningful; 20 resources with 2 ratings each is meaningless and looks abandoned | Display view count as social proof; let author credentials signal quality |
| Bulk download / cart | "Let teachers download multiple resources at once" | Adds zip-generation complexity, server load, and a shopping cart flow for a curator with <50 resources | Each resource is independently purchased; "My Resources" list is the library |
| User-uploaded resources | "Crowdsource the library" | Same argument as guest blog posts; curator model is the brand; quality control is not delegatable at v1.1 | Maintain admin-only upload; revisit if/when community is proven |

---

### Interactive Physics Simulations

#### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Status in Code | Notes |
|---------|--------------|------------|----------------|-------|
| Simulation gallery page | PhET, Wolfram Demonstrations — galleries are the universal entry point | LOW | BUILT — /simulations | Complete |
| Filter by subject | Teachers browsing mechanics vs. waves vs. thermodynamics need subject filtering | LOW | BUILT — subject filter (reuses ResourceFilters) | Works |
| Simulation card with preview | Play icon or screenshot thumbnail + title + description — the PhET gallery pattern | LOW | BUILT — SimulationCard | Card with hover-Play icon |
| Simulation detail page | Embed the interactive component; title, description, subject tags, teacher guide | LOW | BUILT — /simulations/[slug] | Complete |
| Playback controls (Play, Reset) | Every simulation users expect a way to start, stop, and reset; running without these is unusable | LOW | BUILT — all three simulations have Launch/Reset | Pattern established |
| Adjustable parameter sliders | The simulation's scientific value is in letting users vary parameters (angle, velocity, frequency); static = just a video | LOW | BUILT — sliders in all three simulations | Core pattern |
| Real-time parameter readout | Labels showing current values (t=2.3s, x=14.1m) during animation; without these teachers can't explain what's happening | LOW | BUILT — canvas text labels in ProjectileMotion | Present |
| Teacher guide section | PhET explicitly provides teacher guides; educators expect "how to use this in class" documentation | LOW | BUILT — teacherGuide field + HTML render | Schema complete; admin must populate |
| Free access (no paywall) | PhET has established the norm: physics simulations should be free; a paywall would feel predatory to the K-12/university market | LOW | BUILT — SimulationCard hardcodes "Free" badge | Simulations always free by convention |
| Subject tags | "Mechanics > Projectile Motion" hierarchy tells the teacher where this fits in the curriculum | LOW | BUILT — subject badges on detail page | Shared Subject model |
| Parameter documentation sidebar | What does the "gravity" slider actually do? What are the realistic range values? Documented parameters prevent misuse | LOW | BUILT — parameterDocs field + sidebar render | Admin must populate |

#### Differentiators (Simulations — Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Show Code" panel with live values | Existing ProjectileMotion has this already; showing the Python equations with current slider values is a unique STEM teaching differentiator — connects simulation to coursework | LOW | BUILT — ProjectileMotion only; WaveInterference and SpringMass may not have it |
| Admin componentKey registry | Dynamic lazy-loading means new simulations can be added without changing routes; componentKey drives everything | LOW | BUILT — SIMULATION_REGISTRY with lazy imports | Architecture is correct |
| Responsive canvas layout | Canvas is fixed-width (600px) in current code; on mobile the simulation is cropped or overflows | MEDIUM | MISSING — canvas width hardcoded; needs CSS scaling or viewport-relative dimensions |
| Simulation-to-resource cross-link | "Download the matching Lab Guide" on the simulation page drives resource purchases | LOW | MISSING — data model supports it (same slug base) but no UI link |
| Screenshot/thumbnail for gallery | SimulationCard shows a blue gradient placeholder when no coverImage; a real screenshot is more engaging | LOW | MISSING — admin must upload a cover image; no auto-screenshot |

#### Anti-Features (Simulations)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Embed/iframe API for third-party use | "Let teachers embed simulations in their LMS" | iframe embedding creates CORS complexity, content-security-policy conflicts, and removes traffic from the platform | Deep-link directly to the simulation page; teachers can open in a new tab during class |
| Save simulation state (user presets) | "Let teachers save a specific parameter configuration for their class" | Requires user account, serialization, and a UI for managing presets; premature for <10 simulations | Teachers can bookmark the URL; add preset URL params if multiple save-states are needed |
| Real-time multiplayer simulations | "Let students adjust parameters simultaneously" | WebSocket infrastructure, conflict resolution, and session management for a feature that most classroom physics demos don't need | Keep simulations stateless and single-user; each student gets their own instance |

---

## Feature Dependencies

```
Blog
    Blog listing page
        └──requires──> BlogPostCard component
        └──requires──> BlogFilters (category + subject + sort)
        └──requires──> ResourceSearchInput (reused from resources)

    Blog article page
        └──requires──> BlogPost.content (HTML)
        └──produces──> SEO (JSON-LD Article schema already present)
        └──enhances──> Subject cross-links to Resource Library (not built)
        └──enhances──> Prev/Next navigation (not built)

    Admin blog management
        └──requires──> BlogPostTable (listing)
        └──requires──> BlogPostEditForm (create/edit)
        └──requires──> ImageUploadField (cover image, R2)

Resource Library
    Resource listing page
        └──requires──> ResourceCard
        └──requires──> ResourceFilters (subject + type + level + sort)
        └──requires──> ResourceSearchInput

    Resource detail page
        └──requires──> hasResourcePurchase (auth + purchase check)
        └──requires──> /api/resource-download (presigned R2 URL)
        └──requires──> ResourceBuyButton → createResourceCheckoutSession
        └──requires──> Stripe webhook (resource purchase entitlement)

    Purchase flow
        └──requires──> User authenticated (Better Auth session)
        └──requires──> Resource.pricing (ResourcePrice record)
        └──produces──> ResourcePurchase record
        └──produces──> Email confirmation (Resend)

    Admin resource management
        └──requires──> ResourceTable (listing)
        └──requires──> ResourceEditForm (create/edit)
        └──requires──> FileUploadField (file R2 upload)
        └──requires──> ImageUploadField (cover image R2)

Simulations
    Simulation gallery
        └──requires──> SimulationCard
        └──requires──> ResourceFilters (subject only — reused)

    Simulation detail page
        └──requires──> SimulationEmbed
        └──requires──> SIMULATION_REGISTRY (componentKey lookup)
        └──requires──> Simulation.teacherGuide (admin-populated)
        └──requires──> Simulation.parameterDocs (admin-populated)

    Simulation components
        └──requires──> React lazy + Suspense (dynamic loading)
        └──requires──> Canvas API (requestAnimationFrame, 2D context)
        └──requires──> Admin componentKey selection (dropdown from SIMULATION_KEYS)

Cross-feature
    Subject model (shared)
        └──used by──> Blog (BlogPostSubject)
        └──used by──> Resources (ResourceSubject)
        └──enables──> Cross-links between blog posts and resources on same subject (not built)

    Resource type SIMULATION
        └──routing──> /simulations/[slug] (redirected in /resources/[slug])
        └──detail──> SimulationEmbed + Simulation sub-record
        └──NOT shown in──> resource listing (filtered from /resources by ResourceCard redirect)
```

### Dependency Notes

- **Pagination depends on nothing but is blocked by** the current "load all" query pattern; adding LIMIT + offset is self-contained.
- **RSS feed is independent** of all other features; it is a pure read path from published BlogPost records.
- **KaTeX in blog** depends on the same pattern used in ChapterEditor (TipTap + tiptap-katex); the infrastructure exists but is not wired to blog content editing.
- **Cross-links (blog-to-resources, sim-to-lab-guide)** depend on shared Subject slugs already in the DB; they need only a query and UI, no schema changes.
- **Canvas responsive layout** is self-contained within each simulation component; fixing one establishes the pattern for all.
- **Admin preview of draft posts** requires only a link from the admin edit page to the public post URL; it is a one-line addition.

---

## MVP Definition

Context: v1.1 is shipping first-pass code that already exists. The MVP question is "what must be working before this is announced?" not "what should be built from scratch?"

### Ship Without These (Blocking Issues — Must Fix)

- [ ] **Pagination on blog listing** — loading all posts is a latency/scalability problem; add LIMIT 12 + "load more" or cursor pagination
- [ ] **Pagination on resource listing** — same issue
- [ ] **Canvas responsive layout** — 600px hardcoded canvas breaks on mobile; STEM teachers use iPads and phones to demo in class
- [ ] **Admin draft preview** — admin cannot verify how a post looks before publishing; this is a blocking UX gap

### Add Promptly (High Value, Low Cost)

- [ ] **Reading time estimate on blog cards and article pages** — trivial compute (word count / 200), high perceived polish
- [ ] **Prev/Next article navigation on blog posts** — readers dead-end without it; 30-minute implementation
- [ ] **RSS feed for blog** — educators and aggregators subscribe; validates platform as maintained
- [ ] **Download format/file size label on resource detail** — "PDF • 2.4 MB" sets expectations; data is in fileName already
- [ ] **Subject cross-links: blog-to-resources** — "More resources on Mechanics" at bottom of blog post; drives resource discovery
- [ ] **Subject cross-links: simulation-to-lab-guide** — "Download the Lab Guide" on simulation page; drives paid resource sales

### Defer (Good but Not Blocking)

- [ ] **KaTeX math in blog posts** — most blog content will be prose; add only when the author needs to write equations
- [ ] **"Show Code" panel consistency** — WaveInterference and SpringMass may not have it; add when simulations are reviewed
- [ ] **Screenshot thumbnails for simulations** — admin uploads cover images; prompt with guidance, not automation
- [ ] **Canonical URL tag** — low SEO risk for a new platform; add as part of any general SEO pass

### Explicitly Out of Scope (v1.1)

- [ ] **Comments on blog** — moderation burden; not in scope
- [ ] **User-uploaded resources** — curator model; not in scope
- [ ] **Simulation embed/iframe API** — LMS complexity; not in scope
- [ ] **Newsletter subscription** — premature; RSS first
- [ ] **Guest blog posts** — curator model; not in scope

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Blog listing + article pages | HIGH | — (BUILT) | P1 — verify |
| Resource library listing + detail | HIGH | — (BUILT) | P1 — verify |
| Simulation gallery + detail + embed | HIGH | — (BUILT) | P1 — verify |
| Blog/resource admin CRUD | HIGH | — (BUILT) | P1 — verify |
| Stripe purchase flow for resources | HIGH | — (BUILT) | P1 — verify |
| Secure file download | HIGH | — (BUILT) | P1 — verify |
| Pagination (blog + resources) | HIGH | LOW | P1 — must fix |
| Canvas responsive layout | HIGH | MEDIUM | P1 — must fix |
| Admin draft preview link | HIGH | LOW | P1 — must fix |
| Reading time estimate | MEDIUM | LOW | P2 |
| Prev/Next blog navigation | MEDIUM | LOW | P2 |
| RSS feed | MEDIUM | LOW | P2 |
| File format label on resource | MEDIUM | LOW | P2 |
| Subject cross-links (blog to resource) | HIGH | LOW | P2 |
| Subject cross-links (sim to lab guide) | HIGH | LOW | P2 |
| KaTeX math in blog posts | MEDIUM | MEDIUM | P3 |
| Show Code panel in all simulations | MEDIUM | LOW | P3 |
| Canonical URL meta tag | LOW | LOW | P3 |

**Priority key:**
- P1: Must work for launch — either already built (verify) or a blocking gap (fix)
- P2: Add promptly — high value, low cost, ship in first iteration
- P3: Nice to have — defer until after core is stable

---

## Competitor Feature Analysis

| Feature | PhET (simulations) | Teachers Pay Teachers (resources) | Medium / Substack (blog) | ScienceOne Approach |
|---------|-------------------|-----------------------------------|--------------------------|---------------------|
| Category/subject filtering | By subject (5 disciplines) | By grade, subject, format, price | By tag + publication | Subject pills + type/level dropdowns |
| Search | Full-text + filters combined | Full-text prominent | Full-text | Keyword search + URL params |
| Resource card metadata | Subject badges + HTML5 badge | Grade, format, rating, price | Read time, claps, pub date | Type + level + subject + free/price badge |
| Teacher guide | Yes — dedicated section per sim | Not standardized (seller discretion) | N/A | teacherGuide field + HTML render |
| Parameter docs | Sim-specific help text | N/A | N/A | parameterDocs sidebar |
| Free/paid signaling | All free | Clearly labeled, filter by free | Free tiers | "Free" badge vs price display |
| Reading time | N/A | N/A | Yes — prominent | Missing; easy to add |
| RSS | N/A | N/A | Yes (Substack native) | Missing for blog |
| SEO / JSON-LD | Yes | Yes (rich snippets) | Yes | Article JSON-LD present; sim/resource OG tags |
| Pagination | Yes (50 per page) | Yes (20 per page) | Yes (infinite) | Missing — currently loads all |
| Mobile responsive | Yes (HTML5 canvas scales) | Yes | Yes | Canvas is 600px fixed — needs fix |
| Admin CRUD | N/A (open contrib model) | Seller dashboard | Publisher dashboard | Admin dashboard (tabbed form) |

---

## Sources

- [PhET Interactive Simulations — Teaching Resources](https://phet.colorado.edu/en/teaching-resources) — simulation gallery patterns, teacher guide format, free model (MEDIUM confidence, observed)
- [PhET category browse](https://phet.colorado.edu/en/simulations/category/physics) — filter taxonomy: Physics, Math & Statistics, Chemistry, Earth & Space, Biology (MEDIUM confidence, observed)
- [Teachers Pay Teachers — How to download or buy resources](https://help.teacherspayteachers.com/hc/en-us/articles/360042469472-How-do-I-download-or-buy-TPT-resources) — "My Purchases" pattern, immediate post-purchase access expectation (HIGH confidence, official help doc)
- [Article Schema best practices 2025 — SEO-Wiki](https://www.seo-day.de/wiki/on-page-seo/html-optimierung/strukturierte-daten/article-schema.php?lang=en) — datePublished, dateModified, author, E-E-A-T signals (HIGH confidence, SEO reference)
- [Google Structured Data for Blogs 2026](https://comms.thisisdefinition.com/insights/ultimate-guide-to-structured-data-for-seo) — Article schema, JSON-LD, AI Overviews compatibility (MEDIUM confidence)
- [Yoast — Estimated reading time feature](https://yoast.com/features/estimated-reading-time/) — reading time UX patterns, ~200 wpm calculation standard (HIGH confidence, official Yoast docs)
- [Google Search Central — Pagination best practices](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) — rel=prev/next deprecated 2019; focus on canonical and clear nav (HIGH confidence, official Google docs)
- [OER Commons](https://oercommons.org/) — subject/grade/type filter taxonomy for educational resource libraries (MEDIUM confidence, known platform)
- [Interactive HTML5 Canvas simulations — Weber State Physics](https://physics.weber.edu/schroeder/html5/tutorialpacket.pdf) — Play/Pause/Reset control patterns, requestAnimationFrame standard (HIGH confidence, academic source)
- ScienceOne first-pass codebase inspection — all source files in src/app/(main)/, src/components/, src/lib/, src/simulations/ (HIGH confidence, direct observation)

---

*Feature research for: ScienceOne v1.1 — Blog, Resource Library, Interactive Simulations*
*Researched: 2026-02-22*
