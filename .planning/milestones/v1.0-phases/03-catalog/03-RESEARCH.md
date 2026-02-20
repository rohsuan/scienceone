# Phase 3: Catalog and Discovery - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router catalog UI, Prisma search/filter, Schema.org JSON-LD, sample chapter access
**Confidence:** HIGH — verified against Next.js 16.1.6 official docs, Prisma docs, Schema.org spec

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Book Detail Page layout:** Cover left, info right — classic two-column structure (like Amazon book pages)
- **Pricing/access display:** Subtle — price shown but not dominant; focus on the book content, purchase is secondary
- **Author section:** Minimal — name and one-liner affiliation, not a full bio with photo

### Claude's Discretion

- Catalog browsing: layout style, card content, filtering pattern, page header
- Book detail page: TOC display approach
- Search: behavior type, placement, result display, empty states
- Sample chapter: presentation mode, upsell approach, sample scope
- All empty states and loading states
- SEO structured data implementation details

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | User can browse book catalog with category filters and sorting | searchParams-driven server component filtering via Prisma `where` + `orderBy`; client filter bar uses `useRouter.replace()` to update URL |
| CAT-02 | User can view book detail page with cover, synopsis, author bio/photo, table of contents, ISBN, pricing, and print metadata | Dynamic route `app/catalog/[slug]/page.tsx`; data fetched server-side via Prisma by slug; cover via R2 URL field |
| CAT-03 | User can search catalog by title, author, and subject | Prisma `OR` + `contains` with `mode: 'insensitive'` across `title`, `authorName`, and `categories.name`; search input debounced with `use-debounce` |
| CAT-04 | User can preview a sample chapter before purchasing | Public route `app/catalog/[slug]/preview/page.tsx`; renders `isFreePreview: true` chapter(s); no auth required |
| CAT-05 | Book pages include Schema.org Book structured data for SEO | JSON-LD `<script type="application/ld+json">` in server component page body; `generateMetadata` for `<head>` meta tags |
</phase_requirements>

---

## Summary

Phase 3 is a pure Next.js App Router phase — server components, URL-driven state, Prisma queries, and SEO markup. No new npm packages are required except `use-debounce` for the search input debounce. The stack is already proven in phases 1 and 2.

The catalog page (`/catalog`) is a server component page that reads `searchParams` for filter, sort, and search state, queries Prisma, and renders results. Client-side filtering components (category buttons, sort selector, search input) update the URL via `useRouter.replace()`, which triggers a server re-render with fresh data. This is the standard Next.js 15 App Router pattern for data-driven catalog pages — no client-state libraries needed.

Book detail pages (`/catalog/[slug]`) use `generateMetadata` for dynamic `<head>` meta tags and include an inline JSON-LD `<script>` for Schema.org Book structured data. The sample chapter preview (`/catalog/[slug]/preview`) is a public route rendering the chapter with `isFreePreview: true` — no auth middleware is needed because chapters are stored as pre-rendered HTML from Phase 2.

**Primary recommendation:** Build catalog → detail → preview in that order. Each builds on the data layer established in Phase 2. The entire phase works within existing tech — no new architectural decisions required.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Page routing, server components, searchParams, generateMetadata | Project standard; verified in official docs |
| Prisma Client | 7.4.0 | Book/chapter/category queries with filtering and sorting | Project standard; Phase 2 established patterns |
| shadcn/ui | New York style | Card, Badge, Input, Button, Separator components for catalog UI | Already installed; design system in place |
| lucide-react | 0.574.0 | Icons (search, filter, chevron, open-access indicator) | Already installed |
| Tailwind CSS v4 | current | Layout, responsive grid, spacing | Project standard |

