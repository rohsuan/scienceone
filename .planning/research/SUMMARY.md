# Project Research Summary

**Project:** ScienceOne
**Domain:** Online STEM book publishing platform (mathematics and physics)
**Researched:** 2026-02-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

ScienceOne is an online academic publishing platform for STEM books — specifically mathematics and physics — with three monetization models (open access, pay-per-book, pay-per-chapter) and three reading surfaces (browser reader, PDF download, EPUB download). Research across all four areas converges on a clear architecture: a Next.js 15 monolith with a Data Access Layer enforcing purchase checks, KaTeX math pre-rendered at ingest time (not client-side), Stripe webhooks as the sole access-grant mechanism, and Cloudflare R2 for file storage with presigned URLs. This stack is well-matched to the domain's core constraint: math-dense content that must load fast, render correctly, and stay behind a reliable paywall.

The most important recommendation from combined research is to treat the manuscript ingest pipeline as the highest-risk dependency and build it first. Every other feature — the reader, catalog, payment gate, downloads — depends on content being correctly ingested, math pre-rendered, and structured data written to the database. The ingest pipeline is also where the most irreversible decisions live: KaTeX vs MathJax (equation cross-referencing support), format support (LaTeX, Word, Markdown), and validation rigor. Cutting corners here creates technical debt that scales badly as the catalog grows.

The three most serious risks are: (1) client-side math rendering, which causes layout flash and accessibility failures and is expensive to retrofit; (2) Stripe webhook race conditions, which generate "I paid but can't access" support tickets if entitlement is not idempotent and webhook-driven; and (3) silent ingestion corruption, where Pandoc converts LaTeX files that look correct in a browser but have broken equation cross-references, missing theorem boxes, or malformed figures. All three risks have well-documented prevention strategies that must be built in from the start, not patched later.

---

## Key Findings

### Recommended Stack

The stack centers on Next.js 15.5 with the App Router, TypeScript 5.9, Prisma 7 on PostgreSQL 16 (Neon serverless), Tailwind CSS 4, and shadcn/ui. This combination is well-suited to content-heavy publishing: SSG serves public catalog pages fast, Server Components enforce access control at render time, and App Router typed routes catch broken links at compile time. For math rendering, KaTeX 0.16.x with server-side `renderToString()` at ingest time is the correct choice — synchronous rendering eliminates layout shift on formula-dense pages. MathJax is the alternative only if manuscripts require `\label`/`\eqref` cross-references heavily and author pressure justifies the client-side performance trade-off.

Payments use Stripe with webhook-driven fulfillment. Authentication uses Auth.js v5 (NextAuth) with the Prisma adapter — keeping user data, session tokens, and purchase records in the same PostgreSQL database is a deliberate design choice for transactional access control. File storage uses Cloudflare R2 (S3-compatible, zero egress fees) with `@aws-sdk/client-s3` and presigned URL generation at download time. Manuscript conversion uses Pandoc (system binary) via `node-pandoc`, with Resend for transactional email. Notably, Prisma 7 drops MongoDB support entirely and Next.js 15 requires Node.js 20+.

**Core technologies:**
- Next.js 15.5: Full-stack framework — SSG for catalog, SSR for gated content, API routes for webhooks
- TypeScript 5.9: Type safety — required for Prisma 7's typed queries and Next.js 15's typed routes
- PostgreSQL 16 (Neon): Primary database — handles relational purchase/access data; JSONB for flexible book metadata
- Prisma 7: ORM — Rust-free, 3x faster queries, type-safe; critical for preventing wrong-user-gets-wrong-content bugs
- KaTeX 0.16.x: Math rendering — synchronous server-side pre-render at ingest; no client-side JS for math display
- Stripe: Payments — webhook-driven access grants; supports pay-per-book and pay-per-chapter natively
- Auth.js v5: Authentication — co-located with purchase data in same Postgres database
- Cloudflare R2: File storage — zero egress fees; presigned URLs for gated PDF/EPUB delivery
- Pandoc 3.x: Manuscript conversion — LaTeX/Word/Markdown to HTML/PDF/EPUB; system binary, not npm

### Expected Features

Research against Cambridge Core, Perlego, VitalSource, and LiveCarta identifies a clear MVP boundary. The admin ingestion dashboard is the highest-priority internal feature — the founder must publish books without engineering help. The browser reader with math rendering and the payment checkout are the core revenue-generating user-facing features.

