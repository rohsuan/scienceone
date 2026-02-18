# Architecture Research

**Domain:** Online STEM book publishing platform with LaTeX rendering and payment gating
**Researched:** 2026-02-18
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Catalog UI  │  │  Book Reader │  │  Checkout / Auth UI      │   │
│  │  (browse,    │  │  (chapter    │  │  (Stripe Elements,       │   │
│  │   search,    │  │   nav, math  │  │   login, account)        │   │
│  │   metadata)  │  │   display)   │  │                          │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
└─────────┼─────────────────┼──────────────────────-┼─────────────────┘
          │                 │                        │
┌─────────▼─────────────────▼────────────────────────▼─────────────────┐
│                         Next.js App (Monolith)                        │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐    │
│  │  Page/Route  │  │  API Routes  │  │  Server Components       │    │
│  │  Handlers    │  │  (purchase,  │  │  (RSC — auth-gated,      │    │
│  │  (SSR/SSG)   │  │   webhook,   │  │   content hydration)     │    │
│  │              │  │   download)  │  │                          │    │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘    │
│         │                 │                        │                  │
│  ┌──────▼─────────────────▼────────────────────────▼──────────────┐  │
│  │               Data Access Layer (DAL)                           │  │
│  │  access checks → purchase lookup → content gating              │  │
│  └───────────────────────────────────────────────────────────────-┘  │
└───────────────┬─────────────────────────────────────────────────────-┘
                │
    ┌───────────┼──────────────────────────────────┐
    │           │                                  │
┌───▼───┐  ┌────▼──────────────┐         ┌────────▼──────────────────┐
│ Neon  │  │  Object Storage   │         │   External Services       │
│  /    │  │ (S3/R2 — private  │         │                           │
│Postgres│  │  PDFs, EPUBs,     │         │  ┌────────┐  ┌─────────┐  │
│(data) │  │  cover images,    │         │  │Stripe  │  │  Email  │  │
│       │  │  source files)    │         │  │(payments│  │(Resend/ │  │
│       │  │                   │         │  │webhooks)│  │Postmark)│  │
└───────┘  └───────────────────┘         │  └────────┘  └─────────┘  │
                                         │  ┌────────────────────┐    │
                                         │  │  Manuscript Ingest │    │
                                         │  │  (offline Pandoc + │    │
                                         │  │   KaTeX pipeline)  │    │
                                         │  └────────────────────┘    │
                                         └───────────────────────────-┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Catalog UI | Browse books, search, filter, display metadata, cover, synopsis | Next.js pages with SSG/ISR |
| Book Reader | Chapter-by-chapter reading with math rendering, TOC navigation, progress | Next.js page with pre-rendered HTML + KaTeX CSS |
| Auth UI | Login, registration, account management | NextAuth.js or Clerk |
| Checkout UI | Pay-per-view and pay-per-book purchase flows | Stripe Elements or Stripe Checkout redirect |
| API Routes | Stripe webhooks, presigned URL generation, access checks | Next.js Route Handlers (App Router) |
| Data Access Layer | All DB queries with embedded access checks — never skipped | Prisma + server-side functions |
| Postgres (Neon) | Canonical store: users, books, purchases, chapters, metadata | PostgreSQL via Prisma ORM |
| Object Storage | Private binary files: PDFs, EPUBs, source manuscripts; public: cover images | AWS S3 or Cloudflare R2 |
| Stripe | Payment processing, webhook events (charge.succeeded) to update DB | Stripe Node SDK |
| Manuscript Ingest Pipeline | Offline admin tool: converts LaTeX/Word/Markdown → structured HTML + KaTeX pre-rendered math | Pandoc + custom KaTeX Node.js script |

---

## Recommended Project Structure

