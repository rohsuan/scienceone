# Phase 6: Secure Downloads - Research

**Researched:** 2026-02-19
**Domain:** Presigned URL generation (AWS SDK v3 + Cloudflare R2), Next.js API route authorization, download UX patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Download placement
- Download buttons appear in three locations: book detail page, My Library cards, and inside the reader header
- Open-access books require login before downloading (no anonymous downloads)

#### Print purchase link
- Print link appears in the book metadata section (near ISBN, page count, dimensions) — not grouped with main buy/read actions
- No price shown on print link — just the link text, price is on the external site
- Print link only appears when a printPurchaseUrl is configured — hidden completely otherwise

### Claude's Discretion

- Button grouping strategy per placement (dropdown vs separate)
- Download click behavior and user feedback
- Filename format for downloads
- Rate limiting / abuse prevention
- Access denial patterns (redirect vs inline message vs 403)
- Missing artifact handling
- Expired URL error presentation
- Print link visual styling
- Download button visibility for unpurchased users (visible-but-locked vs hidden)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DL-01 | User can download purchased books as PDF (secured with time-limited presigned URLs) | `getSignedUrl` + `GetObjectCommand` from installed `@aws-sdk/s3-request-presigner@3.992.0`; Book.pdfKey already in schema; access check via existing `hasPurchasedBySlug`/`hasPurchased` functions |
| DL-02 | User can download purchased books as EPUB | Same mechanism as DL-01; Book.epubKey already in schema |
| DL-03 | Book detail page shows print purchase link (external link to buy print edition) | `Book.printLink` field already exists in schema AND is already rendered on the detail page as a bare text link — this is already implemented but needs moving to metadata section |
</phase_requirements>

---

## Summary

Phase 6 is fundamentally an authorization + presigned URL generation problem. The core mechanism (`@aws-sdk/s3-request-presigner`) is already installed and the R2 client pattern is already established in `scripts/lib/r2-upload.ts`. The schema already has `pdfKey`, `epubKey`, and `printLink` on the Book model. The Download audit table is already defined. The main work is: (1) a new API route that verifies session + purchase entitlement and returns a presigned URL, (2) a shared `DownloadButton` client component that calls it and triggers the browser download, and (3) wiring that component into the three placement locations (detail page, library card, reader header).

The `anchor download` attribute does not work for cross-origin URLs (which presigned R2 URLs are). The correct pattern is to set `ResponseContentDisposition: 'attachment; filename="book-title.pdf"'` on the `GetObjectCommand` so the R2 response itself carries the Content-Disposition header, then navigate to the presigned URL with `window.open(url, '_blank')` or `window.location.href = url`. This sidesteps the cross-origin restriction entirely.

Open-access access rule per the locked decision: login required, no purchase required. The API route must distinguish between `isOpenAccess` (session sufficient) and paid books (session + Purchase record required).

**Primary recommendation:** Single GET API route `/api/download?bookSlug=...&format=pdf|epub` performs auth + entitlement check, generates a 15-minute presigned URL with `ResponseContentDisposition`, logs to Download table, and returns `{ url }` as JSON. Client component fetches, then sets `window.location.href = url` to trigger browser download without a new tab.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@aws-sdk/s3-request-presigner` | 3.992.0 (installed) | `getSignedUrl()` for presigned GET URLs | Official AWS SDK; already in package.json |
| `@aws-sdk/client-s3` | 3.992.0 (installed) | `GetObjectCommand` with response header overrides | Already in package.json |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | 2.0.7 (installed) | Toast feedback on download error | For error states only; no toast on success (browser handles the download) |
| `lucide-react` | 0.574.0 (installed) | Download icon (`Download` icon) | Button icon for all three placement locations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| API route returning JSON `{ url }` | Server Action | Server Actions return void or redirect; returning a URL to trigger `window.location.href` requires a Route Handler (GET), not a Server Action |
| `window.location.href = url` | `<a href={url} download>` | `download` attribute does not work for cross-origin URLs. R2 presigned URLs are on `*.r2.cloudflarestorage.com` — a different origin. Must use ResponseContentDisposition on the S3 command instead. |
| Simple in-memory rate limit | Upstash Redis | Redis is correct for multi-instance prod; in-memory Map is sufficient for this single-server deployment and adds zero dependencies |

**Installation:** No new packages needed — `@aws-sdk/s3-request-presigner` and `@aws-sdk/client-s3` are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       └── download/
│           └── route.ts          # GET handler: auth + entitlement + presign + log
├── lib/
│   └── r2.ts                     # Shared R2 client (extracted from scripts/lib/r2-upload.ts pattern)
└── components/
    ├── catalog/
    │   └── DownloadButton.tsx    # Client component: fetch presigned URL, trigger download
    ├── dashboard/
    │   └── LibraryBookCard.tsx   # Add download buttons here (modify existing)
    └── reader/
        └── ReaderTopBar.tsx      # Add download buttons here (modify existing)
```