**Must have (table stakes):**
- Book catalog with browse and search — primary discovery path for all sales
- Book detail page with full metadata (cover, synopsis, author, TOC, ISBN, pricing) — the conversion page
- User account and authentication — required for purchase tracking and content gating
- Checkout with pay-per-book — the revenue mechanism
- My Library (purchased books view) — users must re-access what they bought
- Browser-based reader with math rendering — core value delivery for STEM
- PDF download (secured via presigned URL) — professionals expect an offline copy
- Open access book support — first-class model alongside paid
- Admin ingestion dashboard — founder-managed catalog without engineering dependency
- Schema.org Book structured data — organic SEO from day one

**Should have (competitive):**
- EPUB download — standard for e-readers; add after PDF download is stable
- Sample chapter / preview — reduces purchase hesitation; add when checkout conversion data shows need
- Reading progress tracking — add when engagement data shows return readers
- Dark mode / reading customization — add when session length signals deep engagement
- Citation export (BibTeX, APA) — low effort, high value for academic users
- Pay-per-chapter — evaluate after catalog has demand signals; conflicts with pay-per-book UX so apply per-book

**Defer (v2+):**
- In-browser highlights and bookmarks — high complexity; needs enough repeat readers to justify storage backend
- Discount codes / institutional pricing — add when first university contact approaches
- LMS integration (LTI 1.3) — only when first institutional deal is imminent
- AI recommendations — catalog needs 50+ books minimum for recommendations to be meaningful

**Explicit anti-features (do not build):**
- Author self-service upload portal — contradicts the curator model; quality control degrades
- DRM / copy-protect PDF — academic users strongly resent it; use watermarking (buyer email in PDF) instead
- Subscription / all-access model — incoherent at <20 books; revisit only after 50+ book catalog
- Offline reading mode — PDF download IS the offline solution; service worker approach is too complex

### Architecture Approach

The recommended architecture is a Next.js monolith with a strict Data Access Layer (DAL). All database reads flow through `lib/dal/` where access checks are embedded in fetch functions — not bolted on in middleware. This is the direct response to CVE-2025-29927, which demonstrated that Next.js middleware can be bypassed via header injection, making middleware-only access control insufficient for paid content. The manuscript ingest pipeline runs as offline admin scripts (`scripts/ingest/`), completely decoupled from the web application but sharing the same Prisma schema and S3 bucket.

**Major components:**
1. Catalog UI (Next.js SSG/ISR pages) — public book browsing, search, metadata display
2. Book Reader (Next.js Server Components) — access-gated chapter reading with pre-rendered KaTeX HTML
3. Data Access Layer (`lib/dal/`) — all DB queries with embedded purchase checks; cannot be bypassed
4. Stripe webhook handler (`/api/stripe/webhook/`) — sole source of truth for access grant on purchase
5. Download API (`/api/downloads/[id]/`) — purchase-verified presigned URL generation
6. Manuscript Ingest Pipeline (`scripts/ingest/`) — Pandoc + KaTeX pre-render; offline admin tool
7. Admin UI (`app/(admin)/`) — book management dashboard for founder

**Build order (dependency-driven):**
Database schema → Auth → Ingest pipeline → Catalog → Access DAL → Stripe + webhook → Reader → Downloads → Admin UI

### Critical Pitfalls

1. **Client-side math rendering** — Never ship client-side-only KaTeX/MathJax. Pre-render all math with `katex.renderToString()` at ingest time; store rendered HTML in DB. Client receives static HTML; only KaTeX CSS is loaded in the browser. Retrofitting this after launch requires re-ingesting all books.

2. **KaTeX equation cross-reference gaps** — KaTeX does not support `\label`/`\eqref` natively. Audit manuscripts for these commands before committing to KaTeX. If physics manuscripts rely heavily on numbered equation cross-references, either switch to MathJax v3 or build a custom post-processor. Decide before any rendering work begins — switching libraries requires re-ingesting all content.

3. **Stripe webhook entitlement race conditions** — Never grant access from the payment success redirect. Use webhook handler exclusively (`checkout.session.completed`). Use `upsert` with `stripeSessionId` as idempotency key. Add a polling endpoint so the reader page can wait for access grant without requiring a manual refresh. Return HTTP 200 to Stripe always, even on internal failures.

