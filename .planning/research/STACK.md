# Stack Research

**Domain:** v1.1 additions — blog content management, filterable resource library, interactive canvas-based physics simulations
**Researched:** 2026-02-22
**Confidence:** HIGH — all findings based on direct codebase inspection of existing first-pass code plus verification against current package.json

---

## Context: What Already Exists

The existing stack (Next.js 16, Prisma 7, Better Auth, Tailwind v4, shadcn/ui, Stripe, Cloudflare R2, KaTeX, Resend) is validated and in production. This document covers only what is NEW or CHANGED for the v1.1 features.

**Existing packages already covering v1.1 needs:**
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/markdown` — already installed for chapter editing
- `shiki` — already installed for server-side code highlighting in book reader
- `sanitize-html` + `@types/sanitize-html` — already installed for HTML sanitization
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` — already used for book downloads; resource downloads reuse identical pattern
- `stripe` — already handles book purchases; resource purchases reuse identical pattern
- `react-hook-form` + `@hookform/resolvers` + `zod` — already used in admin forms; blog/resource admin forms reuse same pattern
- `@tanstack/react-table` — already used for books table; blog/resource admin tables reuse same
- `lucide-react`, `sonner`, `use-debounce` — already present; used by new filter/search components

---

## What the First-Pass Code Actually Uses

### Simulations
- **Pure browser Canvas API** — no external library. `requestAnimationFrame` loop, `canvas.getContext("2d")`, pixel-level `ImageData` manipulation (wave interference uses `putImageData` for per-pixel rendering). Zero npm dependencies beyond React.
- **React `lazy()` + `Suspense`** — already in React 19, no additional package. `simulation-registry.ts` maps string keys to dynamically imported components.
- Pattern: simulation components are `"use client"` components in `src/simulations/`, registered by key, loaded on demand.

### Blog
- **Content stored as raw HTML** in `BlogPost.content` (Text column). The admin editor is a plain `<Textarea>` with `font-mono` — intentionally simple for a founder-managed platform.
- **Rendered via `dangerouslySetInnerHTML`** in `prose` class. Currently missing: Shiki code highlighting (the book reader applies `highlightCodeBlocks()` before render; blog page does not).
- **SEO**: `generateMetadata` + JSON-LD `Article` schema already implemented in the first-pass code.
- **Filtering**: URL-param-driven server-side filtering via Prisma (`category`, `subject`, `q`, `sort`). Client-side `BlogFilters` component already exists using `useRouter` + URL params.

### Resource Library
- **Free downloads**: `/api/resource-download` route generates presigned R2 URL (900s), returns JSON `{ url }`. Client fetches URL, redirects to it. Identical pattern to book downloads.
- **Paid downloads**: Stripe Checkout (same hosted redirect pattern as books) via `createResourceCheckoutSession` server action. Webhook handling needed in existing `/api/webhooks/stripe/route.ts`.
- **Filtering**: Same URL-param pattern as blog. `ResourceFilters` and `ResourceSearchInput` already exist.

---

## Recommended Stack Additions

### No New Core Dependencies Required

The simulations, blog, and resource library features are fully implementable with the existing installed packages. The analysis found zero gaps requiring new npm dependencies.

### Supporting Libraries (No Action Needed — Already Installed)

| Library | Version (installed) | Role in v1.1 | Status |
|---------|--------------------|----|--------|
| `@tiptap/react` | `^3.20.0` | Rich text editing — available for blog content if textarea UX is insufficient | Installed, not wired to blog editor |
| `shiki` | `^3.22.0` | Server-side code syntax highlighting for blog posts | Installed, not applied to blog render path |
| `sanitize-html` | `^2.17.1` | Sanitize HTML before storage in blog/resource content | Installed, verify it is called before saving |
| `use-debounce` | `^10.1.0` | Debounce search input in blog/resource filters | Installed, used in filter components |

---

## Decisions on Identified Gaps

### Gap 1: Blog content editor is a raw `<Textarea>` (HTML)

