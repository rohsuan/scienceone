---
phase: 12-resource-public-purchase
verified: 2026-02-22T03:30:00Z
status: passed
score: 6/6 success criteria verified
re_verification: false
human_verification:
  - test: "Browse /resources, apply subject/type/level filter, confirm URL updates and results change"
    expected: "URL gains ?subject=X (or ?type=X, ?level=X) and the card grid updates to matching resources"
    why_human: "Filter wiring is implemented and the query reads URL params, but live DB filtering cannot be confirmed without data"
  - test: "Type a keyword in the search input, wait 300ms, confirm URL gains ?q=keyword"
    expected: "URL updates after 300ms debounce; matching resource cards appear or empty-state shows"
    why_human: "Search debounce and result rendering verified structurally but requires a browser to confirm timing"
  - test: "Navigate to a free resource detail page — confirm Download button shows loading state on click"
    expected: "'Preparing download...' appears; browser redirects to presigned R2 URL (file downloads)"
    why_human: "Requires a free resource with a fileKey in the database and a valid R2 presigned URL to generate"
---

# Phase 12: Resource Public and Purchase Verification Report

**Phase Goal:** Visitors can browse and search published resources with filtering, download free resources instantly, and purchase paid resources through Stripe with correct webhook-driven access gating
**Verified:** 2026-02-22T03:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can browse published resources and filter by subject, type, and level — unpublished resources never appear | VERIFIED | `getPublishedResources` has `isPublished: true` in WHERE; ResourceFilters calls `router.replace` with `?subject`, `?type`, `?level` params; listing page reads all params and passes to query |
| 2 | Visitor can search resources by keyword and results update correctly | VERIFIED | ResourceSearchInput: 300ms debounce `useEffect` updates `?q=` param; `getPublishedResources` has OR clause searching title, description, and subject name with `contains` + `insensitive` mode |
| 3 | Visitor can click "Download" on a free resource and receive the file via presigned R2 URL without being prompted to purchase | VERIFIED | ResourceDownloadButton (49 lines, "use client"): fetches `/api/resource-download?resourceId=...`, parses `{ url }`, sets `window.location.href = url`; `/api/resource-download` route generates presigned R2 URL with 15min expiry; free resources bypass auth+purchase check (`if (!resource.isFree)`) |
| 4 | Visitor sees the price and a "Purchase" button on paid resources; clicking it redirects to Stripe Checkout | VERIFIED | Detail page computes `activePricing = resource.pricing?.isActive ? resource.pricing : null`; renders price (`${Number(activePricing.amount).toFixed(2)}`); ResourceBuyButton calls `createResourceCheckoutSession` which calls `stripe.checkout.sessions.create` and redirects to Stripe URL |
| 5 | After Stripe payment succeeds, the webhook creates a ResourcePurchase record and the resource becomes downloadable for the purchasing user | VERIFIED | Webhook: `productType === "resource"` branch calls `prisma.resourcePurchase.upsert`; download API checks `prisma.resourcePurchase.findUnique` for paid resources; `hasResourcePurchase` query used on detail page sets `purchased = true`, enabling download button |
| 6 | The Stripe webhook routes by explicit `productType` metadata ("book" vs "resource"), eliminating the dead-code implicit routing bug | VERIFIED | Webhook line 40: `if (productType === "resource" && resourceId && userId)`; line 80: `else if (productType === "book" && bookId && userId)`; no `if (!bookId)` dead code found; fallback `else` with `console.warn` + returns 200 |

**Score:** 6/6 success criteria verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Exists | Lines | Substantive | Wired | Status |
|----------|--------|-------|-------------|-------|--------|
| `src/components/resources/ResourceDownloadButton.tsx` | Yes | 49 | Yes — fetch+redirect, loading state, error handling, toast | Yes — imported and rendered in detail page | VERIFIED |
| `src/app/(main)/resources/[slug]/page.tsx` | Yes | 186 | Yes — full detail page with auth, access gating, sidebar | Yes — `ResourceDownloadButton` imported and rendered at line 153 | VERIFIED |
| `src/lib/resource-queries.ts` | Yes | 108 | Yes — full queries with filtering, search, subject/type/level, sort | Yes — imported in listing and detail pages | VERIFIED |

