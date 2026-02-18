# Stack Research

**Domain:** Online STEM book publishing platform (math/physics, pay-per-view/book, browser reading + downloads)
**Researched:** 2026-02-18
**Confidence:** MEDIUM-HIGH (core stack HIGH, some library versions MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5 | Full-stack framework, routing, SSR/SSG, API routes | App Router + React Server Components deliver fast page loads for content-heavy book pages; SSG for public catalog, SSR for gated content; single framework for frontend and backend eliminates separate API service; Node.js middleware now stable in 15.5 |
| TypeScript | 5.9.x | Type safety across stack | Required for Prisma 7's 70% faster type checking; Next.js 15.5 adds stable typed routes that catch broken links at compile time — critical for a book catalog with many dynamic routes |
| PostgreSQL | 16 (via Neon) | Primary database | Handles relational data (books, users, purchases, access rights) with JSONB for flexible book metadata (TOC, print info); full-text search built-in for catalog search; Neon serverless removes ops burden at low book counts |
| Prisma | 7.x | ORM + schema management | The Rust-free rewrite ships 90% smaller bundles and 3× faster queries; generated code lives in project source (visible to editors); type-safe queries prevent class of bugs where wrong user gets wrong book content |
| Tailwind CSS | 4.x | Styling | v4 stable since Jan 2025; automatic content detection, 100× faster incremental builds; OKLCH colors; shadcn/ui fully updated for v4 — significant DX win for a small team |
| shadcn/ui | latest | Component library | Unstyled-by-default, ships as source not dependency, updated for Tailwind v4 and React 19; avoids upgrade lock-in; provides Dialog, Sheet, Tabs, Accordion out of box (all useful for book browsing UI) |

### Math Rendering

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| KaTeX | 0.16.x | LaTeX math rendering in browser | Synchronous rendering (no layout reflow), smallest bundle size (~280KB), fastest font loading; for a reading experience where pages may contain dozens or hundreds of inline formulas, KaTeX's synchronous render is critical for scroll performance |
| react-katex (`@matejmazur/react-katex`) | 3.x | React wrapper for KaTeX | Provides `<InlineMath>` and `<BlockMath>` components with error handling via `renderError` prop; actively maintained; the `@matejmazur` fork is the correct current package (not the unmaintained `react-katex` package) |

**KaTeX vs MathJax decision:** KaTeX wins for this use case. MathJax 3 has closed the performance gap and offers better accessibility and broader LaTeX support, but KaTeX's synchronous rendering prevents layout shift on formula-heavy pages — a STEM reading experience problem that MathJax's async approach cannot avoid. The LaTeX command coverage of KaTeX (0.16.x) is sufficient for university-level mathematics and physics textbooks. If a specific book uses unsupported commands, flag it at ingest time.

### Manuscript Ingestion & File Generation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Pandoc | latest (3.x) | Convert LaTeX / Word / Markdown → HTML + PDF + EPUB | The universal markup converter; handles all three input formats; produces HTML for web reading, PDF for download, EPUB for e-reader download; run server-side via Node.js `child_process` or as a background job; no JavaScript equivalent matches its quality for LaTeX source |
| node-pandoc | 0.3.x | Node.js wrapper for Pandoc CLI | Thin bridge between Pandoc CLI and Node.js; avoids manual `child_process` shell command construction; sanitize all inputs before passing to CLI |

**Pandoc must be installed on the server** (not an npm package). On Vercel, run Pandoc in a separate background job service (e.g., a small Railway/Fly.io worker) since Vercel serverless functions cannot run arbitrary system binaries.

### Payments

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe | latest SDK (`stripe` npm) | All payment processing | Handles all three monetization models natively: (1) `payment_intent` for one-time pay-per-view or pay-per-book, (2) `checkout.session` for frictionless hosted checkout, (3) `subscription` for future open-access institutional subscriptions; 135+ currencies; built-in webhook delivery for granting book access post-payment |
| `@stripe/stripe-js` | latest | Client-side Stripe.js | Tokenizes card data client-side (PCI compliance); powers Stripe Elements/Checkout embed |

**Payment model mapping:**
- **Pay-per-view** (individual chapter): Stripe Payment Intent via Checkout Session, price per chapter
- **Pay-per-book** (full book): Stripe Checkout Session, one-time price per book
- **Open access**: No payment gate; content publicly accessible; Stripe not involved

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NextAuth.js (Auth.js) | 5.x | User authentication | Open source, zero per-MAU cost, owns user data in your own Postgres database via Prisma adapter; free is the right call at under 20 books and early reader counts; Clerk's free tier covers 10,000 MAU but adds per-user cost at scale and creates vendor dependency for core auth data |

**NextAuth.js vs Clerk decision:** Clerk's DX is superior (30-minute setup) and its free tier covers early scale. However, for a platform where access rights are tied to purchases stored in your database, you want auth tokens in the same database as purchase records — NextAuth.js Prisma adapter achieves this cleanly. Clerk's dev experience advantage does not outweigh data ownership for a transactional publishing platform. Use Auth.js v5 (NextAuth v5), which has full App Router support.

### File Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloudflare R2 | — | Store PDFs, EPUBs, cover images, manuscripts | S3-compatible API, zero egress fees ($0 vs AWS S3's $0.09/GB), $0.015/GB/month storage; for a platform serving large PDF downloads repeatedly, zero egress fees directly reduce operating cost; use `@aws-sdk/client-s3` with R2 endpoint — no proprietary SDK needed |
| `@aws-sdk/client-s3` | 3.x | S3-compatible R2 client | Standard AWS SDK v3 works with R2 via custom endpoint; use `@aws-sdk/s3-request-presigner` for signed download URLs (time-limited access to purchased content) |

### Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Resend | latest (`resend` npm) | Transactional emails | Purchase confirmations, access links, account verification; integrates with React Email for template design; works natively in Next.js Server Actions; generous free tier (3,000 emails/month); confirmed active as of late 2025 |
| `@react-email/components` | latest | Email templates as React components | Design purchase receipts and access emails in React; rendered server-side before sending via Resend |

### Search

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL full-text search | built-in | Book catalog search | At 20-100 books, Postgres FTS via Prisma `$queryRaw` is entirely sufficient; no external search service needed; `tsvector` columns on book title, author, synopsis, and category; avoids Algolia/Meilisearch infrastructure and cost at this scale |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-pdf` (wojtekmaj) | 9.x | Render PDF pages in browser | In-browser PDF preview before download; uses PDF.js under the hood; use when showing a preview of book layout |
| `react-reader` | latest | Render EPUB files in browser | In-browser EPUB reading powered by epub.js; when providing browser-based EPUB reading (vs. download-only) |
| `remark` + `remark-math` + `rehype-katex` | latest | Parse and render Markdown with math | For Markdown-sourced manuscripts being displayed as web content; the remark/rehype pipeline handles `$...$` math blocks and renders via KaTeX server-side |
| `zod` | 3.x | Runtime validation | Validate all incoming form data (checkout, manuscript metadata), API payloads, and Stripe webhook payloads; works with Next.js Server Actions |
| `lucide-react` | latest | Icon library | Default icon set for shadcn/ui; consistent with component library |
| `next-safe-action` | 7.x | Type-safe Next.js Server Actions | Validates inputs with Zod before Server Action runs; pairs well with book purchase flows and admin ingest operations |
| `sharp` | 0.33.x | Server-side image processing | Optimize cover images at ingest; generate thumbnails; resize to standard dimensions; required by Next.js `<Image>` in production |

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Linting + formatting | Next.js 15.5 deprecated `next lint`; new projects now offer Biome as the fast alternative to ESLint+Prettier; single tool replaces two |
| Vitest | Unit + integration testing | Faster than Jest for TypeScript projects; works well with Next.js App Router |
| Playwright | End-to-end testing | Browser automation for purchase flows and reading experience |

---

## Installation

```bash
# Core framework
npx create-next-app@latest scienceone --typescript --tailwind --app

# Math rendering
npm install katex @matejmazur/react-katex

# ORM + database client
npm install prisma@latest @prisma/client@latest
npx prisma init

# Payments
npm install stripe @stripe/stripe-js

# Auth
npm install next-auth@latest @auth/prisma-adapter

# File storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage

# Email
npm install resend @react-email/components

# Markdown pipeline (for Markdown-sourced books)
npm install remark remark-math rehype-katex unified

# Validation + server actions
npm install zod next-safe-action

# Supporting
npm install sharp lucide-react react-pdf react-reader

# UI components (installed via CLI, not npm directly)
npx shadcn@latest init
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Remix | If you need finer-grained request/response control; Remix's loader model is elegant but its ecosystem and serverless deployment story is less mature than Next.js for Vercel |
| Prisma 7 | Drizzle ORM | Drizzle is leaner and faster for read-heavy workloads; choose Drizzle if the team prefers SQL-like syntax and wants no migration tooling opinions; Prisma wins on DX and tooling completeness for a content platform |
| KaTeX | MathJax 3 | Choose MathJax if manuscripts require heavy use of `\label`/`\eqref` cross-references or accessibility is a top-tier concern (MathJax's screen-reader support is substantially better); KaTeX wins on performance for scroll-heavy reading |
| NextAuth.js | Clerk | Choose Clerk if you want fastest possible auth implementation and don't mind per-MAU pricing; Clerk is genuinely faster to set up and its pre-built UI components are polished |
| Cloudflare R2 | AWS S3 | Choose S3 if you're already deep in the AWS ecosystem and need S3 Event Notifications or Intelligent-Tiering; R2 wins for a greenfield project due to zero egress fees |
| Neon (PostgreSQL) | Supabase | Choose Supabase if you want built-in auth, realtime, and storage as a bundle; for ScienceOne, each of these is handled by dedicated best-in-class tools, so Neon's pure Postgres focus is cleaner |
| Resend | SendGrid | Choose SendGrid for high-volume marketing emails; Resend wins on DX and React Email integration for transactional use |
| Pandoc (system binary) | pdf-lib / jsPDF | Use pdf-lib for generating simple data PDFs (invoices); Pandoc is the only viable option for producing publication-quality PDFs from LaTeX source |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-katex` (original npm package) | The `react-katex` npm package is unmaintained (last published 2019); the ecosystem has moved to `@matejmazur/react-katex` which is the active fork | `@matejmazur/react-katex` |
| MathJax for all rendering | Async rendering causes layout shift on formula-dense pages; larger bundle; more complex setup | KaTeX for browser rendering; MathJax only if specific LaTeX commands are unsupported by KaTeX |
| Algolia / Meilisearch | Full external search service is unnecessary at 20-100 books; adds infrastructure, cost, and sync complexity | Postgres full-text search via `tsvector` |
| MongoDB | Prisma 7 drops MongoDB support entirely; also, book/chapter/purchase relationships are strongly relational — document store is a poor fit | PostgreSQL |
| AWS S3 (direct) | Egress fees at $0.09/GB become significant as PDF/EPUB download volume grows | Cloudflare R2 (zero egress, S3-compatible) |
| Pages Router (Next.js) | App Router is now the standard; Pages Router will not receive new features; Server Components and Server Actions in App Router significantly simplify gated content patterns | App Router exclusively |
| Redux | Over-engineered state management for this domain; book reading state and purchase state fit in URL params, React context, and React Query | Zustand (if needed) or React Context + Server Components |
| PDFMake / jsPDF for book PDFs | JavaScript-native PDF libraries cannot produce publication-quality math typesetting from LaTeX source | Pandoc with LaTeX backend (pdflatex/xelatex) |
| Auth0 | Expensive at scale ($240/month for 1,000 MAU on pro plan); adds external dependency for a core product feature without DX advantage over NextAuth.js | NextAuth.js v5 |

---

## Stack Patterns by Variant

**If manuscript is LaTeX source:**
- Ingest path: LaTeX file → Pandoc → HTML (with math as KaTeX expressions) + PDF (via LaTeX → pdflatex) + EPUB
- Display path: Server-rendered HTML with KaTeX CSS; KaTeX renders inline in browser for dynamic content
- Because Pandoc's LaTeX parser is the most complete available; pdflatex produces publication-grade PDF

**If manuscript is Word (.docx):**
- Ingest path: DOCX → Pandoc → Markdown → HTML + PDF + EPUB
- Math in Word documents typically requires manual review/correction post-conversion
- Because Word's math format (OMML) converts imperfectly; plan for editorial review step

**If manuscript is Markdown:**
- Ingest path: Markdown → remark (with remark-math) → rehype-katex → HTML; Pandoc for PDF/EPUB
- Because remark/rehype pipeline is fast and integrates directly with Next.js MDX processing

**If open-access book:**
- No Stripe integration; content served directly without purchase check
- Still requires user account for download tracking and analytics
- Because the platform needs to know who downloaded what for reporting, even for free books

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15.5 | React 19, Node.js 20.19+ | Node.js 18 NOT supported by Next.js as of 2025; use Node.js 20 minimum |
| Prisma 7.x | PostgreSQL 14-16; NOT MongoDB | MongoDB support dropped in Prisma 7; use Prisma 6 if MongoDB required |
| Tailwind CSS 4.x | shadcn/ui (all components updated) | Existing Tailwind v3 projects need migration; new projects start v4 |
| KaTeX 0.16.x | `@matejmazur/react-katex` 3.x | KaTeX CSS must be imported separately (`import 'katex/dist/katex.min.css'`) |
| Auth.js 5.x | Next.js App Router | v4 (NextAuth.js 4) uses Pages Router patterns; v5 is required for App Router |
| `@aws-sdk/client-s3` v3 | Cloudflare R2 | Pass `endpoint: 'https://<accountid>.r2.cloudflarestorage.com'` to S3Client constructor |

---

## Sources

- [Next.js 15.5 Blog](https://nextjs.org/blog/next-15-5) — Version confirmed 15.5 (Aug 2025), Node.js middleware stable, typed routes stable — HIGH confidence
- [Prisma 7 Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Rust-free, stable Nov 2025, MongoDB dropped — HIGH confidence
- [KaTeX Official Docs / Libraries](https://katex.org/docs/libs) — React wrappers listed; `@matejmazur/react-katex` as active package — MEDIUM confidence (npmjs showed react-katex v3.1.0 but package identity needed verification)
- [KaTeX vs MathJax Comparison (BigGo, Nov 2025)](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison) — Performance and feature tradeoffs — MEDIUM confidence
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Stable Jan 22, 2025 — HIGH confidence
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Full v4 compatibility confirmed — HIGH confidence
- [Stripe SaaS Docs](https://docs.stripe.com/saas) — All three payment models supported — HIGH confidence
- [NextAuth.js vs Clerk comparison (Medium)](https://medium.com/@sagarsangwan/next-js-authentication-showdown-nextauth-free-databases-vs-clerk-vs-auth0-in-2025-e40b3e8b0c45) — Cost and DX tradeoffs — MEDIUM confidence
- [Neon Pricing Docs](https://neon.com/docs/introduction/plans) — Launch plan $19/month, compute dropped 15-25% Oct 2025 — HIGH confidence
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) — Zero egress, $0.015/GB/month storage — HIGH confidence
- [Pandoc Official](https://pandoc.org/) — Universal converter, LaTeX/DOCX/Markdown → HTML/PDF/EPUB — HIGH confidence
- [Resend + Next.js Docs](https://resend.com/docs/send-with-nextjs) — App Router + Server Actions integration confirmed — HIGH confidence

---

*Stack research for: ScienceOne — online STEM book publishing platform*
*Researched: 2026-02-18*