### Supporting (new install required)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | 10.1.0 | Debounce search input before URL update | Search input in catalog filter bar to avoid thrashing server |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `use-debounce` | Manual `setTimeout` ref | `use-debounce` is 1.6 kB and handles cleanup; no reason to hand-roll |
| URL-based filter state | React state (useState) | URL state is shareable, bookmarkable, and works with browser back/forward; no reason to use component state |
| Inline JSON-LD script tag | `schema-dts` npm package | `schema-dts` adds type safety but is an extra dep; for a single Book type, inline object is simpler and Next.js docs show this pattern |

**Installation:**
```bash
npm install use-debounce
```

---

## Architecture Patterns

### Recommended Route Structure

```
src/app/(main)/
├── catalog/
│   ├── page.tsx              # CAT-01: catalog listing with filters + search
│   ├── loading.tsx           # skeleton grid while server fetches
│   ├── [slug]/
│   │   ├── page.tsx          # CAT-02: book detail, CAT-05: JSON-LD
│   │   ├── loading.tsx       # skeleton detail layout
│   │   └── preview/
│   │       └── page.tsx      # CAT-04: sample chapter (public, no auth)
src/components/catalog/
│   ├── BookCard.tsx           # reusable card for catalog grid
│   ├── CatalogFilters.tsx     # client component: category + sort controls
│   ├── SearchInput.tsx        # client component: debounced search
│   ├── BookCoverImage.tsx     # cover image with fallback placeholder
│   ├── CategoryBadge.tsx      # pill badge for categories
│   └── TableOfContents.tsx    # TOC accordion/list for detail page
src/lib/
│   ├── book-queries.ts        # server-side Prisma query helpers
```

### Pattern 1: searchParams-Driven Server Catalog Page (CAT-01, CAT-03)

The catalog page is an async server component. It receives `searchParams` as a Promise (Next.js 15+) and awaits it to extract filter/sort/search values, then passes them to Prisma.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
// app/(main)/catalog/page.tsx
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { category, sort = 'title', q = '' } = await searchParams

  const books = await prisma.book.findMany({
    where: {
      isPublished: true,
      ...(category ? {
        categories: { some: { category: { slug: String(category) } } }
      } : {}),
      ...(q ? {
        OR: [
          { title: { contains: String(q), mode: 'insensitive' } },
          { authorName: { contains: String(q), mode: 'insensitive' } },
          { categories: { some: { category: { name: { contains: String(q), mode: 'insensitive' } } } } },
        ]
      } : {}),
    },
    orderBy: sort === 'author' ? { authorName: 'asc' }
            : sort === 'date'  ? { createdAt: 'desc' }
            :                    { title: 'asc' },
    include: { categories: { include: { category: true } }, pricing: true },
  })

  return <CatalogGrid books={books} />
}
```

**Key constraint:** `searchParams` in Next.js 15+ is a Promise — must be awaited. Using it opts the page into dynamic rendering (no static caching), which is correct for a filterable catalog.

### Pattern 2: Client Filter Bar Updates URL (CAT-01)

The filter/search components are client components that write to the URL. The server page reads from it. No shared state needed.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-router
// components/catalog/CatalogFilters.tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, 300)

  return <Input onChange={(e) => handleSearch(e.target.value)} />
}
```

**Important:** Client components using `useSearchParams` must be wrapped in `<Suspense>` at their usage site to avoid the "Missing Suspense boundary" build error.