**Note on `contains: "isActive"` artifact check for `resource-queries.ts`:** The plan originally specified adding `isActive` filter in Prisma include. This was auto-fixed during execution — Prisma cannot filter optional one-to-one relations with a `where` clause. Instead, `activePricing = resource.pricing?.isActive ? resource.pricing : null` is computed in the page component (line 73 of detail page). The observable goal (active-only pricing shown) is achieved via a valid alternative mechanism. The SUMMARY documents this deviation explicitly.

### Plan 02 Artifacts

| Artifact | Exists | Lines | Substantive | Wired | Status |
|----------|--------|-------|-------------|-------|--------|
| `src/lib/resource-checkout-actions.ts` | Yes | 69 | Yes — full checkout session creation with auth, price fetch, duplicate check | Yes — imported and called by ResourceBuyButton | VERIFIED |
| `src/lib/checkout-actions.ts` | Yes | 69 | Yes — full checkout session creation for books | Yes — called by book buy button | VERIFIED |
| `src/app/api/webhooks/stripe/route.ts` | Yes | 132 | Yes — full webhook handler with signature verification, two product type branches | Yes — registered as Stripe webhook endpoint | VERIFIED |

### Supporting Artifacts (not in PLAN must_haves, verified for completeness)

| Artifact | Status | Notes |
|----------|--------|-------|
| `src/app/(main)/resources/page.tsx` | VERIFIED | Listing page reads searchParams, calls getPublishedResources, renders ResourceCard grid with empty states |
| `src/components/resources/ResourceFilters.tsx` | VERIFIED | "use client"; reads searchParams, calls router.replace with correct params on change |
| `src/components/resources/ResourceSearchInput.tsx` | VERIFIED | "use client"; 300ms debounce useEffect updates ?q= param |
| `src/components/resources/ResourceCard.tsx` | VERIFIED | Renders title, type, level, subjects, free badge or price |
| `src/components/resources/ResourceBuyButton.tsx` | VERIFIED | "use client"; calls createResourceCheckoutSession via useTransition |
| `src/app/(main)/purchase/resource-success/page.tsx` | VERIFIED | Retrieves Stripe session, shows notFound if unpaid, renders confirmation |
| `src/app/api/resource-download/route.ts` | VERIFIED | Auth+purchase gate for paid resources; rate limiting; generates presigned R2 URL with content-disposition |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `ResourceDownloadButton.tsx` | `/api/resource-download` | fetch on click | WIRED | Line 22-24: `fetch('/api/resource-download?resourceId=${encodeURIComponent(resourceId)}')` |
| `ResourceDownloadButton.tsx` | browser redirect | `window.location.href = url` | WIRED | Line 31: `window.location.href = url;` after parsing `{ url }` |
| `resources/[slug]/page.tsx` | `ResourceDownloadButton` | import + render in sidebar | WIRED | Line 13: import; lines 152-157: conditional render with `resourceId` and `fileName` props |
| `resources/[slug]/page.tsx` | `activePricing` | application-level isActive filter | WIRED | Line 73: `const activePricing = resource.pricing?.isActive ? resource.pricing : null`; used in lines 145, 160, 165 |
| `resource-checkout-actions.ts` | `stripe.checkout.sessions.create` | `metadata.productType: "resource"` | WIRED | Line 58: `productType: "resource"` in metadata block |
| `checkout-actions.ts` | `stripe.checkout.sessions.create` | `metadata.productType: "book"` | WIRED | Line 58: `productType: "book"` in metadata block |
| `webhooks/stripe/route.ts` | `prisma.resourcePurchase.upsert` | `productType === "resource"` branch | WIRED | Line 40: `if (productType === "resource" && resourceId && userId)`; upsert at lines 42-58 |
| `webhooks/stripe/route.ts` | `prisma.purchase.upsert` | `productType === "book"` branch | WIRED | Line 80: `else if (productType === "book" && bookId && userId)`; upsert at lines 83-99 |
| `resource-download/route.ts` | `prisma.resourcePurchase.findUnique` | paid resource access gate | WIRED | Lines 60-68: findUnique with `userId_resourceId` composite key; returns 403 if not found |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RES-03 | 12-01-PLAN.md | Visitor can browse published resources with filtering by subject, type, and level | SATISFIED | `getPublishedResources` with subject/type/level filters; ResourceFilters component updates URL params; listing page passes params to query |
| RES-04 | 12-01-PLAN.md | Visitor can search resources by keyword | SATISFIED | ResourceSearchInput with 300ms debounce; `getPublishedResources` OR search on title, description, subject name |
| RES-05 | 12-01-PLAN.md | Visitor can download free resources without purchase | SATISFIED | `canAccess = resource.isFree || purchased`; download API bypasses auth+purchase check for free resources; ResourceDownloadButton generates presigned URL |
| RES-06 | 12-02-PLAN.md | Paid resources display price and a purchase button | SATISFIED | `activePricing` computed at app level; price displayed as `$N.NN`; ResourceBuyButton renders "Buy — $N.NN" for authenticated users |
| RES-07 | 12-02-PLAN.md | Paid resource checkout via Stripe works end-to-end | SATISFIED | `createResourceCheckoutSession` creates Stripe checkout session and redirects; success page validates session and shows confirmation |
| RES-08 | 12-02-PLAN.md | Stripe webhook creates ResourcePurchase records correctly | SATISFIED | Webhook uses `prisma.resourcePurchase.upsert` in `productType === "resource"` branch; idempotent (upsert); sends email confirmation |
| RES-09 | 12-01-PLAN.md | Purchased resources can be downloaded via presigned R2 URL | SATISFIED | `hasResourcePurchase` query checked on detail page; download API checks `resourcePurchase` record; presigned URL generated with 15min expiry |