4. **Pandoc ingestion silent corruption** — Pandoc handles 80% of LaTeX well; the other 20% (custom macros, TikZ figures, theorem environments, bibliography cross-references) may fail silently. Build a manuscript validation step that outputs a "conversion health report" before ingestion. Require founder preview sign-off before any book goes live. Treat Pandoc warnings as errors requiring manual review.

5. **EU accessibility compliance (EAA effective June 28, 2025)** — EPUB files sold in the EU must meet WCAG 2.1 Level AA. Default Pandoc/LaTeX PDF output fails this. Use EPUB 3 with MathML (not images) for equations. Validate every generated EPUB with epubcheck and Ace by DAISY. Build accessibility structure (heading hierarchy, lang attributes, figure alt text) into the ingest pipeline from the start.

---

## Implications for Roadmap

Based on dependency analysis across all four research files, the architecture build order is deterministic. The ingest pipeline must produce content before the reader can show anything. Auth must exist before any user-specific data. Access control DAL must exist before gated content. Stripe must be integrated before paid content is purchasable. This constrains the phase structure significantly.

### Phase 1: Foundation and Data Schema

**Rationale:** Everything else depends on this. Database schema defines the shape of all data; auth provides the user identity that purchase records reference. No feature can be built without these.
**Delivers:** PostgreSQL schema (User, Book, Chapter, Purchase), Prisma setup, Next.js 15 project scaffold, Auth.js v5 login/signup, basic session management
**Addresses:** User account / authentication (table stakes)
**Avoids:** Schema drift by getting relational model right before any content is stored
**Research flag:** Standard patterns — well-documented Next.js + Prisma + Auth.js setup; skip phase research

### Phase 2: Manuscript Ingest Pipeline

**Rationale:** The ingest pipeline is the highest-risk dependency in the project. Every reader, catalog, and download feature depends on correctly ingested content. Building it early allows the founder to populate the catalog while other phases proceed. Math rendering library decision (KaTeX vs MathJax for cross-references) must be locked in here.
**Delivers:** Admin CLI that converts LaTeX/Word/Markdown manuscripts to pre-rendered HTML + chapters in DB, PDF/EPUB uploads to R2, cover image processing, book metadata record creation
**Addresses:** Admin ingestion pipeline (P1), KaTeX server-side pre-rendering (architecture pattern 1)
**Avoids:** Client-side math rendering pitfall, Pandoc silent corruption (validation step + founder sign-off required)
**Research flag:** Needs deeper research — LaTeX-specific packages and custom macro handling for physics manuscripts; Pandoc filter ecosystem for theorem environments

### Phase 3: Book Catalog and Discovery

**Rationale:** With content in the database, the catalog can be built against real books. This establishes the public-facing surface and enables SEO from day one. Open access books can go live here without any payment infrastructure.
**Delivers:** Book catalog page (browse, filter, search via Postgres FTS), book detail page with full metadata, Schema.org structured data, open access book reading (no gate), cover images displayed
**Addresses:** Book catalog (P1), book detail page (P1), search (P1), open access support (P1), Schema.org SEO (P1)
**Avoids:** Missing structured data at launch; catalog without covers
**Research flag:** Standard patterns — SSG pages with Postgres FTS are well-documented; skip phase research

### Phase 4: Browser Reader with Access Gating

**Rationale:** The reader is the core product. It must handle both open-access (no gate) and paid (purchase check) books. The Data Access Layer with embedded access checks is built here. This phase also surfaces any math rendering issues against real content before payment integration.
**Delivers:** Chapter reader UI with pre-rendered math display, TOC navigation, table of contents sidebar, mobile-responsive layout, DAL with purchase check (initially returning "access granted" for open-access books), chapter-by-chapter navigation
**Addresses:** Browser reader (P1), table of contents navigation (table stakes), mobile-responsive reader (table stakes)
**Avoids:** Middleware-only access control (CVE-2025-29927), client-side math rendering, fixed-layout mobile reader
**Research flag:** Standard patterns for reader UI; KaTeX CSS integration is documented; skip phase research

### Phase 5: Payments and Access Entitlement

**Rationale:** Stripe integration is the most business-critical feature but also the easiest to get wrong. Building it after the reader exists means payment can be tested against real book content. The webhook fulfillment pattern must be built correctly from the start — no retrofitting.
**Delivers:** Stripe Checkout integration, pay-per-book payment flow, webhook handler with idempotent upsert, purchase record creation, access grant to reader post-webhook, My Library (purchased books list), purchase receipt email via Resend
**Addresses:** Checkout / payment (P1), My Library (P1), purchase receipt (table stakes)
**Avoids:** Stripe redirect-based access grant, webhook race conditions, non-idempotent entitlement records
**Research flag:** Stripe webhook patterns are well-documented; idempotency implementation is standard; skip phase research

