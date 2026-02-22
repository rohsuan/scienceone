# Architecture Research

**Domain:** STEM education platform — blog, resource library, interactive simulations integrated into existing v1.0 book platform
**Researched:** 2026-02-22
**Confidence:** HIGH (all findings from direct codebase inspection of existing and new code; no inference required)

---

## Context: What Already Exists (v1.0)

This is a subsequent-milestone research file. The v1.0 architecture is in production:
- Next.js 16 App Router with 4 route groups: `(main)`, `(auth)`, `(admin)`, `(reader)`
- Prisma 7 ORM on PostgreSQL, no datasource URL in schema (managed by `prisma.config.ts`)
- Better Auth for sessions (cookie-based, `user.role` field for admin check)
- Cloudflare R2 for file storage (presigned URLs, 900s GET expiry)
- Stripe Checkout + webhook for book purchases
- Server actions with Zod validation (React Hook Form + `zodResolver`)
- shadcn/ui components, Tailwind v4

The v1.1 milestone adds three feature areas. First-pass code exists and is untested.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js 16 App Router                            │
├─────────────────┬──────────────────────┬────────────────────────────────┤
│  (main) routes  │   (admin) routes     │  (auth) + (reader) unchanged   │
│                 │                      │                                 │
│  /blog          │  /admin/blog         │  Better Auth handles sessions   │
│  /blog/[slug]   │  /admin/blog/[id]    │  (reader) handles book access   │
│  /resources     │  /admin/resources    │                                 │
│  /resources/    │  /admin/resources/   │                                 │
│    [slug]       │    [id]              │                                 │
│  /simulations   │                      │                                 │
│  /simulations/  │                      │                                 │
│    [slug]       │                      │                                 │
│  /purchase/     │                      │                                 │
│    resource-    │                      │                                 │
│    success      │                      │                                 │
├─────────────────┴──────────────────────┴────────────────────────────────┤
│                        Server Action Layer                               │
│                                                                          │
│  blog-admin-actions.ts       resource-admin-actions.ts                   │
│  blog-admin-queries.ts       resource-admin-queries.ts                   │
│  blog-queries.ts             resource-queries.ts                         │
│                              resource-checkout-actions.ts                │
├─────────────────────────────────────────────────────────────────────────┤
│                          API Route Layer                                 │
│                                                                          │
│  /api/admin/upload-url   (MODIFIED: added resource-cover, resource-file, │
│                           blog-cover, blog-author upload types)          │
│  /api/resource-download  (NEW: auth + purchase check + R2 presigned GET) │
│  /api/webhooks/stripe    (MODIFIED: handles resourceId alongside bookId) │
├─────────────────────────────────────────────────────────────────────────┤
│                       Data / Storage Layer                               │
│                                                                          │
│  PostgreSQL via Prisma 7               Cloudflare R2                     │
│                                                                          │
│  ┌──────────────┐  ┌────────────────┐  images/resources/{id}/cover-*    │
│  │  BlogPost    │  │   Resource     │  images/blog/{id}/cover-*         │
│  │  BlogPost    │  │   Resource     │  images/blog/{id}/author-*        │
│  │  Subject     │  │   Price        │  resources/{id}/{ts}.{ext}        │
│  │  (shared)    │  │   ResourcePur- │                                   │
│  │              │  │   chase        │  (books/ keys unchanged from v1.0) │
│  └──────────────┘  │   Simulation   │                                   │
│                    │   Subject      │  External: Stripe, Resend          │
│                    └────────────────┘  (both extended, not replaced)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory: New vs Modified

### New Files (v1.1 adds)

