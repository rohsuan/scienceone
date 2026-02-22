# Phase 15: Polish and Cross-linking - Research

**Researched:** 2026-02-22
**Domain:** Pagination (offset, URL search params) and subject-based cross-linking queries (Prisma relational filtering)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RES-10 | Resource and blog listings have pagination | Offset pagination via `skip`/`take` in Prisma + `page` URL search param + client Pagination component using `useSearchParams`/`usePathname` |
| XLINK-01 | Blog posts show related resources based on shared subjects | New `getRelatedResources(subjectIds, excludeId, limit)` query with `subjects.some` filter + inline section on blog post detail page |
| XLINK-02 | Resource pages show related blog posts based on shared subjects | New `getRelatedBlogPosts(subjectIds, excludeId, limit)` query + inline section on resource detail page |
| XLINK-03 | Simulation pages link to related resources (lab guides sharing the simulation's subject) | Extend XLINK-01 query: filter by `type: LAB_GUIDE` + subject overlap, render as link list in simulation detail sidebar |
</phase_requirements>

---

## Summary

Phase 15 has two distinct sub-problems. The first is **pagination**: both the resource listing and blog listing pages currently call `findMany` without a `LIMIT`, which is a correctness issue. The fix is pure plumbing: add `skip`/`take` to the two existing query functions, pass the `page` URL search param from the server component, and add a client-side Pagination component that produces `?page=N` links. No new npm packages are needed — the app already uses Next.js 16 App Router patterns (`searchParams` as a Promise, `useSearchParams`/`usePathname` for client components) that exactly match the official Next.js pagination tutorial. The shadcn `Button` component covers all UI needs for page nav controls; no shadcn `Pagination` component is installed, so one must be built inline.

The second sub-problem is **cross-linking**: blog post, resource, and simulation detail pages need "related content" sections. The schema already supports this — both `Resource` and `BlogPost` share a `Subject` model via join tables (`ResourceSubject`, `BlogPostSubject`). The cross-link queries are straightforward `findMany` calls with a `subjects.some` filter and a `NOT id` exclusion — the same Prisma relation-filter pattern already used in `resource-queries.ts` and `blog-queries.ts`. Subject IDs are already available on the detail page because the existing queries `include: { subjects: { include: { subject: true } } }`. For simulation cross-links (XLINK-03), the target is LAB_GUIDE resources that share the simulation's subjects — same query shape with an additional `type` filter.

**Primary recommendation:** Implement pagination with offset/page-number URL params (not cursor-based) because filters are already URL-param-driven, and page numbers play well with browser back/forward and bookmarking. Implement cross-linking as new query functions in existing `resource-queries.ts` and `blog-queries.ts` files — no new files required. Both plans are low-risk because the patterns are already established in this codebase.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma Client | ^7.4.0 | `skip`/`take`/`count` for pagination; `subjects.some` for cross-link queries | Already installed, no new deps |
| Next.js App Router | 16.1.6 | `searchParams` prop (Promise) on server page components for current page | Already the project standard |
| React `useSearchParams` / `usePathname` | 19.2.3 | Client pagination component reads current page + builds `?page=N` URLs | Already used in filter components |
| shadcn `Button` | canary | Pagination prev/next/number buttons | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Link` from `next/link` | 16.1.6 | Renders each pagination button as a pre-fetchable anchor | Use for all page number buttons so prefetch works |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Offset pagination (`skip`/`take`) | Cursor pagination | Cursor is faster at scale but incompatible with filter/sort params already in URL; dataset is small (dev: <100 items) so offset is fine |
| Built inline Pagination component | shadcn `pagination` | shadcn pagination is not installed; installing it adds a full component with icons that aren't in the project yet; simpler to build a minimal one with existing `Button` |
| Two Prisma queries (findMany + count) | `$transaction([findMany, count])` | Transaction is cleaner but overkill for a read-only listing; two parallel `Promise.all` calls are fine |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. Changes are concentrated in:

```
src/
├── lib/
│   ├── resource-queries.ts      # Add `page` param + skip/take to getPublishedResources; add getRelatedBlogPosts
│   └── blog-queries.ts          # Add `page` param + skip/take to getPublishedBlogPosts; add getRelatedResources
├── components/
│   ├── resources/
│   │   └── ResourcePagination.tsx   # NEW: client pagination component (shared by both listings)
│   └── blog/
│       └── (none new — BlogPage uses ResourcePagination directly)
└── app/(main)/
    ├── resources/page.tsx           # Add page param extraction; pass totalPages to pagination
    ├── blog/page.tsx                # Same
    ├── resources/[slug]/page.tsx    # Add Related Articles section
    └── simulations/[slug]/page.tsx  # Add Related Lab Guides section
```

### Pattern 1: Offset Pagination — Query Layer

**What:** Add `page` and `pageSize` parameters to the existing `getPublishedResources` and `getPublishedBlogPosts` functions. Return `{ items, totalCount }`. Page number is 1-indexed.

**When to use:** Any server-rendered listing that currently does `findMany` without `take`.

```typescript
// In src/lib/resource-queries.ts
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/pagination

const PAGE_SIZE = 12;

export async function getPublishedResources({
  subject,
  type,
  level,
  sort,
  q,
  page = 1,
}: GetPublishedResourcesParams & { page?: number } = {}) {
  const where: Prisma.ResourceWhereInput = { isPublished: true, /* ...existing filters... */ };
  const orderBy = /* ...existing orderBy logic... */;

  const skip = (page - 1) * PAGE_SIZE;

  const [items, totalCount] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        subjects: { include: { subject: true } },
        pricing: true,
        simulation: { select: { componentKey: true } },
      },
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, totalCount };
}
```

### Pattern 2: Offset Pagination — Page Component

**What:** Server page component reads `page` from `searchParams`, passes `totalCount` and `currentPage` to a client Pagination component.

**When to use:** Any page that uses the paginated query function.

```typescript
// In src/app/(main)/resources/page.tsx
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;
  const page = params.page ? Math.max(1, parseInt(String(params.page), 10)) : 1;
  // ... other params ...

  const [{ items: resources, totalCount }, subjects] = await Promise.all([
    getPublishedResources({ subject, type, level, sort, q, page }),
    getSubjects(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      {/* ...existing grid... */}
      {totalPages > 1 && (
        <ResourcePagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
```

### Pattern 3: Client Pagination Component

**What:** Client component using `useSearchParams` and `usePathname` to build page URLs. Renders prev/next buttons and page numbers. Uses `Link` for pre-fetching.

**When to use:** Any listing page needing numbered pagination controls.

```typescript
// src/components/resources/ResourcePagination.tsx
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ResourcePaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function ResourcePagination({ currentPage, totalPages }: ResourcePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function createPageURL(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
        <Link href={createPageURL(currentPage - 1)}>Previous</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages}>
        <Link href={createPageURL(currentPage + 1)}>Next</Link>
      </Button>
    </div>
  );
}
```

**Note:** The `disabled` prop on `Button` with `asChild` and `Link` will apply the disabled styling but the `<a>` tag still renders (not truly disabled). For this UI, that is acceptable — the link just wraps to the same page. If strict disabling is needed, render `<Button>` (not `asChild`) for boundary pages.

### Pattern 4: Cross-link Query (Related Resources / Related Posts)

**What:** New query functions that take subject IDs from the current item and find other published items sharing at least one. Exclude self, limit to small set (4).

**When to use:** Blog post detail page (related resources), resource detail page (related blog posts), simulation detail page (related lab guide resources).

```typescript
// In src/lib/blog-queries.ts — add this function
export async function getRelatedResources(
  subjectIds: string[],
  excludeResourceId: string,
  limit = 4
) {
  if (subjectIds.length === 0) return [];
  return prisma.resource.findMany({
    where: {
      isPublished: true,
      id: { not: excludeResourceId },
      subjects: {
        some: { subjectId: { in: subjectIds } },
      },
    },
    take: limit,
    orderBy: { viewCount: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      description: true,
      coverImage: true,
      isFree: true,
    },
  });
}

// In src/lib/resource-queries.ts — add this function
export async function getRelatedBlogPosts(
  subjectIds: string[],
  excludeBlogPostId: string,
  limit = 4
) {
  if (subjectIds.length === 0) return [];
  return prisma.blogPost.findMany({
    where: {
      isPublished: true,
      id: { not: excludeBlogPostId },
      subjects: {
        some: { subjectId: { in: subjectIds } },
      },
    },
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
    },
  });
}

// Simulation-specific: related lab guides (in src/lib/resource-queries.ts)
export async function getRelatedLabGuides(
  subjectIds: string[],
  excludeResourceId: string,
  limit = 4
) {
  if (subjectIds.length === 0) return [];
  return prisma.resource.findMany({
    where: {
      isPublished: true,
      type: "LAB_GUIDE",
      id: { not: excludeResourceId },
      subjects: {
        some: { subjectId: { in: subjectIds } },
      },
    },
    take: limit,
    orderBy: { viewCount: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
    },
  });
}
```

**Key implementation note:** Extract `subjectIds` from the already-loaded resource/post, because the detail pages already include `subjects: { include: { subject: true } }`. No extra DB round-trip for subjects.

```typescript
// In blog post detail page:
const subjectIds = post.subjects.map(({ subject }) => subject.id);
const relatedResources = await getRelatedResources(subjectIds, post.id);
```

### Pattern 5: Cross-link UI Section

**What:** Simple inline section at the bottom of the detail page — no new component file needed unless reused. A horizontal card list or simple link list depending on content type.

**For blog post (Related Resources):**
```tsx
{relatedResources.length > 0 && (
  <>
    <Separator className="my-8" />
    <section>
      <h2 className="font-serif text-xl font-semibold mb-4">Related Resources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedResources.map((r) => (
          <Link key={r.id} href={`/resources/${r.slug}`} className="...">
            {r.title}
          </Link>
        ))}
      </div>
    </section>
  </>
)}
```

**For simulation (Related Lab Guides):** Simple `<ul>` in the sidebar since it's already a sidebar layout. Render as plain links to `/resources/{slug}`.

### Anti-Patterns to Avoid

- **Storing `page` in React state:** State resets on navigation. Always use URL search params.
- **Resetting pagination inside the Pagination component:** When filters change, the filter components already call `router.replace` — add `params.delete("page")` there. The Pagination component itself never resets others' params.
- **Fetching subjects again for cross-links:** Subject IDs are on the already-fetched resource/post object. Extract from that, not a separate query.
- **Using `findMany` without `take` for related content:** Always pass `limit` (4) to cross-link queries to prevent unbounded queries even in the cross-link case.
- **Rendering cross-link section when empty:** Guard with `relatedResources.length > 0` so no orphaned section header appears.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination URL construction | Custom URL builder | `new URLSearchParams(searchParams.toString())` then `.set("page", n)` | Official Next.js pattern, preserves existing params |
| Total page count | Manual slice count | `prisma.model.count({ where })` parallel with `findMany` | Prisma optimises count separately, handles NULL correctly |
| Client route update | `window.location` | `useRouter().replace()` or `Link` with `href` | Next.js route transitions + prefetch |

**Key insight:** The pagination component is ~30 lines because the primitives already exist. Don't reach for a pagination library.

---

## Common Pitfalls

### Pitfall 1: Filter Changes Don't Reset Page

**What goes wrong:** User is on page 3, changes subject filter, sees page 3 of new filter results (which may be empty or wrong).
**Why it happens:** Filter components (`ResourceFilters`, `BlogFilters`) call `router.replace` with `setParam()` but don't clear the `page` param.
**How to avoid:** In `setParam()` inside filter components, also call `params.delete("page")` before navigating. This is a one-line fix in each filter component.
**Warning signs:** Empty pages when combining filters with page > 1.

### Pitfall 2: `parseInt` on Untrusted Input

**What goes wrong:** `parseInt("abc", 10)` returns `NaN`. `Math.max(1, NaN)` returns `NaN`. Prisma `skip: NaN * 12` returns all records.
**Why it happens:** `searchParams.page` is user-controlled.
**How to avoid:** Guard the parse: `const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1)`. The `|| 1` handles `NaN`.

### Pitfall 3: `disabled` + `asChild` + `Link` Renders Clickable Anchor

**What goes wrong:** `<Button disabled asChild><Link href="...">Previous</Link></Button>` applies disabled styling but the anchor still fires navigation.
**Why it happens:** `disabled` is a button attribute; when rendered as `<a>`, it has no effect.
**How to avoid:** Either (a) don't render the Link/button at all for boundary pages, or (b) render a `<Button disabled>Previous</Button>` (not asChild) on the boundary pages. The simplest approach: conditional rendering — only render the Link when the navigation is valid.

### Pitfall 4: Cross-link Query Returns the Current Item

**What goes wrong:** If the page's own resource/post shares subjects with itself, it appears in the related section.
**Why it happens:** Forgot `id: { not: currentId }` in the where clause.
**How to avoid:** Always include the exclusion clause. Already covered in code examples above.

### Pitfall 5: Prisma `subjects.some.subjectId` vs `subjects.some.subject.id`

**What goes wrong:** Filtering by `subjects.some.subject.id` traverses two relation hops (ResourceSubject → Subject); filtering by `subjects.some.subjectId` filters on the join table's FK directly.
**Why it happens:** The join table `ResourceSubject` has both `subjectId` (FK) and a `subject` relation.
**How to avoid:** Use `subjects.some: { subjectId: { in: subjectIds } }` — filters on the FK directly, no extra join needed.

### Pitfall 6: `Promise<searchParams>` — Await in Server Components

**What goes wrong:** Using `searchParams.page` directly (before awaiting) gives a Promise object.
**Why it happens:** Next.js 16 App Router makes `searchParams` a Promise (breaking change from older pattern).
**How to avoid:** The project already consistently does `const params = await searchParams;` — follow the same pattern. Do not destructure before awaiting.

---

## Code Examples

### Count + Paginated findMany in One Go

```typescript
// Source: Prisma docs — https://www.prisma.io/docs/orm/prisma-client/queries/pagination
const [items, totalCount] = await Promise.all([
  prisma.resource.findMany({ where, skip, take: PAGE_SIZE, ...rest }),
  prisma.resource.count({ where }),
]);
const totalPages = Math.ceil(totalCount / PAGE_SIZE);
```

### Safe Page Number Parsing

```typescript
// Source: Next.js learn tutorial — https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
const rawPage = params.page ? parseInt(String(params.page), 10) : NaN;
const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
```

### Preserving Existing Params When Changing Page

```typescript
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
function createPageURL(pageNumber: number) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(pageNumber));
  return `${pathname}?${params.toString()}`;
}
```

### Reset Page When Filter Changes (Inside Filter Components)

```typescript
// Existing setParam pattern in ResourceFilters/BlogFilters — add params.delete("page")
function setParam(key: string, value: string | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  params.delete("page"); // Always reset to page 1 on filter change
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}
```

### Related Resources Query (for Blog Post Page)

```typescript
// Subject IDs come from the already-loaded post
const subjectIds = post.subjects.map(({ subject }) => subject.id);
const [relatedResources] = await Promise.all([
  getRelatedResources(subjectIds, post.id),
  // other parallel fetches...
]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as plain object | `searchParams` as `Promise<...>` | Next.js 15+ | Must `await searchParams` — already done everywhere in this codebase |
| Separate `skip`/`take` as raw numbers | Still `skip`/`take` in Prisma 7 | No change | Same API |

**Deprecated/outdated:**
- `params.searchParams` (sync access): Removed in Next.js 15+. The project already uses the async pattern.

---

## Open Questions

1. **Should the blog listing page also have a count badge ("12 of 47 results")?**
   - What we know: Requirements say pagination with navigation control, not a count badge
   - What's unclear: Whether a "showing N of M" line improves UX significantly
   - Recommendation: Omit for now — success criteria only require working navigation control

2. **Should cross-links use the full `ResourceCard` / `BlogPostCard` component or a compact list?**
   - What we know: ResourceCard is a card with image+type+level badges; BlogPostCard has cover image; both are 3-column grids on the listing pages
   - What's unclear: Whether 4 full cards below a resource detail is too heavy
   - Recommendation: Use a compact horizontal card (title + type badge + description, no image) to keep the detail page focused on the primary content. The planner can decide final visual form.

3. **Should simulation cross-links include all resource types or only LAB_GUIDE?**
   - What we know: XLINK-03 says "related lab guide resources that share the simulation's subject"
   - What's unclear: Nothing — requirement is explicit
   - Recommendation: Filter to `type: LAB_GUIDE` only per requirement.

---

## Sources

### Primary (HIGH confidence)
- Official Next.js Learn tutorial — https://nextjs.org/learn/dashboard-app/adding-search-and-pagination — full server+client pagination code, searchParams as Promise, useSearchParams/usePathname pattern
- Prisma pagination docs — https://www.prisma.io/docs/orm/prisma-client/queries/pagination — skip/take/count official reference
- Project codebase — `src/lib/resource-queries.ts`, `src/lib/blog-queries.ts`, `src/components/resources/ResourceFilters.tsx`, `src/components/blog/BlogFilters.tsx`, `src/app/(main)/resources/page.tsx`, `src/app/(main)/blog/page.tsx`, `src/app/(main)/resources/[slug]/page.tsx`, `src/app/(main)/simulations/[slug]/page.tsx`, `prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- WebSearch results for Prisma pagination patterns — confirmed skip/take/count is the standard two-query approach; multiple sources agree

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all libraries already in project
- Architecture: HIGH — patterns verified against official Next.js tutorial and Prisma docs; cross-link queries follow established patterns already in codebase
- Pitfalls: HIGH — filter-reset pitfall is code-visible in existing components; parseInt/NaN pitfall is fundamental JS; disabled+asChild+Link is a known shadcn limitation

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable stack — Next.js 16, Prisma 7 are not fast-moving at this point)
