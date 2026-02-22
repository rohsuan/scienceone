# Phase 14: Blog - Research

**Researched:** 2026-02-22
**Domain:** Blog admin CRUD, public listing/filtering/search, SEO metadata, XSS sanitization, sitemap
**Confidence:** HIGH — all findings from direct codebase inspection; no inference required

## Summary

Phase 14 is a verification-and-fix pass over first-pass blog code that is substantially complete. Every component, query, server action, schema, and page already exists. The work is not building from scratch — it is auditing what exists, fixing three known bugs, and adding the one missing piece (sitemap). No new npm packages are required; all dependencies are already installed.

The most important finding is that all six bugs and gaps identified in prior research are directly observable in the code. Three are blocking: `togglePublishBlogPost` does not revalidate `/blog/{slug}`, `BlogPostTableColumns` calls server actions directly without `useTransition` (no toast feedback, no disabled state), and `app/sitemap.ts` does not exist. Two are SEO-only: `datePublished` will be absent from JSON-LD when `publishedAt` is null (because `JSON.stringify` drops `undefined`), and re-publishing clobbers the original `publishedAt` date. One is enhancement-only: blog post content is not passed through `highlightCodeBlocks()` before render, so code blocks display as plain `<pre>` rather than Shiki-highlighted.

The overall architecture of the blog feature is correct and requires no structural changes. The query/action split (`blog-queries.ts` for public with `isPublished: true` enforced, `blog-admin-queries.ts` for admin), the Zod schema for form validation, the `sanitizeHtml()` call on post content before `dangerouslySetInnerHTML`, the JSON-LD Article schema, and the Open Graph metadata are all present and correctly structured. The planner should treat each requirement as a verification task with a targeted fix, not a build task.

**Primary recommendation:** Verify each requirement against existing code, fix the three bugs (slug revalidation, useTransition/toast in table actions, sitemap creation), apply two SEO fixes (publishedAt fallback in JSON-LD, clobber guard in togglePublish), and add Shiki code highlighting to the blog detail page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | Admin can create, edit, and delete blog posts | CreateBlogPostDialog, BlogPostEditForm, BlogPostTable/Columns all exist. BlogPostTableColumns has a bug: calls server actions directly without useTransition — no toast on error, no disabled state during action. Fix: extract BlogRowActions component following ResourceRowActions pattern from ResourceTableColumns. |
| BLOG-02 | Admin can publish/unpublish blog posts with draft workflow | togglePublishBlogPost server action exists but has two bugs: (1) does not revalidate `/blog/{slug}` — published post detail page may serve stale 404; (2) always sets publishedAt to new Date() on re-publish, clobbering the original date. Fix both in blog-admin-actions.ts. |
| BLOG-03 | Visitor can browse published blog posts with category and subject filtering | getPublishedBlogPosts, BlogFilters, BlogPostCard, blog/page.tsx all exist and correctly use searchParams. BlogFilters uses subject slug for filtering, query matches on subject.slug. Verify round-trip works end-to-end. |
| BLOG-04 | Visitor can search blog posts by keyword | getPublishedBlogPosts accepts `q` param, searches title + excerpt + authorName with mode: insensitive. ResourceSearchInput component already reused on blog page. Verify the `q` param flows correctly from searchParams to query. |
| BLOG-05 | Blog post pages render with SEO metadata (JSON-LD, Open Graph) | generateMetadata returns openGraph with title, description, type: "article", publishedTime, authors, images. JSON-LD Article schema block is present in page JSX. One bug: `datePublished: post.publishedAt?.toISOString()` produces undefined when publishedAt is null — JSON.stringify drops it silently. Fix: fall back to post.createdAt. |
| BLOG-06 | Blog post content is sanitized against XSS before rendering | sanitizeHtml() from src/lib/sanitize-html.ts IS already called on post.content before dangerouslySetInnerHTML in blog/[slug]/page.tsx (line 147). This requirement is ALREADY MET. Verify-only task. |
| BLOG-07 | Blog posts are included in the sitemap | No app/sitemap.ts exists anywhere in the project. Must create src/app/sitemap.ts using Next.js MetadataRoute.Sitemap API. Must include blog posts, resources, and simulations (BLOG-07 explicitly requires all three content types). |
</phase_requirements>

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, sitemap.ts file convention, revalidatePath | Already installed |
| prisma | ^7.4.0 | Blog post queries with subject joins | Already installed |
| react-hook-form | ^7.71.1 | BlogPostEditForm form state | Already installed |
| zod | ^4.3.6 | blogPostUpdateSchema validation | Already installed |
| sanitize-html | ^2.17.1 | XSS sanitization before dangerouslySetInnerHTML | Already installed, already used |
| shiki | ^3.22.0 | Code block syntax highlighting | Already installed, used in book reader |
| @tanstack/react-table | ^8.21.3 | BlogPostTable | Already installed |
| sonner | ^2.0.7 | Toast feedback on admin actions | Already installed, missing from blog table |
| @tailwindcss/typography | ^0.5.19 | prose classes for blog article body | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | ^10.0.0 | Search input debouncing | ResourceSearchInput already handles this |
| lucide-react | ^0.574.0 | Icons in admin UI | Already used everywhere |