| File | Responsibility |
|------|---------------|
| `src/lib/blog-queries.ts` | Public read queries for blog (list, detail, recent); `isPublished: true` filter enforced |
| `src/lib/blog-admin-queries.ts` | Admin read queries (all posts including drafts) |
| `src/lib/blog-admin-actions.ts` | Server actions: create, update, delete, togglePublish blog posts |
| `src/lib/blog-admin-schemas.ts` | Zod schema for BlogPostUpdateData |
| `src/lib/resource-queries.ts` | Public read queries + purchase entitlement check + fire-and-forget view count increment |
| `src/lib/resource-admin-queries.ts` | Admin read queries for resources |
| `src/lib/resource-admin-actions.ts` | Server actions: CRUD + simulation upsert/cleanup + subject sync |
| `src/lib/resource-admin-schemas.ts` | Zod schema for ResourceUpdateData (includes simulation fields) |
| `src/lib/resource-checkout-actions.ts` | Server action: create Stripe checkout session for paid resource |
| `src/lib/simulation-registry.ts` | Static map of componentKey → React.lazy() simulation component |
| `src/app/api/resource-download/route.ts` | GET: auth check, purchase check (paid resources), in-memory rate limiter, R2 presigned GET |
| `src/app/(main)/blog/page.tsx` | Blog listing with category/subject/sort/search URL params |
| `src/app/(main)/blog/[slug]/page.tsx` | Blog post detail with JSON-LD Article structured data |
| `src/app/(main)/blog/loading.tsx` | Loading skeleton |
| `src/app/(main)/resources/page.tsx` | Resource listing with subject/type/level/sort/search URL params |
| `src/app/(main)/resources/[slug]/page.tsx` | Resource detail: free download or buy button; redirects SIMULATION type |
| `src/app/(main)/resources/loading.tsx` | Loading skeleton |
| `src/app/(main)/simulations/page.tsx` | Simulation listing (Resource type=SIMULATION filter) |
| `src/app/(main)/simulations/[slug]/page.tsx` | Simulation detail with SimulationEmbed |
| `src/app/(main)/simulations/loading.tsx` | Loading skeleton |
| `src/app/(main)/purchase/resource-success/page.tsx` | Post-purchase success page (fetches Stripe session to confirm payment) |
| `src/app/(admin)/admin/blog/page.tsx` | BlogPostTable with CreateBlogPostDialog |
| `src/app/(admin)/admin/blog/[postId]/page.tsx` | BlogPostEditForm page |
| `src/app/(admin)/admin/resources/page.tsx` | ResourceTable with CreateResourceDialog |
| `src/app/(admin)/admin/resources/[resourceId]/page.tsx` | ResourceEditForm page (passes SIMULATION_KEYS for dropdown) |
| `src/components/admin/BlogPostEditForm.tsx` | React Hook Form + Zod; tabs: Details, Content, Publishing |
| `src/components/admin/BlogPostTable.tsx` | Data table for blog posts |
| `src/components/admin/BlogPostTableColumns.tsx` | Column definitions |
| `src/components/admin/CreateBlogPostDialog.tsx` | Modal to create draft blog post |
| `src/components/admin/ResourceEditForm.tsx` | React Hook Form + Zod; tabs: Details, Content, Publishing, Simulation (conditional) |
| `src/components/admin/ResourceTable.tsx` | Data table for resources |
| `src/components/admin/ResourceTableColumns.tsx` | Column definitions |
| `src/components/admin/CreateResourceDialog.tsx` | Modal to create draft resource |
| `src/components/admin/FileUploadField.tsx` | XHR upload with progress bar; generates resource-file presigned PUT |
| `src/components/admin/SubjectSelect.tsx` | Multi-select with inline subject creation via createSubject server action |
| `src/components/blog/BlogPostCard.tsx` | Card for blog listing grid |
| `src/components/blog/BlogFilters.tsx` | Client filter bar (category, subject, sort via URL params) |
| `src/components/resources/ResourceCard.tsx` | Card for resource listing; routes SIMULATION type to /simulations/ |
| `src/components/resources/ResourceFilters.tsx` | Client filter bar (subject, type, level, sort via URL params) |
| `src/components/resources/ResourceSearchInput.tsx` | Client search input (URL param based, reused on blog page) |
| `src/components/resources/ResourceBuyButton.tsx` | Client button calling createResourceCheckoutSession server action |
| `src/components/simulations/SimulationCard.tsx` | Card for simulation listing |
| `src/components/simulations/SimulationEmbed.tsx` | Client: registry lookup, Suspense wrapper, fallback skeleton |
| `src/simulations/ProjectileMotion.tsx` | Canvas-based projectile simulation; self-contained client component |
| `src/simulations/WaveInterference.tsx` | Canvas-based wave simulation; self-contained client component |
| `src/simulations/SpringMass.tsx` | Canvas-based spring-mass simulation; self-contained client component |