### Pattern 3: Dynamic Book Detail Page with Metadata (CAT-02, CAT-05)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// app/(main)/catalog/[slug]/page.tsx

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) return {}
  return {
    title: book.title,
    description: book.synopsis ?? undefined,
    openGraph: {
      title: book.title,
      description: book.synopsis ?? undefined,
      images: book.coverImage ? [book.coverImage] : [],
    },
  }
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: book.authorName },
    isbn: book.isbn,
    numberOfPages: book.pageCount,
    description: book.synopsis,
    publisher: { '@type': 'Organization', name: 'ScienceOne' },
    url: `https://scienceone.com/catalog/${book.slug}`,
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* detail page content */}
    </div>
  )
}
```

### Pattern 4: Public Sample Chapter Route (CAT-04)

```typescript
// app/(main)/catalog/[slug]/preview/page.tsx
// No auth check — publicly accessible by design (CAT-04 requires no account)

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const book = await prisma.book.findUnique({
    where: { slug, isPublished: true },
    include: {
      chapters: {
        where: { isFreePreview: true },
        orderBy: { position: 'asc' },
        take: 1,  // first free preview chapter
      },
    },
  })
  if (!book) notFound()
  const chapter = book.chapters[0]
  if (!chapter) notFound()

  return (
    // Render chapter.content (pre-rendered KaTeX HTML from Phase 2)
    // End with upsell section pointing to book detail page
    <div>
      <div dangerouslySetInnerHTML={{ __html: chapter.content ?? '' }} />
      {/* end-of-sample upsell */}
    </div>
  )
}
```

**Key note:** `chapter.content` is pre-rendered KaTeX HTML from Phase 2. No additional math rendering needed at display time.

### Pattern 5: Prisma Multi-field Search (CAT-03)

For a catalog with fewer than 20 books, PostgreSQL `ILIKE` via Prisma `contains` + `mode: 'insensitive'` is the correct tool. Full-text search (`tsquery`/`tsvector`) is overkill and still a preview feature in Prisma.

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search
// Searching title, author, and subject (category name)
const books = await prisma.book.findMany({
  where: {
    isPublished: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { authorName: { contains: query, mode: 'insensitive' } },
      { categories: { some: { category: { name: { contains: query, mode: 'insensitive' } } } } },
    ],
  },
})
```

`mode: 'insensitive'` uses PostgreSQL's `ILIKE` internally. Verified: only available for PostgreSQL (which this project uses).

### Pattern 6: Schema.org Book JSON-LD (CAT-05)

Google's Book structured data documentation specifies a work/edition two-level structure for enabling borrow/buy actions in Google Search. For a publisher catalog, the simplified single-level structure is sufficient to pass the Rich Results Test.

Required by Google's Rich Results Test for Book:
- `@context`, `@type: 'Book'`, `name`, `author`, `url`, `workExample` (for full action eligibility)

For basic structured data that passes Rich Results Test validation:
- `@type: 'Book'`, `name`, `author`, `isbn`, `description`, `publisher`, `numberOfPages`, `url`

**Recommendation:** Use the simplified structure. The `workExample` + `potentialAction` pattern (for "Get book" action in Google Search) requires a buy/borrow endpoint, which is a Phase 5 concern (payments).

### Pattern 7: Cover Image Display

Book covers are stored as URLs in `book.coverImage` (a string field in the schema — could be an R2 URL or any external URL). For `next/image` to optimize external images, `remotePatterns` must be configured in `next.config.ts`.

```typescript
// next.config.ts — add remotePatterns for R2 bucket
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
}
```

For missing covers, use a styled placeholder (background gradient + book title initials) rather than a broken image. Do not use `<img>` tags — use `next/image` for optimization and LCP.

### Anti-Patterns to Avoid

- **Don't filter in a client component with useState:** Catalog filtering should be URL-driven (searchParams) for bookmarkability and SSR. Client state filtering breaks on page load and loses state on navigation.
- **Don't use `router.push()` for filter changes:** Use `router.replace()` to avoid polluting browser history with every keystroke or filter click.
- **Don't render `chapter.content` without sanitization note:** The content is produced by the project's own Pandoc pipeline (trusted), so `dangerouslySetInnerHTML` is acceptable here. If content origin ever changes, sanitize with `DOMPurify`.
- **Don't embed JSON-LD in `layout.tsx`:** Book-specific JSON-LD should be in `page.tsx` so it's scoped to the detail page only, not inherited by all routes.
- **Don't omit `< → \u003c` escaping in JSON.stringify:** Official Next.js docs explicitly call this out as an XSS vector.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced search input | Manual setTimeout + useRef cleanup | `use-debounce` (useDebouncedCallback) | Handles React lifecycle, StrictMode double-invocation, and cleanup correctly |
| URL search param manipulation | Custom string building | `new URLSearchParams(searchParams.toString())` + `.set()` / `.delete()` | Native API, correct encoding, easy to test |
| Book cover fallback placeholder | A separate placeholder image file | Tailwind div with gradient + initials | No network request, always available |
| JSON-LD type safety | Manual type definitions | Inline object (or `schema-dts` if needed) | For a single Book type, inline object is readable enough; `schema-dts` only if the team wants TypeScript coverage |
| Case-insensitive search | Custom SQL via `$queryRaw` | Prisma `mode: 'insensitive'` | Prisma handles ILIKE generation; no raw SQL needed for this catalog size |