**Installation:** None required. All dependencies are installed.

## Architecture Patterns

### Existing Project Structure (blog-specific files)

```
src/
├── app/
│   ├── (admin)/admin/blog/
│   │   ├── page.tsx                    # Admin listing — getAllBlogPostsAdmin
│   │   └── [postId]/page.tsx           # Admin edit — getBlogPostAdmin + getAllSubjects
│   └── (main)/blog/
│       ├── page.tsx                    # Public listing — getPublishedBlogPosts + searchParams
│       ├── loading.tsx                 # Skeleton grid
│       └── [slug]/page.tsx             # Article detail — getBlogPostBySlug + JSON-LD
├── components/
│   ├── admin/
│   │   ├── BlogPostTable.tsx           # TanStack Table wrapper
│   │   ├── BlogPostTableColumns.tsx    # ColumnDef — BUG: no useTransition, no toast
│   │   ├── BlogPostEditForm.tsx        # React Hook Form, Tabs (Details/Content/Publishing)
│   │   └── CreateBlogPostDialog.tsx    # Dialog with slugify helper
│   └── blog/
│       ├── BlogPostCard.tsx            # Card component for listing grid
│       └── BlogFilters.tsx             # Category pills, subject pills, sort select
├── lib/
│   ├── blog-admin-actions.ts           # Server actions — BUG: togglePublishBlogPost
│   ├── blog-admin-queries.ts           # getAllBlogPostsAdmin, getBlogPostAdmin
│   ├── blog-admin-schemas.ts           # blogPostUpdateSchema (Zod)
│   └── blog-queries.ts                 # getPublishedBlogPosts, getBlogPostBySlug, getRecentBlogPosts
```

**Missing file to create:**
```
src/app/sitemap.ts                      # Next.js sitemap — blog posts + resources + simulations
```

### Pattern 1: BlogRowActions extracted component (fix for BLOG-01/BLOG-02)

**What:** ColumnDef cells cannot use hooks directly. Extract a named component that uses `useTransition` so `isPending` disables the button and actions show toast feedback.

**Reference pattern:** `ResourceRowActions` in `/src/components/admin/ResourceTableColumns.tsx` (lines 39-89). BlogPostTableColumns should follow this identically.

**Current broken code:**
```typescript
// BlogPostTableColumns.tsx — BAD: no useTransition, no toast, no disabled state
cell: ({ row }) => {
  const post = row.original;
  return (
    <DropdownMenu>
      ...
      <DropdownMenuItem
        onClick={() => togglePublishBlogPost(post.id, !post.isPublished)}
      >
```