```
scienceone/
├── app/                        # Next.js App Router
│   ├── (catalog)/              # Public book browsing routes
│   │   ├── page.tsx            # Homepage / catalog
│   │   ├── books/[slug]/       # Book detail page
│   │   └── categories/[cat]/   # Category browse
│   ├── (reader)/               # Gated reading routes
│   │   └── books/[slug]/read/  # Reader with auth + purchase check
│   │       └── [chapter]/
│   ├── (auth)/                 # Login / signup
│   ├── (account)/              # Purchase history, downloads
│   ├── (admin)/                # Founder-only book management
│   └── api/
│       ├── stripe/
│       │   ├── checkout/       # Create checkout session
│       │   └── webhook/        # Fulfillment webhook
│       └── downloads/[id]/     # Generate presigned URL for PDF/EPUB
│
├── lib/
│   ├── dal/                    # Data Access Layer — all DB reads
│   │   ├── books.ts            # getBook(), listBooks(), etc.
│   │   ├── purchases.ts        # hasPurchasedBook(), getUserAccess()
│   │   └── users.ts
│   ├── stripe.ts               # Stripe client singleton
│   ├── s3.ts                   # S3/R2 client, presigned URL helpers
│   └── auth.ts                 # Session helpers
│
├── components/
│   ├── reader/                 # Book reader components
│   │   ├── ChapterContent.tsx  # Renders pre-built HTML with math
│   │   ├── TableOfContents.tsx
│   │   └── ReaderNav.tsx
│   ├── catalog/                # Catalog cards, search
│   └── checkout/               # Purchase buttons, access gates
│
├── prisma/
│   ├── schema.prisma           # Data model
│   └── migrations/
│
└── scripts/
    └── ingest/                 # Offline manuscript pipeline
        ├── convert.ts          # Pandoc + KaTeX rendering
        ├── import-book.ts      # Uploads content to DB + S3
        └── generate-pdf.ts     # PDF generation (if needed)
```

### Structure Rationale

- **app/(reader)/:** Separate route group isolates gated content; Server Components enforce access at render time.
- **lib/dal/:** Centralizing all DB access here means access checks cannot be bypassed — no component fetches data directly.
- **scripts/ingest/:** Manuscript processing is an admin-only offline pipeline, not a user-facing feature. Keeping it in `scripts/` prevents coupling to the web app.
- **api/stripe/webhook/:** Webhook endpoint is the single source of truth for fulfilling purchases — never trust client-side Stripe success redirects.

---

## Architectural Patterns

### Pattern 1: Server-Side Math Pre-Rendering (KaTeX)

**What:** LaTeX expressions in manuscripts are converted to HTML+CSS at ingest time using `katex.renderToString()` (Node.js). The resulting HTML is stored in the database. The reader page delivers already-rendered math — no client-side JS required for math display.

**When to use:** Always, for this domain. STEM content is math-dense; client-side rendering of 200+ equations per page is slow and blocks interactivity.

**Trade-offs:**
- Pro: Fast reader load; math identical across all browsers; no client JavaScript dependency.
- Pro: Math is accessible to screen readers via MathML output mode.
- Con: Re-ingest required if KaTeX rendering needs updating (rare).
- Con: Larger HTML stored in DB compared to raw LaTeX strings.

**Example:**
```typescript
// scripts/ingest/convert.ts
import katex from 'katex';

function renderMathInHtml(rawHtml: string): string {
  // Replace $$...$$ (display math) and $...$ (inline math)
  return rawHtml
    .replace(/\$\$(.+?)\$\$/gs, (_, tex) =>
      katex.renderToString(tex, { displayMode: true, throwOnError: false })
    )
    .replace(/\$(.+?)\$/g, (_, tex) =>
      katex.renderToString(tex, { displayMode: false, throwOnError: false })
    );
}
```

### Pattern 2: Data Access Layer with Embedded Access Checks

**What:** All data reads go through a `lib/dal/` module. Purchase checks are built into the fetch functions, not bolted on in middleware or page components.

**When to use:** Mandatory for any content with payment gating. The 2025 CVE-2025-29927 demonstrated that Next.js middleware can be bypassed via header injection — purchase enforcement must happen at the data layer.

**Trade-offs:**
- Pro: Access control cannot be accidentally omitted — it is part of getting the data.
- Pro: Works correctly in Server Components, API routes, and RSC streaming.
- Con: Slightly more verbose than ad-hoc checks.

**Example:**
```typescript
// lib/dal/purchases.ts
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getChapterContent(bookSlug: string, chapterSlug: string) {
  const session = await auth();
  if (!session?.userId) return { error: 'unauthenticated' };

  const book = await prisma.book.findUnique({ where: { slug: bookSlug } });
  if (!book) return { error: 'not_found' };

  if (book.accessModel !== 'open') {
    const purchase = await prisma.purchase.findFirst({
      where: { userId: session.userId, bookId: book.id, status: 'fulfilled' }
    });
    if (!purchase) return { error: 'not_purchased' };
  }

  return prisma.chapter.findUnique({ where: { bookId_slug: { bookId: book.id, slug: chapterSlug } } });
}
```

