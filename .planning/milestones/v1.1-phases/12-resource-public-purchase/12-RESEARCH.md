# Phase 12: Resource Public and Purchase - Research

**Researched:** 2026-02-22
**Domain:** Resource browsing, Stripe payment flow, presigned R2 download, webhook routing
**Confidence:** HIGH

## Summary

This phase is primarily verification and bug-fixing, not greenfield development. Every file — the listing page, filters, search input, detail page, download API, checkout action, webhook handler, and success page — already exists as first-pass code. The schema is migrated. The work is finding what's broken and fixing it.

Two confirmed bugs require code changes. First: the resource download button in `src/app/(main)/resources/[slug]/page.tsx` uses a plain `<a>` tag pointing to `/api/resource-download`, but that route returns `NextResponse.json({ url })` — not a redirect. Clicking "Download" currently shows raw JSON in the browser. Fix: extract a `ResourceDownloadButton` client component that fetches the API and sets `window.location.href = data.url`, matching the book `DownloadButton` pattern. Second: the Stripe webhook routes by checking `if (resourceId && userId)` vs `if (bookId && userId)`. The CRITICAL note in STATE.md describes this as "routes by ID presence (dead code), not explicit productType." The fix is to add `productType: "resource"` metadata to `createResourceCheckoutSession` and `productType: "book"` to `createCheckoutSession`, then switch the webhook to route by `metadata.productType` instead of ID presence. This makes routing explicit and eliminates the fragile dual-ID-check pattern.

All other requirements are in place and should work once bugs are fixed. The listing page (`/resources`) already accepts `subject`, `type`, `level`, `sort`, and `q` search params. Filters and search are client components. The detail page shows price + buy button for paid resources, free badge + download button for free resources, and handles the purchased=true case. The success page already exists at `/purchase/resource-success`.

**Primary recommendation:** Fix the two confirmed bugs (download button returns JSON, webhook lacks explicit productType), then verify each success criterion end-to-end via Rodney.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RES-03 | Visitor can browse published resources with filtering by subject, type, and level | `getPublishedResources` already filters by all three; `ResourceFilters` component exists with subject pills + type/level selects |
| RES-04 | Visitor can search resources by keyword | `ResourceSearchInput` debounces `q` param; query ORs title, description, subject name |
| RES-05 | Visitor can download free resources without purchase | Download API checks `resource.isFree`; if true, skips auth/purchase check — works in API; blocked by download button bug (returns JSON not redirect) |
| RES-06 | Paid resources display price and a purchase button | Detail page sidebar shows price and `ResourceBuyButton` when `!canAccess && resource.pricing` — logic is correct |
| RES-07 | Paid resource checkout via Stripe works end-to-end | `createResourceCheckoutSession` server action exists with correct price, metadata, success/cancel URLs — needs productType metadata added |
| RES-08 | Stripe webhook creates ResourcePurchase records correctly | Webhook already upserts `ResourcePurchase` when `resourceId && userId` in metadata — needs productType routing fix |
| RES-09 | Purchased resources can be downloaded via presigned R2 URL | Download API generates presigned URL with 900s expiry — blocked by download button bug |
</phase_requirements>

## Standard Stack

No new packages needed. All dependencies already installed.

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 | App framework, server actions, route handlers | Core stack |
| Prisma | 7 | ORM for `ResourcePurchase` upsert | Core stack |
| Stripe (stripe) | latest | Checkout session creation, webhook verification | Existing payment integration |
| @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner | latest | Presigned R2 URL generation | Existing download pattern |
| Better Auth | latest | Session retrieval in server actions and API routes | Existing auth |
| Sonner (toast) | latest | User feedback on download errors | Existing UI library |

**Installation:** None required.

## Architecture Patterns

### Existing File Map