**Correct pattern (matches ResourceRowActions):**
```typescript
// BlogPostTableColumns.tsx — CORRECT
function BlogRowActions({ post }: { post: BlogPostAdminRow }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      try {
        await togglePublishBlogPost(post.id, !post.isPublished);
        toast.success(post.isPublished ? "Post unpublished" : "Post published");
      } catch {
        toast.error("Failed to update publish status");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteBlogPost(post.id);
        toast.success("Post deleted");
      } catch {
        toast.error("Failed to delete post");
      }
    });
  }
  // ... DropdownMenu using isPending to disable trigger
}

// In columns array:
{
  id: "actions",
  cell: ({ row }) => <BlogRowActions post={row.original} />,
}
```

### Pattern 2: togglePublishBlogPost fix (BLOG-02)

**What:** Fetch slug before update, add `revalidatePath("/blog/${slug}")`, guard against publishedAt clobber.

**Current broken code:**
```typescript
// blog-admin-actions.ts — CURRENT (missing slug revalidation, clobbers publishedAt)
export async function togglePublishBlogPost(postId: string, publish: boolean) {
  await requireAdmin();
  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      isPublished: publish,
      publishedAt: publish ? new Date() : undefined,  // BUG: clobbers original date
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  // BUG: missing revalidatePath(`/blog/${slug}`)
}
```

**Fixed pattern (mirrors updateBlogPost slug-fetch pattern):**
```typescript
export async function togglePublishBlogPost(postId: string, publish: boolean) {
  await requireAdmin();

  // Fetch slug AND current publishedAt before updating
  const existing = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { slug: true, publishedAt: true },
  });

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      isPublished: publish,
      // Only set publishedAt on first publish — preserve original date on re-publish
      publishedAt: publish && !existing?.publishedAt ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
}
```

### Pattern 3: JSON-LD publishedAt fallback (BLOG-05)

**What:** `datePublished` disappears from JSON-LD when `publishedAt` is null because `undefined` is silently dropped by `JSON.stringify`. Fall back to `post.createdAt`.

**Current broken code (blog/[slug]/page.tsx):**
```typescript
const jsonLd = {
  ...
  datePublished: post.publishedAt?.toISOString(),  // BUG: undefined when null
  dateModified: post.updatedAt.toISOString(),
  ...
};
```

**Fixed:**
```typescript
const jsonLd = {
  ...
  datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
  dateModified: post.updatedAt.toISOString(),
  ...
};
```

### Pattern 4: sitemap.ts (BLOG-07)

**What:** Next.js 16 App Router uses `src/app/sitemap.ts` exporting a default async function returning `MetadataRoute.Sitemap`. The type is verified from the installed Next.js types:

```typescript
type SitemapFile = Array<{
  url: string;
  lastModified?: string | Date | undefined;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined;
  priority?: number | undefined;
}>
```