### Modified Files (v1.1 changes existing)

| File | What Changed |
|------|-------------|
| `src/app/api/admin/upload-url/route.ts` | Added type union branches: `resource-cover`, `resource-file`, `blog-cover`, `blog-author`; accepts `resourceId` alongside `bookId` as entity identifier |
| `src/app/api/webhooks/stripe/route.ts` | Added `resourceId` metadata path; creates `ResourcePurchase` record and sends purchase email for resource purchases |
| `src/lib/purchase-queries.ts` | Added `getUserResourcePurchases()` for dashboard "My Resources" section |
| `src/components/admin/AdminSidebar.tsx` | Added Resources and Blog nav sections |
| `src/app/(main)/dashboard/page.tsx` | Added "My Resources" grid showing paid resource purchases |
| `src/app/(main)/page.tsx` | Added Resource Library and Simulations feature cards in the features section |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── blog/
│   │   │   ├── page.tsx               # list — reads searchParams for filters
│   │   │   ├── [slug]/page.tsx        # detail — JSON-LD Article, no auth required
│   │   │   └── loading.tsx
│   │   ├── resources/
│   │   │   ├── page.tsx               # list — subject/type/level/sort/q filters
│   │   │   ├── [slug]/page.tsx        # detail — buy button or download; redirects SIMULATION
│   │   │   └── loading.tsx
│   │   ├── simulations/
│   │   │   ├── page.tsx               # list — type=SIMULATION filter applied to resource query
│   │   │   ├── [slug]/page.tsx        # detail — SimulationEmbed + teacher guide
│   │   │   └── loading.tsx
│   │   └── purchase/
│   │       └── resource-success/page.tsx
│   ├── (admin)/admin/
│   │   ├── blog/
│   │   │   ├── page.tsx               # BlogPostTable + CreateBlogPostDialog
│   │   │   └── [postId]/page.tsx      # BlogPostEditForm
│   │   └── resources/
│   │       ├── page.tsx               # ResourceTable + CreateResourceDialog
│   │       └── [resourceId]/page.tsx  # ResourceEditForm + SIMULATION_KEYS prop
│   └── api/
│       └── resource-download/route.ts # presigned GET URL for resource files
│
├── lib/
│   ├── blog-queries.ts                # public reads (isPublished enforced)
│   ├── blog-admin-queries.ts          # admin reads (no isPublished filter)
│   ├── blog-admin-actions.ts          # server actions: CRUD + togglePublish
│   ├── blog-admin-schemas.ts          # Zod: BlogPostUpdateData
│   ├── resource-queries.ts            # public reads + view count + purchase check
│   ├── resource-admin-queries.ts      # admin reads
│   ├── resource-admin-actions.ts      # server actions: CRUD + simulation upsert + subject sync
│   ├── resource-admin-schemas.ts      # Zod: ResourceUpdateData (incl. simulation fields)
│   ├── resource-checkout-actions.ts   # Stripe checkout server action
│   └── simulation-registry.ts        # componentKey → React.lazy() map
│
├── simulations/                       # one file per physics simulation (client components)
│   ├── ProjectileMotion.tsx
│   ├── WaveInterference.tsx
│   └── SpringMass.tsx
│
└── components/
    ├── admin/
    │   ├── BlogPostEditForm.tsx        # React Hook Form; 3 tabs
    │   ├── BlogPostTable.tsx
    │   ├── BlogPostTableColumns.tsx
    │   ├── CreateBlogPostDialog.tsx
    │   ├── ResourceEditForm.tsx        # 3-4 tabs (Simulation tab conditional on type)
    │   ├── ResourceTable.tsx
    │   ├── ResourceTableColumns.tsx
    │   ├── CreateResourceDialog.tsx
    │   ├── FileUploadField.tsx         # XHR with progress bar
    │   └── SubjectSelect.tsx           # multi-select + inline subject creation
    ├── blog/
    │   ├── BlogPostCard.tsx
    │   └── BlogFilters.tsx
    ├── resources/
    │   ├── ResourceCard.tsx            # links to /simulations/ if type=SIMULATION
    │   ├── ResourceFilters.tsx
    │   ├── ResourceSearchInput.tsx     # reused on blog page
    │   └── ResourceBuyButton.tsx
    └── simulations/
        ├── SimulationCard.tsx
        └── SimulationEmbed.tsx         # registry lookup + Suspense