### Pattern 1: Presigned GET URL with ResponseContentDisposition

**What:** Generate a time-limited URL that sets Content-Disposition so the browser downloads with a human-readable filename, bypassing the cross-origin `download` attribute limitation.

**When to use:** Always for R2/S3 downloads from browser.

```typescript
// Source: AWS SDK v3 s3-request-presigner (verified in node_modules)
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client } from "@/lib/r2";

const client = createR2Client();

const command = new GetObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME!,
  Key: book.pdfKey,                                // e.g. "books/my-book/my-book.pdf"
  ResponseContentDisposition: `attachment; filename="${book.slug}.pdf"`,
  ResponseContentType: "application/pdf",
});

const url = await getSignedUrl(client, command, {
  expiresIn: 900,                                  // 15 minutes — per success criteria
});
```

### Pattern 2: API Route Authorization Gate

**What:** GET Route Handler checks session then entitlement before generating URL. Never generate a presigned URL before confirming access.

```typescript
// Source: existing pattern from src/app/api/reading-progress/route.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");
  const format = searchParams.get("format"); // "pdf" | "epub"

  // Validate format
  if (format !== "pdf" && format !== "epub") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  // Fetch book with artifact keys
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug!, isPublished: true },
    select: {
      id: true, slug: true, title: true,
      pdfKey: true, epubKey: true, isOpenAccess: true,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Authorization: open-access = session sufficient; paid = requires Purchase record
  if (!book.isOpenAccess) {
    const purchase = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId: session.user.id, bookId: book.id } },
      select: { id: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }
  }

  // Check artifact exists
  const key = format === "pdf" ? book.pdfKey : book.epubKey;
  if (!key) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  // Generate presigned URL
  const url = await getSignedUrl(client, new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${book.slug}.${format}"`,
    ResponseContentType: format === "pdf" ? "application/pdf" : "application/epub+zip",
  }), { expiresIn: 900 });

  // Audit log (fire-and-forget)
  void prisma.download.create({
    data: { userId: session.user.id, bookId: book.id, format },
  });

  return NextResponse.json({ url });
}
```

### Pattern 3: DownloadButton Client Component

**What:** Client component that calls the API route and triggers the download via `window.location.href`.

```typescript
// "use client" required — uses window
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  bookSlug: string;
  format: "pdf" | "epub";
  label?: string;
}