**Key insight:** The project's catalog is fewer than 20 books. Elegant simplicity beats engineering for scale that doesn't exist yet. `ILIKE` is fast enough. No full-text search indexes needed.

---

## Common Pitfalls

### Pitfall 1: searchParams Is a Promise in Next.js 15+

**What goes wrong:** Accessing `searchParams.category` directly (synchronous access) will throw a runtime warning and may break in future Next.js versions.
**Why it happens:** Next.js 15 made `params` and `searchParams` asynchronous to support streaming and Partial Prerendering.
**How to avoid:** Always `const { category } = await searchParams` in async server components.
**Warning signs:** Console warning "searchParams should be awaited before using its properties."

### Pitfall 2: Missing Suspense Boundary Around useSearchParams

**What goes wrong:** Build fails with "Missing Suspense boundary" error when a client component uses `useSearchParams()`.
**Why it happens:** Next.js requires `useSearchParams` consumer components to be wrapped in `<Suspense>` because they cause a client-side render bailout.
**How to avoid:** Wrap filter/search client components in `<Suspense fallback={<FilterSkeleton />}>` in the parent server component.
**Warning signs:** Build error: "useSearchParams() should be wrapped in a suspense boundary."

### Pitfall 3: Dynamic Rendering Surprises on Catalog Page

**What goes wrong:** Adding `searchParams` to a page opts it into dynamic rendering — it cannot be statically cached. This is expected and correct for a filterable catalog, but could surprise if you add `export const dynamic = 'force-static'` anywhere.
**Why it happens:** `searchParams` is a dynamic API; using it signals Next.js to render at request time.
**How to avoid:** Don't add `force-static` to catalog pages. Accept dynamic rendering.

### Pitfall 4: notFound() Must Be Called, Not Returned

**What goes wrong:** `return notFound()` silently does nothing in some setups; the correct pattern is to call it without return.
**Why it happens:** `notFound()` throws internally (Next.js convention), not returns.
**How to avoid:** Use `if (!book) notFound()` (no `return`). TypeScript will correctly narrow the type after `notFound()` because it is typed as `never`.

### Pitfall 5: R2 Cover Image URLs and next/image remotePatterns

**What goes wrong:** `next/image` throws "hostname not configured" error when displaying R2 bucket URLs.
**Why it happens:** Next.js 16+ requires explicit `remotePatterns` for any external image host.
**How to avoid:** Add the R2 hostname pattern to `next.config.ts` before implementing `BookCoverImage`. The pattern will vary based on whether the bucket uses a custom domain or the default `*.r2.cloudflarestorage.com` hostname.

### Pitfall 6: dangerouslySetInnerHTML on Chapter Content (XSS Risk Noted)

**What goes wrong:** If chapter content were ever populated from an untrusted source, `dangerouslySetInnerHTML` would be an XSS vector.
**Why it happens:** Phase 2 Pandoc pipeline is the only content source, so the risk is low — but the pattern should be documented.
**How to avoid:** For Phase 3, trust the pipeline output. Add a note in the preview page component. If content sources expand in the future, add `isomorphic-dompurify`.

---

## Code Examples

Verified patterns from official sources:

### Catalog Page with Async searchParams

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { category, sort = 'title', q = '' } = await searchParams
  // ... Prisma query + render
}
```

### Client Filter URL Update

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-router
const router = useRouter()
const pathname = usePathname()
const searchParams = useSearchParams()

function setCategory(slug: string | null) {
  const params = new URLSearchParams(searchParams.toString())
  if (slug) params.set('category', slug)
  else params.delete('category')
  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
}
```

### JSON-LD in Server Component

```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

### generateMetadata for Dynamic Route

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) return {}
  return {
    title: `${book.title} | ScienceOne`,
    description: book.synopsis ?? undefined,
  }
}
```

### Prisma Multi-field Search

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting
prisma.book.findMany({
  where: {
    isPublished: true,
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { authorName: { contains: q, mode: 'insensitive' } },
      { categories: { some: { category: { name: { contains: q, mode: 'insensitive' } } } } },
    ],
  },
  orderBy: { title: 'asc' },
})
```

### next/image with Aspect Ratio for Book Cover

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image
// Use width/height to define 2:3 aspect ratio; use fill + relative wrapper when size is fluid
<div className="relative w-full" style={{ aspectRatio: '2/3' }}>
  <Image
    src={book.coverImage}
    alt={`Cover of ${book.title}`}
    fill
    className="object-cover rounded"
    sizes="(max-width: 768px) 120px, 200px"
  />
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as sync prop | `searchParams` as Promise (must await) | Next.js 15 RC | Catalog page must be async and await searchParams |
| `domains` in next.config for external images | `remotePatterns` (more specific) | Next.js 12.3 | Must configure R2 hostname in remotePatterns |
| Pages Router `getServerSideProps` for filtering | App Router async server component + searchParams | Next.js 13+ App Router | Simpler — no separate data fetching function needed |
| Full-text search for any catalog | `ILIKE` / `contains` for small catalogs | Always true | Prisma's fullTextSearch is a preview feature; for <20 books, ILIKE is appropriate |

**Deprecated/outdated:**
- Prisma `fullTextSearch` preview feature: Still preview as of 2026; not needed for this catalog size.
- Next.js `pages/` router patterns: Not applicable — project uses App Router.
- `domains` in `images` next.config: Superseded by `remotePatterns`; `domains` is less precise.

---

## Design Recommendations (Claude's Discretion Areas)

### Catalog Page Layout
- **Grid:** 3 columns on desktop, 2 on tablet, 1 on mobile. With fewer than 20 books, fit all on one page — no pagination.
- **Book card content:** Cover image (2:3 ratio), title (serif), author name, category badges, price (or "Open Access" badge). Keep cards compact — the cover image is the dominant element.
- **Category filter:** Horizontal pill/tab row above the grid. One active at a time (radio-style). "All" as default. Small enough catalog that a dropdown is overkill.
- **Sort selector:** Simple `<select>` dropdown — "Title A–Z", "Newest first", "Author A–Z". On the right side of the filter row.
- **Page header:** Simple heading — "Browse Books" or "Catalog" — with search input below it, full width or half width. No hero/marketing text on the catalog page.

### Search Behavior
- **Placement:** Integrated into the catalog page, above the filter row. Not in the global site header (catalog-specific concern).
- **Behavior:** Instant (debounced 300ms, URL-synced). Results update in-place as the user types — no submit button needed for a small catalog.
- **Empty state:** "No books match your search" with a "Clear search" link. No suggestions, no autocomplete — catalog is too small for those to add value.

### Book Detail Page Layout
- **Structure:** Two-column on desktop (cover left ~33%, info right ~67%). Single column on mobile (cover on top).
- **Cover column:** Cover image, then below: price (subtle, small text), "Buy" or "Download" button (Phase 5/6), and "Read sample" link.
- **Info column:** Title (large serif), author line (name + affiliation in muted text), category badges, synopsis (full paragraph), then TOC.
- **TOC approach:** Simple ordered list. No accordion/collapse for a typical STEM book TOC — chapters are numbered and scannable. Use `Separator` between synopsis and TOC.
- **Pricing display:** Show as `$XX.XX` in small muted text near the CTA area, not as a prominent price tag. "Open Access" books get a green badge instead of price.

### Sample Chapter Preview
- **Route:** `/catalog/[slug]/preview` — a dedicated page, not a modal or inline reveal. This allows bookmarking, sharing, and direct linking.
- **Content:** Render the first chapter with `isFreePreview: true`. If no chapter is flagged, show a "preview not available" state.
- **Upsell:** At the end of the chapter content, a section: "Continue reading — [Book Title]" with price and a link back to the detail page. Understated — one card-style block, not a full-page overlay.
- **Header context:** Show book title + author in a breadcrumb or subtitle above the chapter heading so readers know what they're reading.

---

## Open Questions

1. **Cover image hosting decision**
   - What we know: `book.coverImage` is a `String?` field — could be any URL. R2 is already set up for PDF/EPUB storage.
   - What's unclear: Will cover images be stored in R2 (requiring `remotePatterns` config and potentially presigned URLs if bucket is private), or served from a public CDN URL?
   - Recommendation: If covers go in R2, make the `covers/` prefix publicly readable (separate from book content which needs gating). This avoids the complexity of presigned image URLs that expire. Public covers, private book files.

2. **`isFreePreview` chapter flag currently not set in seed data**
   - What we know: The `Chapter` model has `isFreePreview Boolean @default(false)`. Seed data creates chapters for existing books but doesn't set any to `true`.
   - What's unclear: The planner needs to decide whether the preview route shows chapter position=1 as the default fallback (if no `isFreePreview` chapter exists) or shows a "no preview available" state.
   - Recommendation: Default to position=1 (first chapter) as the free preview if no chapter has `isFreePreview: true`. Add a fallback for books with no chapters.

3. **`authorImage` field vs. author section scope**
   - What we know: `Book.authorImage String?` exists in schema. CONTEXT.md says "Minimal — name and one-liner affiliation, not a full bio with photo." The success criteria in requirements says "author bio and photo."
   - What's unclear: The user decision says no photo, but the requirement (CAT-02) says "author bio/photo." CONTEXT.md decisions take precedence per research instructions.
   - Recommendation: Follow CONTEXT.md: display name + affiliation only. Skip the photo. The `authorImage` field can be populated later without UI changes.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs (`@doc-version: 16.1.6, @last-updated: 2026-02-16`) — searchParams Promise API, page.tsx conventions, generateMetadata, JSON-LD guide, remotePatterns
  - https://nextjs.org/docs/app/api-reference/file-conventions/page
  - https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  - https://nextjs.org/docs/app/guides/json-ld
- Schema.org Book type spec — https://schema.org/Book
- Google Search Central Book structured data — https://developers.google.com/search/docs/appearance/structured-data/book

### Secondary (MEDIUM confidence)
- Prisma docs on filtering — `mode: 'insensitive'` confirmed for PostgreSQL (ILIKE)
  - https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search
- `use-debounce` npm — version 10.1.0 (verified with `npm info use-debounce version`)
- Next.js official learn path — search and pagination pattern with `useDebouncedCallback`
  - https://nextjs.org/learn/dashboard-app/adding-search-and-pagination

### Tertiary (LOW confidence — for awareness only)
- Community discussions on shallow routing / `window.history.pushState` for URL updates without RSC re-render — flagged as an option but not recommended for this use case (catalog should re-render on filter change)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; only `use-debounce` is new; verified current version
- Architecture: HIGH — patterns match Next.js 16.1.6 official docs fetched directly
- Prisma search: HIGH — `mode: 'insensitive'` is stable API; confirmed PostgreSQL support
- Schema.org JSON-LD: HIGH — Next.js docs and Google Search Central both fetched directly
- Design recommendations: MEDIUM — reasonable inference from user constraints + academic publishing conventions; no user validation

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable libraries; Next.js version pinned at 16.1.6)