```
src/
├── app/(main)/
│   ├── resources/
│   │   ├── page.tsx                    # Listing page — server, reads searchParams
│   │   ├── loading.tsx                 # Skeleton grid
│   │   └── [slug]/
│   │       ├── page.tsx                # Detail page — server, auth check, canAccess logic
│   │       └── loading.tsx             # Skeleton detail layout
│   └── purchase/
│       └── resource-success/
│           └── page.tsx                # Success page — retrieves session from Stripe
├── app/api/
│   ├── resource-download/
│   │   └── route.ts                    # GET — auth check, purchase check, presigned URL
│   └── webhooks/
│       └── stripe/
│           └── route.ts                # POST — signature verify, ResourcePurchase upsert
├── components/resources/
│   ├── ResourceCard.tsx                # Card with type/level/subject/price badges
│   ├── ResourceFilters.tsx             # Client: subject pills, type/level/sort selects
│   ├── ResourceSearchInput.tsx         # Client: 300ms debounce → q param
│   └── ResourceBuyButton.tsx           # Client: useTransition → server action redirect
└── lib/
    ├── resource-queries.ts             # getPublishedResources, getResourceBySlug, hasResourcePurchase
    └── resource-checkout-actions.ts    # createResourceCheckoutSession server action
```

### Pattern 1: Client Download Button (fetch → window.location.href)
**What:** The resource download API returns `{ url }` JSON, not a redirect. The UI must fetch the URL client-side then navigate to it.
**When to use:** Any time a download API returns a presigned URL.
**Example (from existing book DownloadButton):**
```typescript
// src/components/catalog/DownloadButton.tsx — exact pattern to replicate
async function handleDownload() {
  setLoading(true);
  try {
    const res = await fetch(`/api/resource-download?resourceId=${resourceId}`);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Download failed");
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  } catch {
    toast.error("Download failed. Please try again.");
  } finally {
    setLoading(false);
  }
}
```

### Pattern 2: Explicit productType Routing in Stripe Webhook
**What:** Add `productType: "book" | "resource"` to checkout session metadata at creation time. Route the webhook handler by this field instead of by ID presence.
**When to use:** Any Stripe webhook that handles multiple product types.
**Example:**
```typescript
// In createResourceCheckoutSession — add to metadata:
metadata: {
  productType: "resource",
  userId: session.user.id,
  resourceId: resource.id,
  resourceSlug: resource.slug,
  userEmail: session.user.email,
},

// In createCheckoutSession (books) — add to metadata:
metadata: {
  productType: "book",
  userId: session.user.id,
  bookId: book.id,
  bookSlug: book.slug,
  userEmail: session.user.email,
},

// In webhook route — route by productType:
const { productType, userId } = session.metadata ?? {};
if (productType === "resource" && userId) {
  // resource purchase branch
} else if (productType === "book" && userId) {
  // book purchase branch
} else {
  // unknown or legacy — log and return 200
}
```

### Pattern 3: Resource Detail Page Access Control
**What:** Determine `canAccess = isFree || hasPurchase`. Show download button if `canAccess && fileKey`. Show buy button if `!canAccess && pricing`.
**Why it works:** The API route independently enforces the same check — UI is convenience, API is security.

### Anti-Patterns to Avoid
- **Direct `<a href="/api/resource-download?...">` for download:** Returns JSON not a redirect. Results in raw JSON page. Use client component with fetch + `window.location.href`.
- **Routing webhook by ID presence:** `if (resourceId && userId)` will silently fail if metadata is ever malformed. Use explicit `productType` field.
- **Trusting client price:** `createResourceCheckoutSession` already fetches price server-side — never pass price from client. This is correct.
- **Calling redirect() after an already-started response:** Server actions that call `redirect()` must not wrap it in try/catch — `redirect()` throws a special Next.js error. The existing code is correct on this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Presigned URL generation | Custom HMAC signing | `@aws-sdk/s3-request-presigner` `getSignedUrl` | Already used in both download routes |
| Stripe signature verification | Manual header parsing | `stripe.webhooks.constructEvent` | Already used; security-critical |
| Auth check in server action | Custom JWT parse | `auth.api.getSession({ headers: await headers() })` | Already used throughout |
| Rate limiting | Redis-backed limiter | In-memory Map (acknowledged tech debt) | Per-process reset on deploy is acceptable for v1.1 |