**Current state:** `BlogPostEditForm.tsx` uses `<Textarea>` for `content` field. Admin enters raw HTML. No WYSIWYG.

**Decision: Keep the textarea — do NOT add TipTap to the blog editor.**

TipTap is already installed for chapter editing and works well there. However, adding it to the blog admin would require:
- A new TipTap instance with different extensions (no KaTeX needed for blog posts)
- Teaching it to output clean HTML compatible with the existing `prose` rendering
- Extra complexity with no user-facing benefit (founder-only admin, one user)

The textarea approach is correct for a founder-managed blog with low posting frequency. The admin can paste HTML from any source. If richer editing is needed later, TipTap can be wired in with a single component swap — the data model already supports it.

**What IS needed:** The blog admin form's `ImageUploadField` currently passes `bookId` prop — this is a naming bug that needs fixing. The prop name is semantically wrong for blog posts but functionally works since it's just used as a path prefix.

### Gap 2: Shiki code highlighting not applied to blog posts

**Current state:** `src/lib/highlight-code.ts` exists and `highlightCodeBlocks()` is used in the book reader page. The blog post page (`/blog/[slug]/page.tsx`) renders `post.content` via `dangerouslySetInnerHTML` without passing through `highlightCodeBlocks()`.

**Decision: Apply `highlightCodeBlocks()` to blog post content before rendering.**

`shiki` is already installed. The fix is a one-line addition in `BlogPostPage`:
```typescript
const highlightedContent = post.content
  ? await highlightCodeBlocks(post.content)
  : null;
```
Then render `highlightedContent` instead of `post.content`. No new library, no new install. Same applies to resource detail pages if their content contains code blocks.

### Gap 3: Resource download redirects directly (security concern)

**Current state:** Resource detail page links directly to `/api/resource-download?resourceId=...` via an `<a>` tag. The API route generates a presigned URL and returns JSON — but the `<a>` link navigates the user to the JSON endpoint, not the file.

**Decision: This is a bug in the first-pass code, not a library gap.** The client needs to call the endpoint, receive the JSON, then redirect to the presigned URL. `ResourceBuyButton.tsx` handles purchase; a `ResourceDownloadButton` client component needs to handle the download flow (fetch → redirect). No new library needed.

### Gap 4: Stripe webhook does not handle ResourcePurchase yet

**Current state:** `/api/webhooks/stripe/route.ts` handles `checkout.session.completed` for books (`Purchase` model). Resource purchases use the same Stripe Checkout flow but the webhook handler needs a branch for `resourceId` in session metadata to create `ResourcePurchase` records.

**Decision: Extend the existing webhook handler.** No new library. The `createResourceCheckoutSession` server action already sets `metadata.resourceId` on the Stripe session. The webhook branch is the missing piece.

---

## What NOT to Add