### Pattern 3: Stripe Webhook as Fulfillment Source of Truth

**What:** Purchase flow: user clicks buy → Stripe Checkout session created via API → user pays → Stripe sends `checkout.session.completed` webhook → webhook handler marks purchase fulfilled in DB. The client-side success redirect only shows a "thank you" page; it does not grant access.

**When to use:** Always, for any payment gating. Relying on success URL callbacks is insecure and unreliable (network drop = access never granted).

**Trade-offs:**
- Pro: Reliable — survives browser close, network failures, duplicate webhooks (idempotency).
- Pro: Secure — webhook is signed with Stripe secret; cannot be spoofed.
- Con: Small delay between payment and access (usually < 2 seconds).

**Example:**
```typescript
// app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(
    await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookId, userId, accessType } = session.metadata!;

    await prisma.purchase.upsert({
      where: { stripeSessionId: session.id },
      create: { userId, bookId, accessType, status: 'fulfilled', stripeSessionId: session.id },
      update: { status: 'fulfilled' },
    });
  }

  return new Response('ok');
}
```

### Pattern 4: Presigned URLs for File Downloads

**What:** PDF and EPUB files live in a private S3/R2 bucket. When a user with a valid purchase requests a download, the API checks the purchase, then generates a short-lived presigned URL (15 minutes) and redirects the browser to it.

**When to use:** Always for downloadable paid content. Never store public S3 URLs.

**Trade-offs:**
- Pro: Files are never publicly accessible; download links expire.
- Pro: No bandwidth cost to the app server — S3 streams directly to user.
- Con: Slightly more complex than a direct file URL.

### Pattern 5: Pandoc-Based Manuscript Ingest Pipeline

**What:** An offline admin script accepts LaTeX, Word (DOCX), or Markdown files and converts them to structured HTML via Pandoc. Math is then pre-rendered with KaTeX. The resulting HTML is chunked into chapters and stored in Postgres.

**When to use:** Every time a new book is added to the catalog. Not user-facing.

**Trade-offs:**
- Pro: Single pipeline handles all three input formats (LaTeX, Word, Markdown).
- Pro: Pandoc is battle-tested for document conversion; LaTeX→HTML math passthrough works well.
- Con: Pandoc requires a system installation (not a pure Node.js solution).
- Con: Complex LaTeX macros or custom packages may require manual cleanup after conversion.

---

## Data Flow

### Reader Content Flow (most critical path)

```
User visits /books/[slug]/read/[chapter]
    ↓
Next.js Server Component renders
    ↓
lib/dal/purchases.ts: getChapterContent(slug, chapter)
    ├── auth() → check session
    ├── prisma.book.findUnique → load book + access model
    ├── prisma.purchase.findFirst → verify user has fulfilled purchase (if not open access)
    └── prisma.chapter.findUnique → return pre-rendered HTML
    ↓
Server Component renders HTML (math already rendered as HTML+CSS from KaTeX)
    ↓
Browser displays page — no JS needed for math
KaTeX CSS loaded from CDN for font/style only
```

### Purchase Flow

```
User clicks "Buy Book" ($X)
    ↓
POST /api/stripe/checkout
    → Create Stripe Checkout Session with bookId, userId in metadata
    → Return session URL
    ↓
Browser redirects to Stripe-hosted checkout
    ↓
User pays
    ↓
Stripe → POST /api/stripe/webhook (checkout.session.completed)
    → Verify Stripe signature
    → Upsert Purchase record (status: fulfilled)
    ↓
User redirected to /books/[slug] with success message
    ↓
Next visit to /books/[slug]/read → DAL finds purchase → access granted
```

### Download Flow

```
User clicks "Download PDF"
    ↓
GET /api/downloads/[bookId]?format=pdf
    ↓
API Route:
    1. auth() → verify session
    2. DAL: hasPurchasedBook(userId, bookId) → must be true
    3. s3.getSignedUrl(fileKey, 900) → 15-minute presigned URL
    4. return 302 redirect to presigned URL
    ↓
Browser fetches PDF directly from S3/R2
```

### Manuscript Ingest Flow (admin, offline)