```

### Structure Rationale

- **`src/simulations/`** sits outside `components/` because these are physics programs, not UI building blocks. They have no props, no shared logic — each is a standalone canvas-based interactive.
- **`lib/{feature}-queries.ts` vs `lib/{feature}-admin-queries.ts`** — public reads enforce `isPublished: true` and use `React.cache()`. Admin reads fetch all records including drafts, no caching. These must remain separate files to prevent draft content leaking to public pages.
- **`lib/{feature}-admin-actions.ts`** — each feature has its own server action file with a local `requireAdmin()` helper. Not shared to avoid coupling feature modules.
- **`components/{feature}/`** — mirrors the route groups. Prevents naming collisions (`ResourceCard` vs `BookCard`).

---

## Architectural Patterns

### Pattern 1: Simulation as Resource Subtype

**What:** `Simulation` is a 1:1 child record of `Resource` — not an independent entity. Every simulation is a `Resource` with `type: SIMULATION` plus a linked `Simulation` row holding `componentKey`, `teacherGuide`, and `parameterDocs`. This means purchase infrastructure, file delivery, admin CRUD, filtering, and subjects all apply to simulations without duplication.

**When to use:** Every new simulation — create a Resource via the admin UI, select type=SIMULATION, then the Simulation tab appears automatically. The simulation record is upserted on save and deleted if the type changes away from SIMULATION.

**Trade-offs:** Simulations must redirect from `/resources/[slug]` to `/simulations/[slug]`. The resource detail page handles this with an inline redirect (`redirect('/simulations/' + slug)`). This is one extra HTTP hop but keeps the data model clean.

**Example:**
```typescript
// resource-admin-actions.ts
if (validated.type === "SIMULATION" && validated.componentKey) {
  await prisma.simulation.upsert({
    where: { resourceId },
    create: { resourceId, componentKey: validated.componentKey, ... },
    update: { componentKey: validated.componentKey, ... },
  });
} else if (validated.type !== "SIMULATION") {
  // Clean up simulation record when type changes away from SIMULATION
  await prisma.simulation.deleteMany({ where: { resourceId } });
}
```

### Pattern 2: Static Component Registry for Safe Dynamic Rendering

**What:** `simulation-registry.ts` maps string keys to `React.lazy()` components. The `componentKey` stored in the database selects which canvas component to render. `SIMULATION_KEYS` is exported and imported in the admin page to populate the component selector dropdown — the registry is the single source of truth.

**When to use:** Every new simulation requires: (1) create `src/simulations/NewSimulation.tsx`, (2) add entry to the registry. These are an atomic two-file change.

**Trade-offs:** Each new simulation requires a code deploy. This is correct — simulations are interactive physics engines, not content. The benefit is no `eval()`, no dynamic imports from user-controlled strings, no security surface.

**Example:**
```typescript
// simulation-registry.ts
export const SIMULATION_REGISTRY: Record<string, LazyExoticComponent<ComponentType>> = {
  "projectile-motion": lazy(() => import("@/simulations/ProjectileMotion")),
  "wave-interference": lazy(() => import("@/simulations/WaveInterference")),
  "spring-mass": lazy(() => import("@/simulations/SpringMass")),
};