| Do Not Add | Why | What to Use Instead |
|------------|-----|---------------------|
| `matter.js` / `cannon.js` / `rapier` | Physics engine overkill — all 3 simulations use analytical equations, not rigid body simulation. Adding a physics engine would increase bundle size and complexity for zero gain. | Pure Canvas API + `requestAnimationFrame` (already working) |
| `p5.js` | Creative coding library that would simplify drawing but adds 800KB+ to the client bundle. The existing simulations are 200-300 lines each and don't need it. | Native Canvas 2D context (already working) |
| `react-chartjs-2` / `recharts` | Not needed for physics simulations — the canvas renders the physics directly. Charts would be appropriate for data visualizations but simulations are interactive, not charts. | Canvas API (already working) |
| `marked` / `remark` for blog | The blog content is stored as HTML (not Markdown). A Markdown parser is unnecessary. | `dangerouslySetInnerHTML` with `sanitize-html` (already installed) |
| `next-mdx-remote` / `contentlayer` | File-system-based CMS patterns are wrong here — blog content is database-driven via Prisma. These tools solve a different problem. | Prisma `BlogPost.content` (already in schema) |
| A headless CMS (Sanity, Contentful) | Single-founder platform with admin UI already built. External CMS adds cost, vendor dependency, and sync complexity. | In-app admin dashboard (already exists) |
| `react-query` / `swr` for resource filtering | Resource and blog filtering is entirely server-driven via URL params + Next.js Server Components. No client-side fetching needed for filter state. | URL params + server components + `router.push` (already implemented) |

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Keep plain textarea for blog content | Add TipTap to blog editor | TipTap already installed but adds complexity for single-founder use; textarea is sufficient; decision can be revisited when post volume increases |
| Pure Canvas API for simulations | WebGL / Three.js | All 3 simulations are 2D and analytically simple. WebGL has no benefit here and adds significant complexity. Canvas 2D is the correct tool. |
| React `lazy()` for simulation loading | Static import of all simulations | Lazy loading prevents loading all simulation bundles on pages that show only one simulation |
| Existing `sanitize-html` for blog HTML | DOMPurify | `sanitize-html` already installed and in use. DOMPurify is redundant. The `isomorphic-dompurify` package was already removed (commit `a7ee42c`) due to Vercel incompatibility. |

---

## Integration Points for v1.1

### Blog Integration
- Admin: `BlogPostEditForm` → server action `updateBlogPost` → Prisma `BlogPost` upsert
- Public: `BlogPage` (server) → `getPublishedBlogPosts` → `BlogPostCard` grid
- Article: `BlogPostPage` (server) → `getBlogPostBySlug` → apply `highlightCodeBlocks` → render with `prose`
- Revalidation: `revalidatePath("/blog")` + `revalidatePath("/blog/[slug]")` on admin save (already in `blog-admin-actions.ts`)

### Resource Library Integration
- Admin: `ResourceEditForm` → server action `updateResource` → Prisma `Resource` + optional `ResourcePrice` + optional `Simulation` upsert
- Public: `ResourcesPage` (server) → filter by type/level/subject → `ResourceCard` grid
- Detail: `ResourceDetailPage` (server) → auth check → `canAccess = isFree || purchased` → download button or buy button
- Download: Client button fetches `/api/resource-download?resourceId=...` → redirect to presigned URL (needs client component fix)
- Purchase: `createResourceCheckoutSession` → Stripe Checkout → webhook creates `ResourcePurchase`

### Simulation Integration
- Routing: `/simulations/[slug]` fetches `Resource` where `type = SIMULATION` + joins `Simulation` for `componentKey`
- Rendering: `SimulationEmbed` resolves `componentKey` → `SIMULATION_REGISTRY[key]` → `lazy()` component → `Suspense` fallback
- New simulations: Add file to `src/simulations/`, add key to `SIMULATION_REGISTRY` in `simulation-registry.ts`, create `Resource` + `Simulation` DB records via admin

---

## Sources

- Direct codebase inspection — `package.json`, all simulation files, blog/resource pages, admin forms, API routes — HIGH confidence
- `src/simulations/ProjectileMotion.tsx`, `WaveInterference.tsx`, `SpringMass.tsx` — confirmed pure Canvas API, no external physics library — HIGH confidence
- `src/components/simulations/SimulationEmbed.tsx` + `src/lib/simulation-registry.ts` — confirmed React `lazy()` + registry pattern — HIGH confidence
- `src/app/(main)/blog/[slug]/page.tsx` — confirmed Shiki not applied to blog content — HIGH confidence
- `src/app/api/resource-download/route.ts` — confirmed presigned URL approach identical to book downloads — HIGH confidence
- `src/lib/resource-checkout-actions.ts` — confirmed Stripe Checkout reuse pattern — HIGH confidence
- `git log` — commit `a7ee42c` removed `isomorphic-dompurify` (Vercel incompatibility); `sanitize-html` is the correct sanitizer — HIGH confidence

---

*Stack research for: ScienceOne v1.1 — blog, resource library, interactive simulations*
*Researched: 2026-02-22*
