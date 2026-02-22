# Pitfalls Research

**Domain:** Adding blog, resource library, and interactive simulations to an existing Next.js STEM education platform
**Researched:** 2026-02-22
**Confidence:** HIGH — based on direct inspection of the first-pass implementation code plus verified external sources

> **Note:** This file supersedes the v1.0 pitfalls (book publishing platform). The v1.1 milestone adds blog, resources, and simulations to a working system. Pitfalls here focus on integration correctness, the new untested code paths, and risks specific to these three features.

---

## Critical Pitfalls

### Pitfall 1: Unsanitized HTML in dangerouslySetInnerHTML

**What goes wrong:**
The blog post page (`/blog/[slug]/page.tsx`), resource detail page, and simulation detail page all render database content directly via `dangerouslySetInnerHTML={{ __html: post.content }}`. The simulation page also renders `simulation.teacherGuide` and `simulation.parameterDocs` the same way. If an admin input ever includes `<script>` tags or event handler attributes (`onerror`, `onload`, `onclick`), those execute in the user's browser. This is a stored XSS vector with four separate injection points in the new code.

**Why it happens:**
These fields are admin-only inputs today, which creates a false sense of safety. The admin form accepts raw HTML in a plain `<textarea>` with no sanitization pipeline. The mental model of "only admins write here" ignores: compromised admin account, copy-paste from external CMS, future editor integrations, or bulk import from external sources.