// SimulationEmbed.tsx — runtime lookup
const SimComponent = SIMULATION_REGISTRY[componentKey];
if (!SimComponent) return <ErrorState />;
return <Suspense fallback={<Skeleton />}><SimComponent /></Suspense>;
```

### Pattern 3: Shared Subject Taxonomy Across Content Types

**What:** The `Subject` model is shared between `Resource` (via `ResourceSubject`) and `BlogPost` (via `BlogPostSubject`). Both admin forms use the same `SubjectSelect` component, which supports inline subject creation via the `createSubject` server action. Public filter bars on `/resources` and `/blog` both call `getSubjects()` from `resource-queries.ts`.

**When to use:** Any future content type that needs subject tagging should join the same `Subject` table. Do not create parallel subject systems.

**Trade-offs:** Subjects created in the resource admin appear immediately in the blog admin and vice versa — this is the desired cross-content behavior. Subject deletion is not currently implemented, which prevents orphan cleanup but also prevents accidental data loss during the build phase.

### Pattern 4: URL-Param–Driven Filtering

**What:** All filter/search state lives in URL search params. Filter components call `router.replace()` on change. Page components read `searchParams` as a Promise (Next.js 16 async pattern) and pass values directly to Prisma `where` clauses. No client-side filter state.

**When to use:** All public listing pages (`/blog`, `/resources`, `/simulations`). Do not use `useState` for filter state in these components.

**Trade-offs:** Filters are bookmarkable and shareable. Server re-renders on each filter change — at current data volumes (tens to low hundreds of items) this is faster than maintaining a client-side filter state machine. Add ISR or pagination if lists grow to hundreds of items.

**Example:**
```typescript
// ResourceFilters.tsx
function setParam(key: string, value: string | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (value) params.set(key, value); else params.delete(key);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}
```

### Pattern 5: Extended Upload-URL Route (Single Route, Multiple Types)

**What:** The existing `/api/admin/upload-url` route was extended (not duplicated) to handle four new upload types: `resource-cover`, `resource-file`, `blog-cover`, `blog-author`. Each type maps to a distinct R2 key prefix and content type. The route accepts either `bookId` or `resourceId` as the entity identifier.

**When to use:** Add any new upload type to the type union in this single route. Do not create parallel upload routes.

**Trade-offs:** The route grows by if/else branches. Currently 7 type branches — manageable. The alternative (separate routes per content type) creates more API surface to secure and maintain.

---

## Data Flows

### Resource Purchase Flow

```
User clicks "Buy" on /resources/[slug]
    ↓
ResourceBuyButton (client) calls createResourceCheckoutSession (server action)
    ↓
Server action: auth check → fetch resource+pricing from DB (server-side, never trust client price)
    → check for existing ResourcePurchase (redirect if already owned)
    → stripe.checkout.sessions.create() with metadata: { userId, resourceId, resourceSlug }
    → redirect() to Stripe hosted checkout
    ↓
Stripe sends POST to /api/webhooks/stripe on payment completion
    ↓
Webhook: reads metadata.resourceId → prisma.resourcePurchase.upsert()
    → send confirmation email via Resend (fire-and-forget, void)
    ↓
Stripe redirects to /purchase/resource-success?session_id=...
    ↓
Success page: stripe.checkout.sessions.retrieve() to confirm payment_status === "paid"
```

### File Download Flow

```
User clicks download link: /api/resource-download?resourceId=...
    ↓
Route: fetch resource from DB (isPublished, fileKey)
    ↓
If resource.isFree = false:
    → check Better Auth session
    → check ResourcePurchase exists for (userId, resourceId)
    → return 401/403 if either check fails
    ↓
In-memory rate limit check (10 req/min per userId+resourceId key)
    ↓
getSignedUrl(R2, GetObjectCommand { Key: resource.fileKey, ResponseContentDisposition: "attachment;..." }, { expiresIn: 900 })
    ↓
Return JSON { url } — browser follows URL to R2 directly
```

### Simulation Render Flow

```
Server renders /simulations/[slug]
    ↓
getResourceBySlug(slug) → Prisma: Resource + Simulation (componentKey)
    + fire-and-forget view count increment
    ↓
Page passes componentKey as prop to SimulationEmbed (client component boundary)
    ↓
SimulationEmbed: SIMULATION_REGISTRY[componentKey] → LazyComponent
    ↓
React.Suspense shows skeleton while JS chunk downloads
    ↓