```
Admin provides: manuscript file (LaTeX/DOCX/MD) + metadata JSON
    ↓
scripts/ingest/convert.ts
    → pandoc -f [format] -t html → raw HTML
    → Split HTML into chapters by heading structure
    → For each chapter: renderMathInHtml() with KaTeX
    → Validate output
    ↓
scripts/ingest/import-book.ts
    → Create Book record in Postgres (metadata, slug, access model, price)
    → Create Chapter records (slug, title, pre-rendered HTML, order)
    → Upload PDF/EPUB to private S3 bucket
    → Upload cover image to public S3/CDN path
    ↓
Book is live in catalog
```

---

## Database Schema (Core Tables)

```
User
  id, email, passwordHash, createdAt

Book
  id, slug, title, subtitle, authorName, authorBio
  synopsis, coverImageUrl, isbn, categories[]
  publishedAt, printInfo
  accessModel: enum(open | pay_per_view | pay_per_book)
  price: decimal (null if open)
  pdfFileKey, epubFileKey  ← S3 object keys, never public URLs

Chapter
  id, bookId → Book, slug, title, order, htmlContent, wordCount

Purchase
  id, userId → User, bookId → Book
  accessType: enum(book | chapter)
  chapterId → Chapter (nullable, for pay-per-view)
  status: enum(pending | fulfilled | refunded)
  stripeSessionId (unique — idempotency key)
  createdAt, fulfilledAt
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-20 books, <1k users | Single Next.js monolith on Vercel + Neon (free tier). No special caching needed. |
| 20-100 books, 1k-10k users | Add ISR for catalog pages. Consider Redis for session caching if auth latency shows. Keep monolith. |
| 100k+ users | CDN edge caching for catalog and reader HTML. Read replica for Postgres. Potential chapter HTML caching in Redis or edge KV. |

### Scaling Priorities

1. **First bottleneck — DB reads on reader pages:** Each chapter load hits Postgres for the purchase check + chapter HTML. Add ISR with per-user cache revalidation or move chapter HTML to Vercel KV/Redis at ~10k daily active readers.
2. **Second bottleneck — S3 download throughput:** At high volume, use Cloudflare R2 (no egress fees) instead of AWS S3. Switch is a one-line config change if abstracted behind `lib/s3.ts`.

---

## Anti-Patterns

### Anti-Pattern 1: Middleware-Only Access Control

**What people do:** Gate all reading routes in Next.js middleware with a session check, assuming middleware is sufficient.

**Why it's wrong:** CVE-2025-29927 (March 2025) showed that Next.js middleware can be bypassed by adding the `x-middleware-subrequest` header. Additionally, middleware runs on Edge Runtime with no direct database access, making purchase verification impossible there.

**Do this instead:** Use Server Components and the Data Access Layer for all access checks. Middleware can redirect unauthenticated users to login, but it cannot be the only check for purchased content.

### Anti-Pattern 2: Client-Side Math Rendering for Math-Dense Content

**What people do:** Load MathJax or KaTeX on the client and render LaTeX strings that are stored in the database on every page view.

**Why it's wrong:** STEM books commonly have 100-300 equations per chapter. Client-side rendering stalls interactivity for 1.8-4+ seconds per page load (KaTeX 1.8s, MathJax 4.2s in 2025 benchmarks with 500 equations). Mobile and low-power devices are disproportionately impacted.

**Do this instead:** Pre-render all math to HTML at ingest time with `katex.renderToString()`. Store rendered HTML in DB. Serve static HTML — only KaTeX CSS (not JS) is needed on the client.

### Anti-Pattern 3: Storing Public File URLs in the Database

**What people do:** Upload PDFs/EPUBs to S3 with public access and store the full URL in the database.

**Why it's wrong:** Any user who extracts the URL from the DOM or network request can share or access paid content without paying. Public URLs do not expire.

**Do this instead:** Store only the S3 object key (e.g., `books/calculus-one/calculus-one.pdf`) in the database. Generate presigned URLs (15-minute expiry) at download time, after verifying purchase.

### Anti-Pattern 4: Trusting Stripe Success Redirects for Access Grant

**What people do:** Mark a purchase as fulfilled when the browser lands on the Stripe success URL (`?session_id=xxx`).

**Why it's wrong:** Success redirects can be manipulated, missed (network drop), or replayed. If the server grants access based on the redirect, purchases can be faked.

**Do this instead:** Fulfill purchases exclusively in the Stripe webhook handler (`checkout.session.completed`). Use `upsert` with `stripeSessionId` as the idempotency key to safely handle duplicate webhook deliveries.

### Anti-Pattern 5: Single Manuscript Format Support

**What people do:** Build the ingest pipeline for LaTeX only (the "obvious" format for STEM), then discover authors submit DOCX files.

**Why it's wrong:** The project explicitly targets multiple input formats (LaTeX, Word, Markdown). Building format-specific parsers is expensive to maintain.

**Do this instead:** Use Pandoc as the universal converter for all three formats. All paths produce the same intermediate HTML. KaTeX rendering is applied to the HTML regardless of source format.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Stripe | REST API (SDK) + webhook (signed POST) | Use `stripe.webhooks.constructEvent()` to verify signatures. Never trust client |
| AWS S3 / Cloudflare R2 | AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | R2 is S3-compatible; prefer R2 for zero egress fees |
| Pandoc | CLI invocation via `node-pandoc` npm wrapper or `child_process.exec` | Pandoc must be installed on the machine running ingest scripts |
| KaTeX | Node.js npm package (`katex`) — `renderToString()` at ingest time | CSS served from CDN on client (`katex/dist/katex.min.css`) |
| Email (Resend or Postmark) | REST API, triggered from webhook handler | Send purchase confirmation after fulfillment |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client UI ↔ Next.js Server | HTTP (RSC protocol / fetch) | Server Components fetch directly; Client Components use fetch/SWR |
| Next.js ↔ Postgres | Prisma ORM (connection pooled via PgBouncer/Neon pooler) | Use Neon's connection pooler for serverless functions |
| Next.js ↔ S3 | AWS SDK v3 — only from server-side code | Never expose AWS credentials to client |
| Next.js ↔ Stripe | Stripe Node SDK — server-side only; Stripe.js client for payment UI | Stripe secret key stays server-side |
| Ingest Scripts ↔ Next.js App | Shared Prisma schema + S3 bucket | Scripts write to same DB the app reads from; no runtime coupling |

### Build Order Implications

Components must be built in dependency order:

```
1. Database schema (Prisma)          ← Foundation for everything
      ↓