**How to avoid:**
Sanitize HTML at read time on the server before it reaches `dangerouslySetInnerHTML`. Use `sanitize-html` (already in the project's dependency tree — it was added to replace `isomorphic-dompurify` per the v1.0 git history). Create a shared `sanitizeHtml(rawHtml: string): string` utility and wrap every `dangerouslySetInnerHTML` call. Run it in the server component before passing content to the client. Allow-list only safe tags (headings, paragraphs, lists, code, pre, images with safe src, math spans). Strip all event handlers and `javascript:` href values.

**Warning signs:**
- Any `<textarea>` in admin that accepts raw HTML without a preview step
- `dangerouslySetInnerHTML` with a value read directly from the database without an intermediate sanitization call
- Grep for `dangerouslySetInnerHTML` returns 4+ hits in the new code (blog post, resource detail, simulation detail, simulation teacher guide/parameter docs)

**Phase to address:**
Blog phase and Resource/Simulation phase — must be fixed before any content is published.

---

### Pitfall 2: Stripe Webhook Has Dead Code and Implicit Routing That Will Mask Future Bugs

**What goes wrong:**
The `/api/webhooks/stripe/route.ts` now handles two product types in a single handler, routing by which ID fields are present in metadata (`if (resourceId && userId)` vs `else if (bookId && userId)`). The book branch contains an unreachable guard: `if (!bookId)` at line 82 can never be true because the outer `else if (bookId && userId)` already requires `bookId` to be truthy. This dead code signals the handler has grown complex enough to hide logic errors. More dangerously: if a future checkout session accidentally includes both `resourceId` and `bookId` in metadata (e.g., from a test session or configuration error), the resource branch wins silently and the book purchase is skipped with no error logged.

**Why it happens:**
Single-webhook-endpoint patterns accumulate product type branches over time. Each branch looks correct in isolation. Cross-branch interactions and dead code only become visible when reading the full handler together.

**How to avoid:**
- Add an explicit `productType: "book" | "resource"` field to Stripe metadata in both `createCheckoutSession` (book) and `createResourceCheckoutSession` (resource).
- Route the webhook handler by `productType` explicitly: `if (metadata.productType === "resource")` / `else if (metadata.productType === "book")` / `else { log unknown type; return 200 }`.
- Remove the dead-code `if (!bookId)` guard from the book branch.
- Add a log statement for the unhandled-metadata case so silent misrouting becomes visible in server logs.

**Warning signs:**
- Webhook handler uses presence-of-ID heuristics rather than explicit type routing
- Dead code guards inside branches that are gated by the same condition as their parent
- No logging for unhandled or unexpected metadata combinations

**Phase to address:**
Resource phase — when the resource payment flow is verified end-to-end.

---

### Pitfall 3: React.lazy in simulation-registry.ts Will Cause Server-Side Errors

**What goes wrong:**
`simulation-registry.ts` uses `React.lazy(() => import(...))` for all three simulation components. The simulation components call browser-only APIs: `performance.now()` in `ProjectileMotion.tsx`, canvas `getContext("2d")`, and `requestAnimationFrame`. If the Next.js server attempts to execute these imports during SSR (which happens when a Server Component imports a file that transitively imports the registry), the result is a runtime error: `ReferenceError: performance is not defined` or `ReferenceError: window is not defined`. The simulation detail page is a Server Component that imports `SimulationEmbed` (a client component) — the `"use client"` boundary should prevent SSR of the simulations, but `React.lazy` inside a client component is not the Next.js-idiomatic way to achieve this guarantee.

**Why it happens:**
`React.lazy` is the standard React pattern. `next/dynamic` is the Next.js extension that adds an explicit `ssr: false` option and clearer bundling semantics. The difference is subtle but matters: `next/dynamic({ ssr: false })` explicitly excludes the module from the server bundle; `React.lazy` relies on the client component boundary being correctly established.

**How to avoid:**
Convert `simulation-registry.ts` from `React.lazy` to `next/dynamic({ ssr: false })`:
```typescript
import dynamic from "next/dynamic";

export const SIMULATION_REGISTRY = {
  "projectile-motion": dynamic(
    () => import("@/simulations/ProjectileMotion"),
    { ssr: false }
  ),
  "wave-interference": dynamic(
    () => import("@/simulations/WaveInterference"),
    { ssr: false }
  ),
  "spring-mass": dynamic(
    () => import("@/simulations/SpringMass"),
    { ssr: false }
  ),
};
```

**Warning signs:**
- Server errors: `performance is not defined`, `window is not defined`, or `document is not defined` on simulation pages
- Hydration mismatch warnings in browser console
- `React.lazy` appearing in a file that is imported from a Server Component chain

**Phase to address:**
Simulations phase — first task before loading any simulation page.

---

### Pitfall 4: requestAnimationFrame Leak When Navigating Away Mid-Animation

**What goes wrong:**
Each simulation component manages an animation frame ID (e.g., `animRef.current` in `ProjectileMotion.tsx`). The `useEffect` cleanup returns `() => cancelAnimationFrame(animRef.current)`. For `ProjectileMotion`, this is structurally correct — `animRef` is a `useRef`, so the cleanup reads the latest ID value. However, only `ProjectileMotion.tsx` was verified; `SpringMass.tsx` and `WaveInterference.tsx` were not fully audited. A leaked RAF callback executes at 60fps indefinitely, holding closure references and accumulating memory. A static analysis survey of open-source React repositories found 1,230 instances of missing RAF cancellation — this is one of the most common React memory leaks.

**Why it happens:**
RAF cleanup is easy to forget or implement incorrectly. Storing the RAF ID in `useState` instead of `useRef` creates a stale closure in the cleanup function, causing the cancellation to reference an old ID that has already fired.

**How to avoid:**
- Audit `SpringMass.tsx` and `WaveInterference.tsx`: verify every `useEffect` that calls `requestAnimationFrame` returns a cleanup function calling `cancelAnimationFrame(animRef.current)`.
- Always use `useRef` for RAF IDs, never `useState`.
- Test by navigating away from a running simulation and opening Chrome DevTools Performance panel to confirm no ongoing RAF callbacks.

**Warning signs:**
- `requestAnimationFrame` call inside a `useEffect` without a corresponding cleanup
- RAF ID stored in `useState` — stale closure will fail to cancel

**Phase to address:**
Simulations phase — audit all three simulation components during implementation.

---

### Pitfall 5: Blog publishedAt = null Produces Invisible SEO Issues

**What goes wrong:**
The blog post page generates JSON-LD structured data with `datePublished: post.publishedAt?.toISOString()`. When `publishedAt` is null, `datePublished` becomes `undefined`. `JSON.stringify` silently drops `undefined` values, so the JSON-LD output has no `datePublished` field. Google's Rich Results validator treats missing `datePublished` as a warning for Article schema — the article won't appear in date-filtered search results or "Top Stories" carousels.

Additionally, `togglePublishBlogPost` in `blog-admin-actions.ts` sets `publishedAt: publish ? new Date() : undefined`. This means re-publishing a post that was previously unpublished replaces the original publish date with a new timestamp. The article's canonical SEO publication date changes silently every time it's cycled through draft/published.

**Why it happens:**
`publishedAt` is nullable in the schema (designed for future scheduled publishing). The toggle action was written to set it on first publish but doesn't distinguish between "first publish" and "re-publish after edit."

**How to avoid:**
- In `togglePublishBlogPost`, only set `publishedAt` if it is not already set. Fetch the current record first: if `publishedAt` is already populated, leave it unchanged.
- In the JSON-LD generator, fall back to `post.createdAt` if `publishedAt` is null: `datePublished: (post.publishedAt ?? post.createdAt).toISOString()`.
- Also add `app/sitemap.ts` — the three new content types have no sitemap at all. Without a sitemap, Google discovers content only by crawling links, which can take weeks.

**Warning signs:**
- Blog posts visible on the site but absent from Google Search Console within 2 weeks of publishing
- `datePublished` field missing when checking JSON-LD via Google's Rich Results Test tool
- `publishedAt` timestamp on a post changes after it was re-published from a draft state

**Phase to address:**
Blog phase — fix before any posts are published.

---

### Pitfall 6: Simulation componentKey Can Silently Drift from the Registry

**What goes wrong:**
The `SIMULATION_REGISTRY` is a hardcoded map of `componentKey` strings to components. The admin UI populates the dropdown from `SIMULATION_KEYS`. If a simulation's `componentKey` in the database doesn't match any key in the current registry (e.g., a file was renamed in a code deploy, or a typo was made in the admin form), `SimulationEmbed` renders a fallback message: `"Simulation component 'projectile-motion' not found."` This appears as a broken page to users. No error is thrown, no alert is raised, and the simulation detail page appears to load successfully.

A secondary issue: the error message exposes the raw internal `componentKey` string to users, which is an information leak in production.

**Why it happens:**
The `componentKey` is stored as a plain string in the database with no foreign-key relationship to the code registry. Registry is code; database is data. They can drift on any code deploy that renames or removes a simulation file.

**How to avoid:**
- Add a validation check in the resource admin edit page: if `resource.simulation.componentKey` is not in `SIMULATION_KEYS`, show a warning banner to the admin.
- Before any code deploy that renames a simulation file, check for database records using the old key: `prisma.simulation.findMany({ where: { componentKey: "old-key" } })`.
- Change the `SimulationEmbed` fallback from showing the raw `componentKey` to a generic message: "This simulation is temporarily unavailable."

**Warning signs:**
- "Simulation component not found" message appearing on a published simulation detail page
- Admin dropdown shows keys that no longer exist in the registry
- A simulation file rename in git without a corresponding database migration

**Phase to address:**
Simulations phase — implement admin validation and sanitize the error message before publishing any simulations.

---

### Pitfall 7: Resource Success Page Has No User Ownership Check

**What goes wrong:**
`/purchase/resource-success/page.tsx` retrieves a Stripe checkout session by `session_id` from the query string and renders purchase details if `payment_status === "paid"`. There is no check that the current authenticated user is the user who made the purchase. If user A shares or accidentally leaks their `?session_id=cs_...` URL, user B can visit it and see user A's purchase details (the purchased resource title and customer email).

**Why it happens:**
The existing book purchase success page has the same structure and the same gap. This pattern was copied across. The risk is limited because `session_id` values are long random Stripe-generated tokens (not guessable), but sharing or leaking a URL is plausible.

**How to avoid:**
After retrieving the Stripe session, compare `session.metadata.userId` against the current authenticated user's ID. If they don't match (or the user is not authenticated), redirect to home with no details shown. Since the success page shows confirmation only and access is granted via webhook (not this page), this does not affect entitlement — it only affects information disclosure.

**Warning signs:**
- Success page accessible without authentication
- No comparison between session metadata user and currently logged-in user

**Phase to address:**
Resource phase — add the ownership check when verifying the payment flow end-to-end.

---

### Pitfall 8: togglePublishBlogPost Does Not Revalidate the Individual Post URL

**What goes wrong:**
`togglePublishBlogPost` in `blog-admin-actions.ts` calls `revalidatePath("/admin/blog")` and `revalidatePath("/blog")`. It does not call `revalidatePath("/blog/${post.slug}")`. When a draft post is published via the toggle button, the blog index page is freshly rendered (showing the new post), but the post's own detail URL may serve a stale cached response — potentially a 404 or an old version of the content — until Next.js's cache naturally expires or a manual revalidation occurs.

**Why it happens:**
The slug revalidation requires an extra database fetch to get the slug before revalidating. `updateBlogPost` does this correctly (it fetches the slug and revalidates the specific URL). `togglePublishBlogPost` was written as a simpler action and the slug-specific revalidation was omitted.

**How to avoid:**
In `togglePublishBlogPost`, fetch the post slug before updating, then add `revalidatePath("/blog/${post.slug}")` after the update. The pattern is already present in `updateBlogPost` — copy it.

**Warning signs:**
- Publishing a blog post and immediately visiting its URL results in a 404 or stale content
- Blog index shows the post but the post detail page returns 404 until hard refresh

**Phase to address:**
Blog phase — fix during admin workflow verification.

---

### Pitfall 9: Slug Changes Leave Old URLs Stale Indefinitely

**What goes wrong:**
Both `updateResource` and `updateBlogPost` revalidate the new slug URL after saving. Neither revalidates the old slug URL. If an admin changes a resource slug from `wave-interference-demo` to `wave-demo`, the old URL `/resources/wave-interference-demo` continues to serve the cached page from before the slug change. Users who bookmarked the old URL see the old content. Search engines continue to index the old URL. The old cached page only expires when the Next.js cache naturally invalidates (which for SSG pages can be never without explicit revalidation).

**Why it happens:**
To revalidate the old slug, you must know it before the save operation. The current pattern fetches the slug after the update, which gives you the new slug only.

**How to avoid:**
Fetch the current resource/post record (including its current slug) before applying the update. If the slug has changed, call `revalidatePath` on the old slug before saving the new slug. Redirect the old slug to the new slug via a database-backed redirect table or Next.js `next.config.js` redirects (for permanent redirects that also benefit SEO).

**Warning signs:**
- Old URLs still returning content after a slug change
- No redirect in place from old to new URL after slug change

**Phase to address:**
Resource and Blog phases — add old-slug revalidation during admin form testing.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| In-memory rate limiter for downloads | Zero infrastructure needed | Resets on every deploy; does not protect across Vercel instances | MVP only — replace with Redis/Vercel KV if abuse occurs |
| `viewCount` increment as fire-and-forget void | No await = no latency on page load | DB errors swallowed silently; count may be slightly wrong | Acceptable for vanity metrics; not for billing |
| Subject sync via delete-all + recreate | Simple code, no diff logic | Brief moment where resource has no subjects (concurrent read risk) | Wrap in `prisma.$transaction()` to eliminate the window |
| Raw HTML `<textarea>` for content fields | Fastest to implement | XSS risk if sanitization is skipped | Never — always sanitize before rendering, regardless of who wrote the content |
| `React.lazy` instead of `next/dynamic` | Familiar React API | May include browser-API code in server bundle; runtime errors on SSR | Never in Next.js App Router — use `next/dynamic({ ssr: false })` |
| No `sitemap.ts` for new content types | Saves one file | New content is not indexed by search engines until Google discovers it via crawl | Only acceptable pre-launch; add before first blog post is published |
| Dead code in webhook handler (unreachable `if (!bookId)`) | Not intentional | Signals handler complexity; can mask real logic bugs | Fix immediately |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe webhook — multi-product | Routing by presence of `resourceId` vs `bookId` | Add explicit `productType: "book" \| "resource"` to metadata; route by type, not by which IDs are present |
| Stripe webhook — replay safety | Assuming upsert alone is sufficient | Current upsert pattern is idempotent — correct. Keep it. |
| Cloudflare R2 presigned download | Returning the presigned URL as a server redirect | Current code returns `{ url }` as JSON — correct. Verify the download button follows the JSON URL client-side rather than navigating to the API route directly. |
| R2 presigned upload — content type | Deriving content type from client-supplied filename | The filename is untrusted; add an explicit extension allowlist to the upload URL route |
| Next.js `revalidatePath` — slug change | Only revalidating the new slug after a rename | Fetch the old slug first; revalidate both old and new slug; redirect old URL to new |
| Next.js `revalidatePath` — toggle publish | Revalidating the listing page but not the detail URL | Add `revalidatePath("/blog/${slug}")` to `togglePublishBlogPost` |
| `simulation-registry.ts` — componentKey | Renaming a simulation file without updating DB records | Check DB before renaming; add admin validation indicator for mismatched keys |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No pagination on blog/resource listings | Page load grows linearly with content count | Add `take`/`skip` to listing queries; implement cursor-based pagination | At ~50-100 posts/resources — fine today, plan before reaching that threshold |
| `getResourceBySlug` called from both `generateMetadata` and the page component | Double DB query per request | React `cache()` deduplication handles this correctly within a single request — verify cache boundary is not crossed | Not currently a problem; fragile if the call structure changes |
| Simulation JS loaded on listing page | Listing page bundles all simulation code | `SIMULATION_REGISTRY` is only imported by `SimulationEmbed`, which is only on detail pages. Listing page uses `SimulationCard` which does not import the registry — correct. Verify this boundary holds. | Not currently a problem |
| Canvas redraw on every slider state change | Noticeable jankyness | Acceptable for 3 simple simulations; becomes a problem with 10+ on the same page | Not currently a problem at this scale |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `dangerouslySetInnerHTML` with unsanitized DB content | Stored XSS — malicious script execution in user browsers | Sanitize with `sanitize-html` before every `dangerouslySetInnerHTML` call, including `teacherGuide` and `parameterDocs` |
| Raw `componentKey` shown in user-facing error message | Information disclosure (internal registry key names visible to users) | Replace with generic "Simulation temporarily unavailable" |
| No file extension allowlist on resource upload | Admin can store arbitrary file types in R2; downloaded with misleading content headers | Add explicit extension allowlist: `["pdf", "zip", "docx", "xlsx", "pptx", "tex", "ipynb"]`; reject others with 400 |
| Resource success page no user ownership check | User A's purchase details visible to User B if session_id URL is shared | Verify `session.metadata.userId === currentUser.id` before rendering |
| Presigned download URL shared or leaked | Anyone with the URL can download during expiry window | Keep 900s expiry (matches existing book behavior); accept as acceptable tradeoff |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Simulation "component not found" shows raw key string | Users see developer-facing identifiers in error messages | Display "This simulation is temporarily unavailable" |
| Blog posts sortable by date but `publishedAt` can be null | Posts with null `publishedAt` sort unpredictably | Fall back to `createdAt` for sorting when `publishedAt` is null; or require `publishedAt` before publish is allowed |
| Simulation loading shows skeleton indefinitely if component fails | Users cannot distinguish loading from broken | Add a timeout: after 5-8 seconds with no component, show "Simulation unavailable — please try again later" |
| Download button uses `<a href="/api/resource-download?...">` | API route returns JSON; clicking link shows raw JSON in browser if JS fails | Implement as an `onClick` handler that fetches the JSON URL and triggers a programmatic download via a temporary anchor element |
| No sitemap means new content is SEO-invisible | Blog posts, resources, and simulations may take weeks to appear in Google | Add `app/sitemap.ts` covering all published blog posts, resources, and simulations before first publish |

---

## "Looks Done But Isn't" Checklist

- [ ] **Blog content sanitization:** `dangerouslySetInnerHTML` calls exist but no `sanitize-html` wrapper is applied — verify sanitization is wrapping `post.content`, `resource.content`, `simulation.teacherGuide`, `simulation.parameterDocs` before any content is published
- [ ] **Simulation SSR safety:** `simulation-registry.ts` uses `React.lazy` — verify converted to `next/dynamic({ ssr: false })` before loading any simulation page
- [ ] **Resource download button:** Confirm clicking the download button follows the JSON `{ url }` response to trigger a file download, not a browser navigation to the API route showing raw JSON
- [ ] **Blog sitemap:** No `app/sitemap.ts` exists — search engines cannot discover blog posts, resources, or simulations until one is added
- [ ] **Resource success page ownership check:** No check that the current user owns the Stripe session being viewed — add `metadata.userId === session.user.id` guard
- [ ] **Webhook dead code removed:** Unreachable `if (!bookId)` guard inside the book purchase branch — remove it and add explicit `productType` routing
- [ ] **togglePublishBlogPost revalidates post detail URL:** Currently only revalidates `/blog` — add `revalidatePath(\`/blog/${slug}\`)` after fetching the slug
- [ ] **Slug change revalidates old URL:** `updateResource` and `updateBlogPost` do not revalidate the old slug when a slug changes — old URLs serve stale data
- [ ] **RAF cleanup in all three simulations:** Only `ProjectileMotion` verified — audit `SpringMass` and `WaveInterference` for proper `cancelAnimationFrame` cleanup on unmount
- [ ] **Admin simulation dropdown labels:** Admin sees raw registry keys (e.g., `"projectile-motion"`) rather than human-readable names — add display labels to the registry

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| XSS via unsanitized blog HTML | HIGH | Audit all published content for injected scripts; apply sanitize-html to all content at rest; deploy; potentially invalidate all user sessions if exfiltration is suspected |
| Simulation component not found (registry/DB drift) | LOW | Update `componentKey` in database via admin edit form or direct Prisma update |
| Published blog post with wrong `publishedAt` SEO date | MEDIUM | Update `publishedAt` via admin edit form; Google re-crawls within 1-7 days after forced reindex via Search Console |
| Stripe webhook misrouting (resource vs book) | MEDIUM | Check Stripe webhook logs for missed events; replay failed events (current upsert is idempotent so replay is safe); verify purchase records |
| RAF memory leak in production | MEDIUM | Identified via performance profiling; fix requires adding cleanup to each affected `useEffect`; deploy; advise users to reload the tab |
| Stale old URL after slug change | LOW | Call `revalidatePath` on old URL; add redirect from old to new slug in Next.js config or middleware |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unsanitized HTML / XSS | Blog phase (apply to all content fields) | Manual XSS payload test in admin textarea; verify script does not execute on public-facing post page |
| Stripe webhook dead code / routing | Resource phase (payment flow) | Send test webhook events with both `resourceId` and `bookId` in metadata; verify only the correct purchase record is created |
| React.lazy SSR mismatch | Simulations phase (first task) | Load simulation detail page; confirm no server errors and no hydration warnings in browser console |
| RAF memory leak | Simulations phase | Navigate away from a running simulation; confirm RAF callbacks stop in Chrome Performance panel |
| Blog publishedAt null / SEO | Blog phase (before first publish) | Check Google Rich Results Test on a published post; verify `datePublished` field is present in JSON-LD |
| componentKey registry drift | Simulations phase | Add admin validation; test deploying with a non-registry key; verify admin warning appears |
| Resource success page ownership | Resource phase (payment flow) | Test accessing another user's `?session_id=` URL while authenticated as a different user |
| Sitemap missing | Blog phase (before first publish) | Verify `app/sitemap.ts` is present; submit to Google Search Console; confirm blog posts appear |
| Stale cache on slug change | Blog and Resource phases | Change a slug in admin; verify old URL 404s (or redirects) and new URL returns fresh content |
| togglePublishBlogPost missing slug revalidation | Blog phase | Publish a draft post; immediately visit its detail URL without refreshing the admin; verify the page renders correctly |

---

## Sources

- Direct code inspection: `src/app/(main)/blog/[slug]/page.tsx`, `src/app/(main)/resources/[slug]/page.tsx`, `src/app/(main)/simulations/[slug]/page.tsx`, `src/app/api/resource-download/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/lib/simulation-registry.ts`, `src/components/simulations/SimulationEmbed.tsx`, `src/simulations/ProjectileMotion.tsx`, `src/lib/blog-admin-actions.ts`, `src/lib/resource-admin-actions.ts`, `src/app/api/admin/upload-url/route.ts`, `src/app/(main)/purchase/resource-success/page.tsx`
- React XSS via dangerouslySetInnerHTML (Sourcery vulnerability database): https://www.sourcery.ai/vulnerabilities/typescript-react-security-audit-react-dangerouslysetinnerhtml
- Next.js lazy loading guide and next/dynamic vs React.lazy: https://nextjs.org/docs/app/guides/lazy-loading
- Next.js hydration error documentation: https://nextjs.org/docs/messages/react-hydration-error
- Next.js revalidatePath documentation: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- Next.js revalidatePath with dynamic routes issue: https://github.com/vercel/next.js/issues/49387
- Cloudflare R2 presigned URLs documentation: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- RAF memory leak empirical study (1,230 missing cancellations found in OSS): https://stackinsight.dev/blog/memory-leak-empirical-study
- Stripe metadata documentation: https://docs.stripe.com/metadata
- Next.js sitemap API reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

---
*Pitfalls research for: ScienceOne v1.1 — Adding blog, resource library, and simulations*
*Researched: 2026-02-22*