Canvas simulation mounts, requestAnimationFrame loop starts
    ↓
User interacts with sliders → simulation state updates → canvas redraws
```

### Blog Content Flow

```
Admin creates draft: CreateBlogPostDialog → createBlogPost server action
    ↓
Admin edits in BlogPostEditForm:
    → React Hook Form + Zod validation client-side
    → updateBlogPost server action
    → blogPostUpdateSchema.parse(data) server-side
    → prisma.blogPost.update()
    → subject sync: deleteMany + createMany (full replace, not diff)
    → revalidatePath("/blog") + revalidatePath("/blog/[slug]")
    ↓
Public access:
    → getBlogPostBySlug(slug) — where: { slug, isPublished: true }
    → Page renders JSON-LD Article schema.org structured data
    → No auth required for reading
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Stripe | Checkout session creation (server action) + webhook verification (route handler) | Resource and book purchases handled by same webhook; differentiated by presence of `metadata.resourceId` vs `metadata.bookId` |
| Cloudflare R2 | Presigned PUT for admin uploads; presigned GET for user downloads | Resource files: 900s GET expiry (same as book PDFs). Blog/resource images served directly from R2 public URL stored as R2 key |
| Resend | Fire-and-forget email on purchase completion | Resource purchases reuse `PurchaseConfirmationEmail` template; `bookSlug`/`bookTitle` fields are repurposed for resource data |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Simulation registry → Admin UI | `SIMULATION_KEYS` exported from registry, imported by admin resource edit page | Adding a simulation = code deploy + admin UI update. These must always stay in sync. |
| Resource model → Simulation model | 1:1 optional relation; `resource.simulation` included in all queries | Simulation record deleted server-side if type changes away from SIMULATION |
| Blog filter → Subject taxonomy | `getSubjects()` from `resource-queries.ts` called by both blog and resource list pages | Shared taxonomy; importing from resource-queries is correct (Subjects exist there) |
| Resource purchase → Dashboard | `getUserResourcePurchases()` in `purchase-queries.ts` feeds "My Resources" on dashboard | No reading progress for resources (unlike books) |
| Upload route → R2 | Single `/api/admin/upload-url` route handles all content types | `resourceId` OR `bookId` accepted as entity ID; route uses whichever is present |

---

## Anti-Patterns

### Anti-Pattern 1: Trusting Client-Sent Prices

**What people do:** Pass `amount` from client JS to the checkout server action.
**Why it's wrong:** Any user can modify the DOM or intercept the network request to set the price to $0.01.
**Do this instead:** `createResourceCheckoutSession` already fetches price exclusively from `prisma.resource.findUnique` on the server. Never accept `amount` as a parameter to the checkout action.

### Anti-Pattern 2: Adding a Simulation Without Updating the Registry

**What people do:** Create `src/simulations/NewSimulation.tsx` but forget to add the entry to `SIMULATION_REGISTRY`.
**Why it's wrong:** The admin dropdown will not show the component. `SimulationEmbed` renders an error state ("component not found").
**Do this instead:** The registry entry and the simulation file are an atomic two-file change. Never create one without the other.

### Anti-Pattern 3: Using Admin Queries in Public Pages

**What people do:** Reuse `getResourceAdmin()` (which fetches unpublished records) in public-facing pages.
**Why it's wrong:** Exposes draft content to unauthenticated users.
**Do this instead:** Public queries in `resource-queries.ts` always include `isPublished: true`. Admin queries in `resource-admin-queries.ts` omit this filter. These files must never be mixed.

### Anti-Pattern 4: Rendering `dangerouslySetInnerHTML` on User-Generated Content

**What people do:** Store raw HTML in content fields and render via `dangerouslySetInnerHTML` without sanitization.
**Why it's acceptable now:** Blog post and resource content are admin-only input. This is safe for now.
**Why it becomes dangerous:** If any non-admin content is ever rendered this way (user comments, submitted resources), it becomes an XSS vector.
**Do this instead:** Continue restricting content creation to admin. If user-generated content is added, sanitize with `sanitize-html` before storing — the package is already in the project from the ingest pipeline.

