# ScienceOne

## What This Is

ScienceOne is a STEM education platform built by a university physics instructor. It combines a curated book catalog (with server-side KaTeX math rendering), a resource library (free and paid lesson plans, problem sets, lab guides), interactive physics simulations, and a blog with code highlighting. The platform sits at the intersection of physics, math, computation, and AI — targeting teachers and students from AP/K-12 through university level.

## Core Value

Educators and students can discover STEM content — books, resources, simulations, and articles — with properly rendered math, directly in their browser.

## Current State

v1.1 shipped (2026-02-22). All content types — books, resources, simulations, and blog — are live with admin management, public browsing, filtering, pagination, and cross-linking between content types.

## Requirements

### Validated

- Publisher can upload and manage books with rich metadata — v1.0
- Readers can browse the book catalog with categories and search — v1.0
- Readers can read book chapters in-browser with LaTeX math rendering — v1.0
- Readers can download books (PDF/EPUB) — v1.0
- Two monetization models: pay-per-book, open access — v1.0
- Each book has cover image, ISBN, author bio/photo, synopsis, table of contents, categories/tags, print metadata (page count, dimensions), and print purchase link — v1.0
- Multiple input formats supported for manuscript upload (LaTeX, Word, Markdown) — v1.0
- Academic citation export in BibTeX and APA formats — v1.0
- Blog with admin CRUD, public listing/filtering, article pages with SEO — v1.1
- Resource library with admin CRUD, public listing/filtering, free/paid support — v1.1
- Interactive physics simulations gallery with dynamic component loading — v1.1
- Resource purchase flow via Stripe — v1.1
- Pagination on resource and blog listing pages — v1.1
- Subject-based cross-links between blog posts, resources, and simulations — v1.1

### Active

(None — next milestone not yet defined)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Author self-service portal | Founder manages all content; curator model preserves quality |
| Mobile native app | Web-first; responsive design covers mobile |
| Real-time collaboration/editing | Publishing platform, not authoring tool |
| Subscription / all-access model | Insufficient catalog size (<20 books); revisit at 50+ |
| Pay-per-view (chapter-level purchase) | Deferred to v2; market validation needed first |
| DRM / copy protection | Academic STEM audience resents DRM |
| Social features (reviews, ratings) | STEM credibility from author reputation, not ratings |
| AI chatbot / RAG | Math content hallucinations too dangerous |
| Offline reading mode | PDF download serves the offline need |

## Context

**Tech stack:** Next.js 16, Prisma 7, Better Auth, Tailwind v4, shadcn/ui (canary), Stripe, Cloudflare R2, KaTeX, Pandoc, Resend, Shiki

**Architecture:**
- Server-side KaTeX pre-rendering at ingest time (no client-side math JS)
- Presigned R2 URLs for secure file delivery (900s expiry)
- Webhook-driven purchase entitlement (never via redirect)
- Three route groups: (main), (auth), (admin) — fully isolated layouts
- Detached process pattern for long-running ingest pipeline from browser
- Shared sanitizeHtml utility wrapping all dangerouslySetInnerHTML sites
- SSR-safe simulation loading via next/dynamic (split keys + registry)
- Offset pagination (PAGE_SIZE=12) with URL search param driven navigation

**Known tech debt:**
- In-memory rate limiter for downloads (per-process, resets on deploy)
- Purchase success page shows author byline instead of book title
- No direct preview link from admin edit page

**User setup required:**
- PostgreSQL (Docker or Neon) + run migrations
- Cloudflare R2 bucket + credentials
- Stripe keys + webhook forwarding
- Resend API key for emails
- Google OAuth credentials (optional)

## Constraints

- **Tech stack**: Next.js 16, Prisma 7, Tailwind v4 — mainstream, well-supported
- **Scale**: Handles ~20-100 books without rearchitecting
- **Math rendering**: KaTeX pre-renders complex LaTeX formulas at ingest time
- **Content protection**: Purchase-gated access via Stripe webhook + Prisma entitlement records

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Founder manages all uploads (no author portal) | Small catalog, founder controls quality | Good — admin dashboard sufficient |
| Two payment models in v1 (pay-per-book, open access) | Market experimentation priority; pay-per-view deferred | Good — simplifies v1 |
| Web-first, no native apps | Reduce complexity, reach all devices via browser | Good — responsive design works |
| Support LaTeX, Word, Markdown input formats | Authors use different tools | Good — Pandoc handles all |
| KaTeX over MathJax | Faster rendering, smaller bundle, sufficient for most math | Good — server-side pre-render eliminates client JS |
| Stripe-hosted checkout (redirect, not embedded) | Simpler integration, no @stripe/stripe-js needed | Good — less client code |
| Webhook-driven access (not redirect) | Prevents access without confirmed payment | Good — idempotent upsert pattern |
| Presigned R2 URLs for downloads | Storage keys never exposed to browser | Good — 15-min expiry |
| Detached process for ingest pipeline | Prevents API route timeout on long conversions | Good — proc.unref() pattern |
| proxy.ts + server-side session check | Defense-in-depth against auth bypass (CVE-2025-29927) | Good — Next.js 16 pattern |
| z.union for NaN-to-null Zod coercion | z.preprocess breaks @hookform/resolvers type inference in Zod 4 | Good — union preserves types |
| Shared sanitizeHtml utility for all HTML rendering | Single config, no inline sanitize-html anywhere | Good — XSS prevention centralized |
| next/dynamic for simulation loading (not React.lazy) | React.lazy causes SSR errors in App Router | Good — SSR-safe, code-split |
| Stripe webhook routes by productType metadata | Explicit intent routing, no dead-code ID-presence heuristic | Good — extensible to new product types |
| Offset pagination (not cursor) | URL-param driven filters already in place; bookmarkable | Good — simple, works with filters |
| Subject-based cross-links via Prisma join table FK filter | subjects.some.subjectId (direct FK) avoids extra join | Good — single query, no N+1 |

---
*Last updated: 2026-02-22 after v1.1 milestone completion*