export default function DownloadButton({ bookSlug, format, label }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/download?bookSlug=${bookSlug}&format=${format}`);
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Download failed");
        return;
      }
      const { url } = await res.json();
      window.location.href = url; // triggers download without new tab
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleDownload}>
      <Download className="h-4 w-4 mr-1.5" />
      {loading ? "Preparing..." : (label ?? format.toUpperCase())}
    </Button>
  );
}
```

### Pattern 4: Button Grouping by Placement Context

Per the "Claude's Discretion" area on button grouping:

- **Book detail page (left column, vertical stack):** Two separate buttons stacked vertically (`PDF` and `EPUB`). No dropdown — space is available and two buttons is clear UX.
- **My Library card (compact):** Single `DropdownMenu` with PDF/EPUB options. Card is small; two buttons would overflow the card.
- **Reader header (horizontal bar, narrow):** Single dropdown labeled "Download" with PDF/EPUB. Header is already dense.

This pattern uses the already-installed `DropdownMenu` from `@/components/ui/dropdown-menu` (Radix-based) for the compact placements.

### Pattern 5: Access Denial UX

Per Claude's discretion on denial patterns:

- **Unauthenticated direct URL to `/api/download`:** Return 401 JSON. The `DownloadButton` is never shown to unauthenticated users (server component conditionally renders it).
- **Logged-in but unpurchased (paid book):** Return 403. `DownloadButton` is hidden for unpurchased users — not shown at all (consistent with reader access pattern: detail page shows BuyButton, not a locked download).
- **Missing artifact (pdfKey/epubKey is null):** Return 404. Button is hidden server-side when key is null.
- **Expired presigned URL:** The URL expires in 15 minutes. Since `window.location.href` triggers an immediate download, expiry is not a practical concern in normal flow. If somehow expired, R2 returns an XML error page — not a graceful failure. Mitigate by keeping the expiry window generous (900s is adequate).

### Anti-Patterns to Avoid

- **Generating presigned URL before checking auth:** Exposes R2 object keys in error paths and logs.
- **Using `<a download>` for cross-origin R2 URLs:** The `download` attribute only works same-origin. For R2 URLs (on `*.r2.cloudflarestorage.com`), browsers ignore it and open the file in a new tab or navigate away.
- **Streaming file through Next.js server:** Unnecessary server load and latency. Presigned URLs serve files directly from R2's CDN.
- **Exposing pdfKey/epubKey in API responses:** Only return the presigned URL, never the raw R2 key.
- **Long presigned URL expiry:** 15 minutes (900s) is the required expiry per success criteria. Don't use hours or days.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Presigned URL signing | Custom HMAC/SigV4 signing | `getSignedUrl` from `@aws-sdk/s3-request-presigner` | Correct implementation of SigV4 is complex; already installed |
| Session validation | Custom JWT parse | `auth.api.getSession({ headers: await headers() })` | Existing Better Auth pattern used in every other route |
| Rate limiting | Custom sliding window | Simple in-memory Map (see below) | Zero-dep, adequate for single-server; can upgrade to Upstash later |

**Key insight:** The existing `createR2Client()` function in `scripts/lib/r2-upload.ts` has the critical WHEN_REQUIRED checksum configuration that prevents 400 errors from R2. Copy this pattern exactly into the new `src/lib/r2.ts` — do not write a new R2 client from scratch.

---

## Common Pitfalls

### Pitfall 1: CRC32 Checksum Errors from R2

**What goes wrong:** Default AWS SDK configuration sends CRC32 checksums; Cloudflare R2 does not support them, causing 400 errors.

**Why it happens:** AWS SDK v3 3.x changed defaults to enable checksum calculation by default.

**How to avoid:** Always use `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'` — already documented in the codebase as a prior decision.

**Warning signs:** `400 Bad Request` when calling `getSignedUrl` or any S3 command against R2.

### Pitfall 2: `download` Attribute Ignored for Cross-Origin URLs

**What goes wrong:** `<a href={presignedUrl} download="book.pdf">` — the filename is ignored. The browser either navigates to the URL or opens it in a new tab instead of downloading.

**Why it happens:** Browser security: the `download` attribute is only honoured for same-origin URLs.

**How to avoid:** Use `ResponseContentDisposition: 'attachment; filename="..."'` on `GetObjectCommand` so the response itself carries Content-Disposition. Then use `window.location.href = url` to navigate — the browser sees the Content-Disposition header and initiates a download.

### Pitfall 3: pdfKey/epubKey Not in Existing Queries

**What goes wrong:** `getBookBySlug` in `src/lib/book-queries.ts` does not select `pdfKey` or `epubKey`. They exist in the schema but are not returned.

**Why it happens:** They were added to the schema in Phase 2 but not yet needed by the app.

**How to avoid:** The API route must do its own `prisma.book.findUnique` with explicit selection of `pdfKey`, `epubKey`, and `isOpenAccess`. Do not modify `getBookBySlug` for this — the API route has its own query.

**For the detail page and library card** (which are server components), pass `pdfKey`/`epubKey` as booleans to the DownloadButton (or as the bookSlug) — never pass the actual key to client components. The DownloadButton receives only `bookSlug` and `format`; the key is never sent to the browser.

### Pitfall 4: Open-Access Books Not in getUserPurchases

**What goes wrong:** `getUserPurchases` in `src/lib/purchase-queries.ts` only returns purchased books. Open-access books have no Purchase record. The download route must handle this separately.

**Why it happens:** Open-access books don't go through Stripe checkout.

**How to avoid:** In the API route, check `book.isOpenAccess` first. If true, session alone is sufficient; skip the Purchase lookup. This mirrors the reader page access logic exactly.

### Pitfall 5: Toaster Not Mounted

**What goes wrong:** `toast.error()` from sonner silently does nothing.

**Why it happens:** `<Toaster />` from `@/components/ui/sonner` is not mounted in `src/app/layout.tsx` — it is only defined in the component file but not added to the root layout.

**How to avoid:** Add `<Toaster />` to `src/app/layout.tsx` as part of this phase. Without it, download error feedback is invisible to the user.

### Pitfall 6: Download Audit Log Blocks Response

**What goes wrong:** Awaiting `prisma.download.create` adds unnecessary latency to the download URL response.

**Why it happens:** Treating audit logging as blocking.

**How to avoid:** Use `void prisma.download.create(...)` (fire-and-forget). Failure to log does not prevent the download.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### R2 Client for App Code (extract from scripts pattern)

```typescript
// src/lib/r2.ts — mirrors scripts/lib/r2-upload.ts exactly
// Source: scripts/lib/r2-upload.ts (existing, verified working)
import { S3Client } from "@aws-sdk/client-s3";

export function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // CRITICAL: R2 does not support CRC32 checksums
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
```

### getSignedUrl with ResponseContentDisposition

```typescript
// Source: @aws-sdk/s3-request-presigner@3.992.0 (installed; getSignedUrl verified in dist-cjs/index.js)
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const url = await getSignedUrl(
  createR2Client(),
  new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: book.pdfKey,                               // e.g. "books/slug/slug.pdf"
    ResponseContentDisposition: `attachment; filename="${book.slug}.pdf"`,
    ResponseContentType: "application/pdf",
  }),
  { expiresIn: 900 }                                // 15 minutes per success criteria
);
```

### Simple In-Memory Rate Limiter (no external deps)

```typescript
// Adequate for single-server deployment; no new packages needed
// Source: standard pattern (verified against multiple 2024-2025 sources)
const downloadRequests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = downloadRequests.get(key);

  if (!record || now > record.resetAt) {
    downloadRequests.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= maxRequests) {
    return false; // blocked
  }

  record.count++;
  return true; // allowed
}

// Usage: key = `${session.user.id}:${bookSlug}:${format}`
// 10 requests per user per book per format per minute is generous for legitimate use
```

### Presigned URL field visibility check for server components

```typescript
// On the detail page (server component) — check if artifact exists before rendering button
// This avoids showing a button that would 404 on click
{book.pdfKey && (
  <DownloadButton bookSlug={book.slug} format="pdf" />
)}
{book.epubKey && (
  <DownloadButton bookSlug={book.slug} format="epub" />
)}
```

### Print Link (already partially implemented)

```typescript
// Current implementation in catalog/[slug]/page.tsx — in left column pricing area
// Per locked decision: move to the metadata section (near ISBN/pageCount/dimensions)
// Current code to MOVE (not add):
{book.printLink && (
  <a
    href={book.printLink}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
  >
    Buy Print Edition
  </a>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Streaming files through server | Presigned URLs served directly from R2 | Standard pattern | No server bandwidth consumed; R2 handles delivery |
| `<a download>` for S3/R2 | `ResponseContentDisposition` on `GetObjectCommand` | Always been the correct approach for cross-origin | Browser initiates download with correct filename |
| Pages Router API routes (`req/res`) | App Router Route Handlers (`Request/Response`) | Next.js 13+ | Use `NextResponse.json()` and `headers()` from next/headers |

---

## Codebase Facts (Verified)

These are confirmed facts from reading the actual code — not assumptions:

1. `@aws-sdk/s3-request-presigner@3.992.0` is installed. `getSignedUrl` is exported from its `dist-cjs/index.js`.
2. `@aws-sdk/client-s3@3.992.0` is installed. `GetObjectCommand` available.
3. `Book.pdfKey` and `Book.epubKey` exist as `String?` fields in `prisma/schema.prisma` (lines 99-100).
4. `Book.printLink` exists as `String?` in `prisma/schema.prisma` (line 89). It is already rendered in `catalog/[slug]/page.tsx` in the LEFT COLUMN pricing area — the locked decision says it should be in the METADATA section. This requires moving, not adding.
5. `Download` model exists in `prisma/schema.prisma` (lines 170-180) with `userId`, `bookId`, `format`, `downloadedAt`.
6. `createR2Client()` pattern with WHEN_REQUIRED checksums is proven working in `scripts/lib/r2-upload.ts`.
7. `hasPurchasedBySlug` exists in `src/lib/purchase-queries.ts` — usable for detail page server-side checks.
8. `hasPurchased` (by bookId) exists in `src/lib/reader-queries.ts`.
9. `<Toaster />` is NOT mounted in `src/app/layout.tsx` — must be added to use sonner toasts.
10. `dropdown-menu` Radix component is available at `@/components/ui/dropdown-menu`.
11. `sonner` package is installed (v2.0.7). `toast.error()` and `toast.success()` available.
12. `lucide-react` is installed with `Download` icon available.
13. R2 env vars (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) are already in `.env.example` — no new env vars needed.
14. No `middleware.ts` exists in the project — rate limiting must be in the route handler itself.
15. Open-access reader check: `chapter.book.isOpenAccess || chapter.isFreePreview || hasPurchased(...)` — download access must mirror this: `isOpenAccess` = session only; paid = session + Purchase record.

---

## Open Questions

1. **getUserPurchases does not return pdfKey/epubKey**
   - What we know: `getUserPurchases` returns `book: { id, title, slug, authorName, coverImage }` — no artifact keys.
   - What's unclear: Should we extend this query, or should `LibraryBookCard` infer downloadability purely from the bookSlug (hitting the API route)?
   - Recommendation: Keep `getUserPurchases` unchanged. `LibraryBookCard` receives `bookSlug` and renders download buttons — the API route performs the existence check. If `pdfKey`/`epubKey` is null, the API route returns 404 and the button shows a toast error. This is acceptable since the library card is compact. Alternatively, pass `hasPdf`/`hasEpub` booleans from a separate query on the dashboard page to hide the buttons preemptively. The cleaner UX is to pass booleans; the simpler implementation is to let the API route decide.

2. **Toaster placement in reader layout**
   - What we know: The reader layout (`src/app/(reader)/layout.tsx`) is completely separate from the main layout.
   - What's unclear: If `<Toaster />` is only added to `src/app/layout.tsx`, does it appear in reader routes?
   - Recommendation: Add `<Toaster />` to `src/app/layout.tsx` (root layout). The root layout wraps all route groups. Verify by checking `src/app/layout.tsx` — it renders `{children}` which covers all routes. Yes, this works.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@aws-sdk/s3-request-presigner/dist-cjs/index.js` — verified `getSignedUrl` export and `expiresIn: 900` default
- `node_modules/@aws-sdk/s3-request-presigner/package.json` — version 3.992.0 confirmed
- `prisma/schema.prisma` — confirmed `pdfKey`, `epubKey`, `printLink`, `Download` model
- `scripts/lib/r2-upload.ts` — confirmed WHEN_REQUIRED checksum pattern
- `src/app/(main)/catalog/[slug]/page.tsx` — confirmed current printLink placement
- `src/app/api/reading-progress/route.ts` — confirmed API route pattern with `auth.api.getSession`
- `src/lib/purchase-queries.ts` — confirmed `hasPurchasedBySlug` signature
- `.env.example` — confirmed R2 env vars already documented

### Secondary (MEDIUM confidence)
- [AWS GetObject API docs](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) — confirmed `ResponseContentDisposition` query parameter name
- [Cloudflare R2 Presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — confirmed GET support, 1s-7d expiry range, no custom domain support
- [AWS S3 request presigner official docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) — confirmed `getSignedUrl` API with `expiresIn`

### Tertiary (LOW confidence)
- [Cross-origin download attribute limitation](https://macarthur.me/posts/trigger-cross-origin-download/) — confirms `download` attribute won't work; use ResponseContentDisposition instead (well-established behaviour, LOW only because not verified with a spec reference)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed, versions verified from package.json and node_modules
- Architecture: HIGH — API route pattern confirmed from existing reading-progress route; R2 client pattern confirmed from scripts
- Pitfalls: HIGH — CRC32 issue is a prior decision, cross-origin anchor limitation is a browser spec behaviour, others confirmed from codebase reading

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable AWS SDK, R2 API, Next.js route patterns)