## Common Pitfalls

### Pitfall 1: Download Button Shows Raw JSON
**What goes wrong:** User clicks "Download", browser navigates to `/api/resource-download?resourceId=...`, sees `{"url":"https://..."}` instead of downloading.
**Why it happens:** Current detail page uses `<a href="/api/resource-download...">` which follows the redirect to the JSON response.
**How to avoid:** Create `ResourceDownloadButton` as a `"use client"` component. On click, fetch the API route, get `{ url }`, then `window.location.href = url`.
**Warning signs:** Clicking Download shows JSON in browser tab.

### Pitfall 2: Webhook Silent Dual-ID Routing
**What goes wrong:** If a future checkout accidentally includes both `bookId` and `resourceId` in metadata (or neither), the `if (resourceId && userId)` check will either misroute or fall through silently.
**Why it happens:** The current routing depends on which ID field is populated rather than an explicit intent field.
**How to avoid:** Add `productType: "book" | "resource"` to both checkout metadata objects. Switch webhook to route by `metadata.productType`.
**Warning signs:** No warning signs until a purchase isn't recorded.

### Pitfall 3: Dead Code in Webhook (bookId early return)
**What goes wrong:** Inside the `else if (bookId && userId)` branch, there is a redundant `if (!bookId)` check that can never be true (line 82). This is harmless but confusing dead code.
**Why it happens:** First-pass code artifact.
**How to avoid:** Remove the dead check when refactoring the webhook.
**Warning signs:** `if (!bookId)` inside a branch that entered because `bookId` is truthy.

### Pitfall 4: Success Page resourceTitle May Show Product Type Label
**What goes wrong:** `session.line_items?.data[0]?.description` reads Stripe's `LineItem.description`, which Stripe sets to the `product_data.name` field. The resource checkout sets `product_data.name = resource.title`. This is correct and will show the resource title.
**Why it's a non-issue:** The Stripe `LineItem.description` field "defaults to product name" per the Stripe type definition. The success page will display the resource title correctly.
**Action:** No change needed on success page.

### Pitfall 5: `resource.pricing` Without `isActive` Check on Detail Page
**What goes wrong:** The detail page shows buy button when `!canAccess && resource.pricing`. The resource-checkout-actions checks `pricing.isActive` before proceeding. If a ResourcePrice row exists but `isActive = false`, the UI shows a buy button but checkout throws "No active pricing found for this resource".
**Why it happens:** The detail page query includes `pricing: true` (full record) but doesn't filter by `isActive`.
**How to avoid:** Either filter in the query (`include: { pricing: { where: { isActive: true } } }`) or check `resource.pricing?.isActive` before rendering the buy button.
**Warning signs:** Buy button appears, user clicks, gets an error.

### Pitfall 6: Missing `productType` in Legacy Webhooks
**What goes wrong:** After adding `productType` routing to the webhook, any existing book purchases in flight (sessions created before the deploy) will lack `productType` in metadata. The webhook will fall through without processing them.
**Why it happens:** Stripe metadata is set at session creation time.
**How to avoid:** Keep a fallback: after checking `productType`, fall back to the old ID-presence logic for backward compatibility, or accept that in-flight sessions at deploy time may need manual recovery. For v1.1 (no real users yet), a clean cutover is fine.

## Code Examples

Verified patterns from existing codebase:

### ResourceDownloadButton (new component — fix for download bug)
```typescript
// src/components/resources/ResourceDownloadButton.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResourceDownloadButtonProps {
  resourceId: string;
  fileName?: string | null;
}

export default function ResourceDownloadButton({
  resourceId,
  fileName,
}: ResourceDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/resource-download?resourceId=${resourceId}`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Download failed");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" disabled={loading} onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Preparing download..." : `Download ${fileName ?? "File"}`}
    </Button>
  );
}
```

### Webhook routing fix (productType)
```typescript
// src/app/api/webhooks/stripe/route.ts — new routing logic
const { productType, userId, resourceId, resourceSlug, userEmail, bookId, bookSlug } =
  session.metadata ?? {};