### Phase 6: Secure File Downloads

**Rationale:** PDF and EPUB downloads are blocked on: (a) files existing in R2 (from ingest pipeline), (b) purchase verification (from payment phase), and (c) presigned URL generation. This phase is short but must be done after Phases 2 and 5.
**Delivers:** Download API endpoint with purchase verification, presigned URL generation (15-minute expiry), PDF download for purchased books, rate limiting on download endpoint, watermarking (buyer email embedded in PDF)
**Addresses:** PDF download secured (P1)
**Avoids:** Public file URLs in DB, permanent download links that bypass payment
**Research flag:** Standard patterns — S3 presigned URLs are well-documented; skip phase research

### Phase 7: Admin Dashboard

**Rationale:** The ingest CLI works but the founder needs a UI for catalog management. This phase converts the CLI pipeline into a browser-based admin experience. It is lower risk because it is internal-only and non-customer-facing.
**Delivers:** Book management UI (publish/unpublish, metadata editing, cover image upload), ingestion status visibility, book preview before publish, basic analytics (downloads, reader views)
**Addresses:** Admin ingestion dashboard (P1)
**Avoids:** Founder dependency on CLI for every catalog update
**Research flag:** Standard CRUD admin patterns; skip phase research

### Phase 8: Reader Enhancements (v1.x)

**Rationale:** These features improve the reading experience and reduce checkout hesitation but are not required for revenue. Add after core product is validated with real users.
**Delivers:** Sample chapter preview (first chapter free), EPUB download, reading progress tracking, dark mode / reader font settings, citation export (BibTeX, APA), pay-per-chapter evaluation
**Addresses:** EPUB download (P2), sample chapter (P2), reading progress (P2), dark mode (P2), citation export (P2)
**Avoids:** EPUB accessibility failures (run epubcheck + Ace by DAISY on all EPUBs)
**Research flag:** EPUB generation with accessible math (MathML, not images) needs deeper research — EPUB 3 accessibility pipeline is less documented than PDF

### Phase Ordering Rationale

- Schema must precede everything: User, Book, Chapter, Purchase tables are referenced by auth, ingest, catalog, reader, and payments
- Ingest pipeline precedes catalog and reader: No content in DB means no pages to render; ingest is also where irreversible decisions (KaTeX vs MathJax) are locked
- Catalog precedes reader: Reader assumes book detail page and slug routing already exist
- Reader precedes payments: Payment integration is more valuable when tested against real content that will be gated
- Payments precede downloads: Download endpoint requires purchase verification that payment phase creates
- Admin UI follows CLI ingest: Founder can use CLI until UI is ready; CLI must work first

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Ingest Pipeline):** LaTeX-specific STEM packages (amsmath, amsthm, tikz, physics) and Pandoc filter support; custom theorem environments; bibliography handling via biblatex vs natbib; math cross-reference strategy (KaTeX vs MathJax decision needs validation against real manuscripts)
- **Phase 8 (Reader Enhancements):** EPUB 3 with MathML accessibility pipeline; epubcheck integration; accessible EPUB generation from Pandoc