### Anti-Pattern 5: Importing `ResourceSearchInput` into Blog Pages

**What currently exists:** The blog listing page (`/blog/page.tsx`) imports `ResourceSearchInput` from `src/components/resources/`. This works but creates a cross-module dependency.
**Why it matters:** Confuses the component folder semantics. If blog search behavior diverges from resource search, there's now hidden coupling.
**Do this instead:** Extract to `src/components/common/SearchInput.tsx` or create `src/components/blog/BlogSearchInput.tsx`. This is a low-priority cleanup item, not a blocker.

### Anti-Pattern 6: In-Memory Rate Limiter at Multi-Instance Scale

**What exists:** `src/app/api/resource-download/route.ts` uses an in-memory `Map` for rate limiting (10 req/min per user+resource).
**Why it breaks:** Each serverless function instance has its own memory. A user can hit 10 requests per instance, not 10 requests total. At low traffic this is fine.
**Do this instead:** Replace with Upstash Redis rate limiter before production traffic is significant. The interface is the same — swap `Map` operations for Redis INCR with TTL.

---

## Build Order Recommendation

Dependencies between v1.1 components require this sequence:

1. **Run Prisma migration** — creates `subjects`, `resources`, `resource_prices`, `resource_purchases`, `simulations`, `blog_posts`, `blog_post_subjects` tables. Seed initial subjects.

2. **Subject infrastructure** — `Subject` is a shared dependency for both resources and blog. Test `SubjectSelect` + `createSubject` server action first.

3. **Resource admin** — `ResourceEditForm`, `FileUploadField`, admin pages, `updateResource` server action. Verify: create resource, upload file, toggle publish, type=SIMULATION reveals Simulation tab.

4. **Resource public** — `ResourceCard`, `ResourceFilters`, list page, detail page. Verify: published resource appears in listing, free download generates presigned URL, `getResourceBySlug` view count increments.

5. **Resource purchase** — `ResourceBuyButton`, `createResourceCheckoutSession`, webhook handler extension, `/purchase/resource-success`. Verify: Stripe test mode purchase creates `ResourcePurchase` row, paid download gate enforces entitlement, confirmation email fires.

6. **Simulation registry and components** — Register all 3 existing simulations. Verify `SimulationEmbed` renders each `componentKey`. Verify admin dropdown lists keys. Test `/simulations/[slug]` page loads and canvas renders.

7. **Blog admin** — `BlogPostEditForm`, admin pages, `updateBlogPost` server action. Verify: create draft, upload cover image, set publish date, toggle published.

8. **Blog public** — `BlogPostCard`, `BlogFilters`, list page, detail page. Verify: JSON-LD renders in page source, category and subject filters work, `isPublished: false` posts do not appear.

9. **Dashboard integration** — Verify "My Resources" section shows paid purchases. Test with a purchase made in step 5.

10. **Homepage integration** — Verify Resource Library and Simulations feature cards link correctly.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is correct. In-memory rate limiting is acceptable. No caching layer needed. |
| 1k-10k users | Add ISR (`export const revalidate`) to blog and resource list pages. Move in-memory rate limiter to Upstash Redis to avoid per-instance state. Consider pagination on resource/blog lists. |
| 10k+ users | Add PostgreSQL indexes on `(isPublished, createdAt)` and `(isPublished, viewCount)` for resource queries. Consider Cloudflare edge caching for static blog content. |

### Scaling Priorities

1. **First bottleneck:** Resource/blog list pages load all matching records with full relations. At hundreds of resources, add `take`/`skip` pagination and database indexes on frequently-filtered columns.
2. **Second bottleneck:** The in-memory rate limiter on `/api/resource-download` provides no real protection at multi-instance scale. Swap to Upstash Redis before launch if download volume is significant.

---

## Sources

All findings are from direct code inspection of the ScienceOne repository at commit `a7ee42c` (2026-02-22). No external sources consulted — this is codebase-specific architecture documentation.

---
*Architecture research for: ScienceOne v1.1 — blog, resource library, interactive simulations*
*Researched: 2026-02-22*