**Implementation pattern (create `src/app/sitemap.ts`):**
```typescript
import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, resources, simulations] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      where: { isPublished: true, type: { not: "SIMULATION" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      where: { isPublished: true, type: "SIMULATION" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/resources`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/simulations`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/catalog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  return [
    ...staticRoutes,
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...resources.map((r) => ({
      url: `${BASE_URL}/resources/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...simulations.map((s) => ({
      url: `${BASE_URL}/simulations/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
```

**Key notes:**
- File must be at `src/app/sitemap.ts` (app root, not inside a route group)
- Default export named `sitemap`, return type `MetadataRoute.Sitemap`
- Simulations are Resources with `type: "SIMULATION"` — their public URL is `/simulations/{slug}`, not `/resources/{slug}`
- Non-simulation resources are at `/resources/{slug}`
- `NEXT_PUBLIC_APP_URL` is already set and used throughout the codebase (`.env.local` has `http://localhost:3000`)

### Pattern 5: Shiki code highlighting in blog post (enhancement)

**What:** `highlightCodeBlocks()` exists in `src/lib/highlight-code.ts` and is used in the book reader and admin preview. It is not yet applied to blog post content. This is an enhancement, not a bug fix, but makes the blog consistent with the book reader.

**Pattern already established in `src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx`:**
```typescript
import { highlightCodeBlocks } from "@/lib/highlight-code";

// In the page component (async Server Component):
const highlightedContent = await highlightCodeBlocks(post.content ?? "");

// Then in JSX:
<article
  className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedContent) }}
/>
```

**Order matters:** `highlightCodeBlocks()` first (transforms code blocks to Shiki HTML), then `sanitizeHtml()` (allows Shiki's class/style attributes through). The existing sanitize-html config already allows `class` on `code` and `style` on `*`, so Shiki output passes through cleanly.

### Anti-Patterns to Avoid

- **Calling server actions directly in ColumnDef cell callbacks:** `useTransition` cannot be called inside a ColumnDef cell (it is not a React component). Always extract a named component (`BlogRowActions`) for action cells. This is why ResourceTableColumns has `ResourceRowActions` as a separate named function.
- **Setting publishedAt unconditionally on toggle:** Always check if `publishedAt` is already set before overwriting. Re-publishing should preserve the original date.
- **Sitemap including draft posts:** Sitemap queries MUST have `isPublished: true`. Never include draft content in sitemap.
- **Putting sitemap inside a route group:** `src/app/sitemap.ts` must be at the root app directory level, not inside `(main)/` or `(admin)/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XSS sanitization | Custom allowlist parser | `sanitizeHtml()` from `src/lib/sanitize-html.ts` | Already built, comprehensive MathML/KaTeX support, already used on this page |
| Sitemap XML generation | Manual XML string concatenation | Next.js `sitemap.ts` file convention | Framework handles encoding, content-type header, caching |
| Slug generation | Custom implementation | `slugify()` already in CreateBlogPostDialog | Copy it from there if needed elsewhere |
| Code highlighting | CSS `<pre>` styling | `highlightCodeBlocks()` from `src/lib/highlight-code.ts` | Already built, Shiki-powered, used in book reader |

## Common Pitfalls

### Pitfall 1: togglePublishBlogPost missing slug revalidation
**What goes wrong:** Publishing a post via the table toggle button immediately shows the post in the blog index, but visiting `/blog/{slug}` may return a stale 404 until Next.js cache expires naturally.
**Why it happens:** The action revalidates `/admin/blog` and `/blog` but not `/blog/{slug}`. The slug requires an extra DB fetch before the update.
**How to avoid:** Fetch `{ slug: true, publishedAt: true }` before the update, then call `revalidatePath("/blog/${slug}")` after.
**Warning signs:** Blog index shows a new post but clicking its card returns 404.

### Pitfall 2: BlogPostTableColumns missing useTransition
**What goes wrong:** Clicking "Publish" or "Delete" in the dropdown does not disable the button, does not show loading state, and does not toast success or error. The action fires silently and the user has no confirmation.
**Why it happens:** ColumnDef cells are not React components, so `useTransition` cannot be called in them directly. The cell callback is a plain function.
**How to avoid:** Extract `BlogRowActions` as a named component. Pattern is in `ResourceTableColumns.tsx`.
**Warning signs:** No toast appears after publish/delete; the button is not disabled while the action runs.

### Pitfall 3: JSON-LD datePublished silently missing
**What goes wrong:** Blog posts published without an explicit `publishedAt` (or with `publishedAt: null`) will have no `datePublished` field in the Article schema. Google's Rich Results Test will flag this as a warning. Posts won't appear in date-filtered results.
**Why it happens:** `post.publishedAt?.toISOString()` evaluates to `undefined` when `publishedAt` is null. `JSON.stringify` drops `undefined` values.
**How to avoid:** `(post.publishedAt ?? post.createdAt).toISOString()` — always produce a date.
**Warning signs:** Inspect the rendered page source, find `<script type="application/ld+json">`, check that `datePublished` key is present.

### Pitfall 4: sitemap not at app root
**What goes wrong:** If `sitemap.ts` is placed inside a route group like `(main)/sitemap.ts`, it either doesn't work or creates a route at the wrong path.
**Why it happens:** Route groups are filesystem-only; Next.js looks for `sitemap.ts` at `app/sitemap.ts` specifically.
**How to avoid:** Create at `src/app/sitemap.ts` (root of the app directory).
**Warning signs:** `/sitemap.xml` returns 404 after the file is added.

### Pitfall 5: Simulation slugs use /simulations/ not /resources/ in sitemap
**What goes wrong:** All simulations are `Resource` records with `type: "SIMULATION"`. Their public-facing URL is `/simulations/{slug}`, not `/resources/{slug}`. If the sitemap includes simulations under `/resources/`, the URLs are wrong and serve 404 (the `/resources/[slug]/page.tsx` redirects simulations to `/simulations/`).
**Why it happens:** Simulations are stored in the `resources` table, so naive queries over all resources will mix them.
**How to avoid:** Query resources with `type: { not: "SIMULATION" }` for `/resources/` sitemap entries. Query with `type: "SIMULATION"` for `/simulations/` sitemap entries.

## Code Examples

### Existing sanitizeHtml call in blog/[slug]/page.tsx (ALREADY CORRECT — verify only)

```typescript
// Source: src/app/(main)/blog/[slug]/page.tsx line 147
{post.content && (
  <article
    className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
  />
)}
```

This is correct. BLOG-06 is already met. Verify it remains in place.

### Existing Open Graph metadata (CORRECT, needs one fix)

```typescript
// Source: src/app/(main)/blog/[slug]/page.tsx
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | ScienceOne Blog`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),  // OK — optional field
      authors: [post.authorName],
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}
```

The Open Graph metadata is correct. `publishedTime` being optional here is acceptable (it is a non-required OG field). The JSON-LD `datePublished` is the critical fix.

### Existing JSON-LD (needs fix)

```typescript
// Source: src/app/(main)/blog/[slug]/page.tsx — CURRENT (broken)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.excerpt ?? undefined,  // undefined is dropped by JSON.stringify
  author: { "@type": "Person", name: post.authorName },
  datePublished: post.publishedAt?.toISOString(),  // BUG: undefined when null
  dateModified: post.updatedAt.toISOString(),
  publisher: { "@type": "Organization", name: "ScienceOne" },
  image: post.coverImage ?? undefined,  // undefined is dropped — OK for optional field
  url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com"}/blog/${post.slug}`,
};
```

### Next.js sitemap.ts type (verified from installed next@16.1.6 types)

```typescript
// Verified from: node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts
type SitemapFile = Array<{
  url: string;
  lastModified?: string | Date | undefined;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined;
  priority?: number | undefined;
  alternates?: { languages?: Languages<string> | undefined } | undefined;
  images?: string[] | undefined;
  videos?: Videos[] | undefined;
}>

declare namespace MetadataRoute {
  export type Sitemap = SitemapFile;
}
```

## What Exists vs. What Is Missing

| Item | Status | Action |
|------|--------|--------|
| createBlogPost server action | EXISTS, works | Verify end-to-end |
| updateBlogPost server action | EXISTS, works | Verify end-to-end |
| deleteBlogPost server action | EXISTS, works | Verify end-to-end |
| togglePublishBlogPost server action | EXISTS, 2 bugs | Fix: slug revalidation + publishedAt clobber guard |
| BlogPostTable + BlogPostTableColumns | EXISTS, 1 bug | Fix: extract BlogRowActions with useTransition + toast |
| BlogPostEditForm | EXISTS, complete | Verify works with all tabs |
| CreateBlogPostDialog | EXISTS, complete | Verify creates and redirects to edit page |
| blog/page.tsx (public listing) | EXISTS, complete | Verify filters and search work |
| blog/[slug]/page.tsx (article detail) | EXISTS, 1 bug | Fix: datePublished fallback in JSON-LD |
| blog/loading.tsx | EXISTS | No action |
| BlogPostCard | EXISTS | No action |
| BlogFilters | EXISTS | No action |
| sanitizeHtml on post.content | EXISTS, correct | Verify — BLOG-06 already met |
| Open Graph metadata | EXISTS, correct | Verify |
| JSON-LD Article schema | EXISTS, 1 bug | Fix: datePublished fallback |
| Shiki code highlighting | MISSING from blog | Add highlightCodeBlocks() before sanitizeHtml |
| app/sitemap.ts | MISSING | Create |
| Admin sidebar blog link | EXISTS | No action |
| Header/Footer blog links | EXISTS | No action |

## Open Questions

1. **Shiki language coverage for blog**
   - What we know: `highlight-code.ts` loads `["python", "javascript", "bash", "json", "text"]`
   - What's unclear: Are these languages sufficient for a STEM education blog? Physics content may include Julia, R, MATLAB syntax.
   - Recommendation: Accept current language set for v1.1. Adding languages is a one-line change in `highlight-code.ts` when needed; the highlighter falls back gracefully for unknown languages.

2. **Blog post pagination**
   - What we know: `getPublishedBlogPosts` has no `take` limit — loads all posts. Prior research flags this as a non-blocking issue for the blog phase.
   - What's unclear: Whether pagination is in scope for Phase 14 (Phase 15 Polish) or Phase 14.
   - Recommendation: Phase 14 should add a reasonable limit (e.g., `take: 24`) to prevent loading unbounded data. Full pagination UX (load more / numbered) can be Phase 15.

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/lib/blog-admin-actions.ts` — togglePublishBlogPost bug confirmed at lines 94-107
- `src/components/admin/BlogPostTableColumns.tsx` — direct action call without useTransition confirmed at line 118
- `src/app/(main)/blog/[slug]/page.tsx` — JSON-LD datePublished bug confirmed, sanitizeHtml call confirmed correct
- `src/lib/blog-queries.ts` — query structure, no pagination confirmed
- `src/lib/blog-admin-queries.ts` — admin queries verified
- `src/lib/blog-admin-schemas.ts` — Zod schema verified
- `src/components/admin/BlogPostEditForm.tsx` — form complete, all fields mapped
- `src/components/admin/BlogPostTable.tsx` — TanStack Table wrapper verified
- `src/components/admin/CreateBlogPostDialog.tsx` — dialog and slugify helper verified
- `src/components/blog/BlogPostCard.tsx` — card component verified
- `src/components/blog/BlogFilters.tsx` — category pills, subject pills, sort select verified
- `src/app/(main)/blog/page.tsx` — public listing searchParams handling verified
- `src/lib/sanitize-html.ts` — sanitizeHtml utility verified, comprehensive allowlist
- `src/lib/highlight-code.ts` — highlightCodeBlocks utility verified, used in book reader
- `src/components/admin/ResourceTableColumns.tsx` — ResourceRowActions pattern verified
- `node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts` — MetadataRoute.Sitemap type verified
- `package.json` — all dependencies confirmed installed, no new packages needed
- `.env.local` — NEXT_PUBLIC_APP_URL confirmed at `http://localhost:3000`

### Secondary (MEDIUM confidence — prior project research)

- `.planning/research/SUMMARY.md` — pitfall analysis for blog phase, lines 99 and 145
- `.planning/research/PITFALLS.md` — Pitfall 4 (publishedAt/JSON-LD), Pitfall 8 (slug revalidation), confirmed

## Metadata

**Confidence breakdown:**
- Bugs identified: HIGH — directly readable in source code, not inferred
- Fix patterns: HIGH — copy from ResourceTableColumns (ResourceRowActions) and updateBlogPost (slug fetch pattern)
- Sitemap type: HIGH — verified from installed Next.js 16.1.6 type definitions
- Architecture: HIGH — no structural changes needed, all existing patterns are correct

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable framework, 30 days)