Phases with standard patterns (skip phase research):
- **Phase 1 (Foundation):** Next.js + Prisma + Auth.js scaffold is extremely well-documented
- **Phase 3 (Catalog):** SSG + Postgres FTS + Schema.org is standard; no novel patterns
- **Phase 4 (Reader):** Pre-rendered HTML reader with KaTeX CSS; component patterns are standard
- **Phase 5 (Payments):** Stripe Checkout + webhook + idempotent upsert is Stripe's standard pattern
- **Phase 6 (Downloads):** S3 presigned URL flow is standard infrastructure
- **Phase 7 (Admin Dashboard):** Standard CRUD admin UI; no novel integration

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies (Next.js 15.5, Prisma 7, Tailwind 4, Auth.js 5, Stripe, R2) verified against official sources. KaTeX package identity (use `@matejmazur/react-katex`, not `react-katex`) is MEDIUM — npmjs verification needed |
| Features | MEDIUM | Table stakes verified against Cambridge Core, Perlego, VitalSource. Anti-features are pattern extrapolation from feature-creep literature, not empirical data. Pay-per-chapter demand for this specific audience is unverified |
| Architecture | HIGH | CVE-2025-29927 middleware bypass is documented fact that directly informs the DAL pattern. Webhook fulfillment pattern is Stripe-official. Presigned URL pattern is standard. Server-side KaTeX pre-rendering is verified in production by practitioner sources |
| Pitfalls | MEDIUM-HIGH | KaTeX `\label`/`\eqref` limitation confirmed via GitHub issues. EAA June 2025 effective date verified. Stripe idempotency is Stripe-official. Pandoc LaTeX conversion limitations confirmed via GitHub issue tracker |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **KaTeX vs MathJax final decision:** Audit actual manuscript samples for `\label`, `\eqref`, `\ref` usage before Phase 2. If physics manuscripts use these heavily, switch recommendation to MathJax v3 for the ingest pipeline despite the performance trade-off.
- **LaTeX package allowlist:** The specific LaTeX packages used by prospective authors (amsmath, amsthm, tikz, physics, pgfplots, etc.) are unknown. Build an explicit allowlist during Phase 2 with the first real manuscript.
- **Pay-per-chapter UX conflict:** Research flags that pay-per-chapter conflicts with pay-per-book UX. Defer to Phase 8 evaluation and decide per-book which model applies rather than supporting both simultaneously for the same title.
- **`@matejmazur/react-katex` package identity:** STACK.md notes this needs npmjs verification. Confirm the package is the active maintained fork before installing.
- **ISBN per-format requirement:** PITFALLS.md warns that separate ISBNs per format (web, PDF, EPUB) are required by retailers. Verify ISBN assignment workflow before first book goes live.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 15.5 Blog](https://nextjs.org/blog/next-15-5) — version, Node.js 20 requirement, typed routes
- [Prisma 7 Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Rust-free, MongoDB dropped
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — stable Jan 2025
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — full v4 compatibility
- [Stripe Checkout + Next.js 15](https://vercel.com/kb/guide/getting-started-with-nextjs-typescript-stripe) — payment integration pattern
- [Stripe idempotency docs](https://docs.stripe.com/api/idempotent_requests) — webhook deduplication
- [CVE-2025-29927 Next.js Middleware Bypass](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — DAL pattern rationale
- [KaTeX Node.js server-side rendering](https://katex.org/docs/node) — pre-render approach
- [KaTeX `\label`/`\eqref` limitation](https://github.com/KaTeX/KaTeX/issues/350) — cross-reference gap
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) — zero egress fees
- [Pandoc official docs](https://pandoc.org/MANUAL.html) — multi-format conversion
- [Google Book Schema structured data](https://developers.google.com/search/docs/appearance/structured-data/book) — SEO markup
- [Perlego ebook features](https://help.perlego.com/en/articles/4450175-ebook-features-and-tools) — competitor feature baseline
- [European Accessibility Act](https://publishdrive.com/accessibility-in-digital-publishing-2025-your-complete-guide-to-creating-inclusive-epubs-2.html) — June 28, 2025 effective date

### Secondary (MEDIUM confidence)
- [KaTeX vs MathJax 2025 benchmarks](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison) — performance trade-offs
- [NextAuth.js vs Clerk comparison](https://medium.com/@sagarsangwan/next-js-authentication-showdown-nextauth-free-databases-vs-clerk-vs-auth0-in-2025-e40b3e8b0c45) — auth decision rationale
- [Backend math rendering architecture](https://danilafe.com/blog/backend_math_rendering/) — practitioner validation of SSR pattern
- [Paywall architecture patterns](https://www.epublishing.com/news/2025/may/13/integrating-paywall-solutions-your-cms/) — industry reference
- [LaTeX to HTML conversion for STEM](https://lodepublishing.com/blog/converting-latex-to-html/) — ingestion pipeline patterns
- [Stripe webhook best practices](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) — practitioner post-mortem
- [Pandoc LaTeX HTML issues](https://github.com/jgm/pandoc/issues/10176) — conversion limitations

### Tertiary (LOW confidence)
- [KITABOO digital publishing](https://kitaboo.com/) — industry monetization patterns (vendor marketing)
- Anti-feature analysis — pattern extrapolation from feature-creep literature, not empirical ScienceOne data

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