if (productType === "resource" && resourceId && userId) {
  // resource purchase branch — upsert ResourcePurchase
} else if (productType === "book" && bookId && userId) {
  // book purchase branch — upsert Purchase
} else {
  // unknown productType — log warning, still return 200
  console.warn("Unknown productType in Stripe webhook metadata:", session.metadata);
}
```

### Checkout action metadata fix
```typescript
// src/lib/resource-checkout-actions.ts — add productType
metadata: {
  productType: "resource",          // <-- add this
  userId: session.user.id,
  resourceId: resource.id,
  resourceSlug: resource.slug,
  userEmail: session.user.email,
},

// src/lib/checkout-actions.ts — add productType
metadata: {
  productType: "book",              // <-- add this
  userId: session.user.id,
  bookId: book.id,
  bookSlug: book.slug,
  userEmail: session.user.email,
},
```

### ResourcePrice isActive filter fix
```typescript
// src/app/(main)/resources/[slug]/page.tsx — filter pricing to active only
const resource = await getResourceBySlug(slug);
// OR in getResourceBySlug query:
include: {
  pricing: { where: { isActive: true } },   // was: pricing: true
  ...
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Webhook routes by ID presence | Add explicit `productType` field | Eliminates silent misrouting risk |
| Direct `<a>` link to JSON API route | Client component fetches URL then redirects | Actually downloads the file |

## Open Questions

1. **Should `ResourceDownloadButton` be a new file or update the inline button in the detail page?**
   - What we know: The book pattern uses a standalone `DownloadButton` component in `src/components/catalog/`
   - Recommendation: Create `src/components/resources/ResourceDownloadButton.tsx` for consistency. Replace the `<Button asChild><a>` block in the detail page with it.

2. **Should `getResourceBySlug` filter `pricing: { where: { isActive: true } }` or should the detail page check `resource.pricing?.isActive`?**
   - What we know: `resource-checkout-actions.ts` already guards with `if (!resource.pricing || !resource.pricing.isActive)`. The detail page just checks `resource.pricing != null`.
   - Recommendation: Fix in `getResourceBySlug` query — `include: { pricing: { where: { isActive: true } } }`. This is cleaner and ensures the query contract matches the UI expectation.

3. **Legacy backward compatibility in webhook after adding `productType`?**
   - What we know: No real users yet in v1.1, so no in-flight sessions to preserve.
   - Recommendation: Clean cutover — route by `productType` only. Add a `console.warn` for unknown/legacy payloads. No backward compat needed.

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/app/(main)/resources/[slug]/page.tsx` — download button bug confirmed
- Direct code inspection: `src/app/api/resource-download/route.ts` — confirmed returns JSON `{ url }`
- Direct code inspection: `src/app/api/webhooks/stripe/route.ts` — confirmed ID-presence routing
- Direct code inspection: `src/lib/resource-checkout-actions.ts` — confirmed no `productType` in metadata
- Direct code inspection: `src/components/catalog/DownloadButton.tsx` — confirmed correct fetch pattern
- Direct code inspection: `node_modules/stripe/types/LineItems.d.ts` — `description` field defaults to product name
- Direct code inspection: `prisma/schema.prisma` — `ResourcePurchase` table schema verified
- Direct code inspection: `prisma/migrations/20260222002050_add_resources_blog_simulations/migration.sql` — migration applied, all tables exist

### Secondary (MEDIUM confidence)
- Pattern match: `src/components/catalog/DownloadDropdown.tsx` also uses fetch+redirect — confirms pattern is intentional

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all existing code verified
- Architecture: HIGH — all files read directly, patterns confirmed in codebase
- Pitfalls: HIGH — both bugs confirmed by direct code reading, not speculation

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable codebase, no fast-moving dependencies)