2. Auth (login/session)              ← Required before any user-specific data
      ↓
3. Manuscript ingest pipeline        ← Must produce content before reader can show anything
      ↓
4. Catalog (book browsing)           ← Can show open-access content; no payment needed
      ↓
5. Access control DAL                ← Required before any gated content
      ↓
6. Stripe integration + webhook      ← Required before paid content is purchasable
      ↓
7. Book reader (gated chapters)      ← Requires access DAL + content in DB
      ↓
8. Download endpoint (presigned URL) ← Requires purchase verification + S3 files
      ↓
9. Admin UI (book management)        ← Quality-of-life; ingest can use CLI until then
```

---

## Sources

- [KaTeX Node.js server-side rendering](https://katex.org/docs/node) — HIGH confidence (official docs)
- [KaTeX vs MathJax 2025 benchmarks](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison) — MEDIUM confidence (third-party benchmark)
- [Backend math rendering architecture](https://danilafe.com/blog/backend_math_rendering/) — MEDIUM confidence (practitioner article, verified approach)
- [CVE-2025-29927: Next.js Middleware Bypass](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — HIGH confidence (official CVE documentation)
- [Next.js Authorization patterns (Robin Wieruch)](https://www.robinwieruch.de/next-authorization/) — MEDIUM confidence (practitioner, widely cited)
- [Stripe Checkout + Next.js 15 integration](https://vercel.com/kb/guide/getting-started-with-nextjs-typescript-stripe) — HIGH confidence (Vercel official)
- [Presigned URLs for secure S3 downloads](https://neon.com/guides/next-upload-aws-s3) — MEDIUM confidence (Neon official guide)
- [Pandoc universal document converter](https://pandoc.org/MANUAL.html) — HIGH confidence (official docs)
- [Paywall architecture patterns (ePublishing)](https://www.epublishing.com/news/2025/may/13/integrating-paywall-solutions-your-cms/) — MEDIUM confidence (industry publication)
- [LaTeX to HTML conversion for STEM books](https://lodepublishing.com/blog/converting-latex-to-html/) — MEDIUM confidence (practitioner article)

---
*Architecture research for: Online STEM book publishing platform (ScienceOne)*
*Researched: 2026-02-18*