**Orphaned requirements check:** Requirements mapping in REQUIREMENTS.md shows RES-03 through RES-09 assigned to Phase 12. All 7 are claimed by plans in this phase. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/webhooks/stripe/route.ts` | 7 | `"re_placeholder"` fallback for Resend API key | Info | Development-only fallback; does not affect webhook routing or purchase recording; email silently fails if env var not set in production |

No stub implementations, empty returns, or TODO/FIXME comments found in phase-modified files.

---

## Human Verification Required

### 1. Filter Controls — URL Parameter Update

**Test:** Navigate to `/resources`, click a subject pill button, then change the type and level dropdowns.
**Expected:** URL updates to include `?subject=X&type=Y&level=Z` after each interaction; resource grid re-renders with filtered results.
**Why human:** Filter wiring is structurally verified (router.replace in onClick/onChange, query reads params), but the live interaction and result filtering requires database data to confirm end-to-end.

### 2. Search Debounce Behavior

**Test:** Type "physics" into the search input on `/resources`, wait approximately 300ms.
**Expected:** URL updates to `?q=physics`; matching resources appear or "No resources match your search" shows with a clear-search link.
**Why human:** The 300ms debounce useEffect is implemented correctly but requires browser timing to confirm the debounce delay and URL update behavior.

### 3. Free Resource Download — Presigned URL Redirect

**Test:** Navigate to a free resource detail page that has a `fileKey` set. Click the "Download" button.
**Expected:** Button shows "Preparing download..." briefly, then the browser navigates to the R2 presigned URL and the file downloads (no JSON rendered in browser).
**Why human:** Requires a free resource with an uploaded file in the database. This is the core bug fix — verifying the client-side fetch-then-redirect replaces the old `<a>` link JSON-in-browser behavior.

---

## Gaps Summary

No gaps found. All 6 success criteria are verified at the code level.

The one notable implementation deviation (isActive filter moved from Prisma query to application layer) was correctly auto-fixed during execution and documented in SUMMARY. The observable behavior — buy button only shows for active pricing — is fully implemented and verified in the detail page.

---

_Verified: 2026-02-22T03:30:00Z_
_Verifier: Claude (gsd-verifier)_
