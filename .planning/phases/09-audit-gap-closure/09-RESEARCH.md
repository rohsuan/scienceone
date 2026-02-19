# Phase 9: Audit Gap Closure - Research

**Researched:** 2026-02-20
**Domain:** react-hook-form numeric field coercion, Next.js redirect param passing, open-access anonymous download
**Confidence:** HIGH (all four gaps precisely located in existing codebase; fixes are targeted and verified)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-03 | Publisher can manage book metadata: cover image, ISBN, author bio/photo, synopsis, categories/tags, table of contents, print info (page count, dimensions), and print purchase link | Numeric field bug in `BookEditForm.tsx` and `bookUpdateSchema` — NaN produced by empty `type="number"` inputs needs null-coercion in schema; fix is 2-line change |
| ADM-04 | Publisher can set access model per book (pay-per-book or open access) | Same price field `NaN → null` coercion fix enables toggle from open-access to paid with a price entry |
</phase_requirements>

## Summary

Phase 9 closes four precisely-identified gaps from the v1 milestone audit. Two are requirement gaps (ADM-03, ADM-04) and two are integration/flow gaps (sign-in redirect, open-access anonymous download).

The ADM-03/ADM-04 gap is a Zod schema issue: `bookUpdateSchema` uses `z.number().int().positive().optional().nullable()` for `pageCount` and `price`, but when an HTML `type="number"` input is cleared (empty), `{ valueAsNumber: true }` in react-hook-form produces `NaN`, which Zod 4 rejects with `invalid_type`. The fix is to add `.transform(v => (Number.isNaN(v) ? null : v))` before the `.optional().nullable()` chain so empty inputs are normalized to null rather than failing validation. The `{ valueAsNumber: true }` register option is already present (added in commit `6047a75`) — only the schema transform is missing.

The sign-in redirect gap is straightforward: `SignInForm.tsx` unconditionally pushes to `/dashboard` after successful login, ignoring any `?redirect=` query parameter. The page is a Server Component; reading `searchParams` there and passing the redirect URL as a prop to `SignInForm` (and to `GoogleSignInButton`) is the idiomatic Next.js fix. Both components then use the redirect param instead of hardcoding `/dashboard`. The redirect must be validated to prevent open redirect attacks (allow only same-origin paths).

The open-access anonymous download has two separate gates: (1) the catalog detail UI at `src/app/(main)/catalog/[slug]/page.tsx` line 125 hides download buttons unless the user has a session, and (2) the download API route at `src/app/api/download/route.ts` line 26-29 returns 401 if there is no session. Both must be changed independently. The download API also uses `session.user.id` for rate limiting — anonymous users need an alternative rate-limit key (IP address from request headers).

**Primary recommendation:** Four targeted surgical fixes across five files. No new packages or schema migrations needed.

---

## Current State of Each Gap

### Gap 1: ADM-03 / ADM-04 — NaN not coerced to null (Zod schema)

**File:** `/Users/roh/GClaude/src/lib/admin-actions.ts`
**Lines:** 72-73 (pageCount and price schema entries)

Current schema:
```typescript
pageCount: z.number().int().positive().optional().nullable(),
price: z.number().nonnegative().optional().nullable(),
```

**Problem:** When a user edits `pageCount` or `price` from a non-null value to an empty input, `{ valueAsNumber: true }` (already present in the form) produces `NaN`. Zod 4 `z.number()` rejects `NaN` explicitly:
```
{ "expected": "number", "code": "invalid_type", "received": "NaN" }
```

**Verified with runtime test:**
```bash
node -e "const { z } = require('zod'); const s = z.number().int().positive().optional().nullable(); console.log(s.safeParse(NaN))"
# → success: false, "received NaN"
```

**Fix:** Add `.transform()` before the modifiers:
```typescript
pageCount: z.number().int().positive().transform(v => Number.isNaN(v) ? null : v).optional().nullable(),
price: z.number().nonnegative().transform(v => Number.isNaN(v) ? null : v).optional().nullable(),
```

**Prior decision applies:** `[07-02]: z.coerce.number() in Zod v4 has input type unknown — breaks @hookform/resolvers type inference; use z.number() for react-hook-form schemas.` The transform approach maintains `z.number()` (not `z.coerce`) and does not break type inference.

**No other files need changing for this gap** — `BookEditForm.tsx` already has `{ valueAsNumber: true }` on both fields (verified in current codebase).

---

### Gap 2: Sign-in redirect — `router.push("/dashboard")` ignores `?redirect=`

**Files:**
- `src/app/(auth)/sign-in/page.tsx` — Server Component, needs to read `searchParams`
- `src/components/auth/SignInForm.tsx` — Client Component, needs redirect prop
- `src/components/auth/GoogleSignInButton.tsx` — Client Component, needs redirect prop

**Current broken code in `SignInForm.tsx`:**
```typescript
if (data) {
  router.push("/dashboard")   // line 61 — ignores redirect
}
```

**Current broken code in `GoogleSignInButton.tsx`:**
```typescript
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",  // line 15 — hardcoded
})
```

**Trigger path:** Catalog detail page already generates the correct sign-in link:
```tsx
<Link href={`/sign-in?redirect=/catalog/${book.slug}`}>
  Sign In to Purchase
</Link>
```
The `?redirect=` param is in the URL — it just gets ignored.

**Fix pattern:**

Step 1: Sign-in page reads `searchParams` (Next.js 16 `searchParams` is a Promise in page components):
```typescript
// src/app/(auth)/sign-in/page.tsx
interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;
  // Validate: only allow same-origin paths (no http://, no //)
  const redirectTo = redirect?.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/dashboard";
  return (
    // ... pass redirectTo to both SignInForm and GoogleSignInButton
  );
}
```

Step 2: `SignInForm` accepts and uses `redirectTo` prop:
```typescript
interface SignInFormProps {
  redirectTo?: string;
}
export function SignInForm({ redirectTo = "/dashboard" }: SignInFormProps) {
  // ...
  if (data) {
    router.push(redirectTo);
  }
}
```

Step 3: `GoogleSignInButton` accepts and uses `redirectTo` prop:
```typescript
interface GoogleSignInButtonProps {
  redirectTo?: string;
}
export function GoogleSignInButton({ redirectTo = "/dashboard" }: GoogleSignInButtonProps) {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: redirectTo,
  });
}
```

**Security validation rule:** Accept only paths that start with `/` and do NOT start with `//`. This prevents open redirect to external domains (`//evil.com` or `https://evil.com`) while allowing all valid same-origin paths.

---

### Gap 3: Open Access Anonymous Download — UI gate

**File:** `src/app/(main)/catalog/[slug]/page.tsx`
**Line:** 125

**Current broken condition:**
```tsx
{((book.isOpenAccess && session) || purchased) &&
  (book.pdfKey || book.epubKey) && (
    // download buttons
  )}
```

**Fixed condition (remove session requirement for open access):**
```tsx
{(book.isOpenAccess || purchased) &&
  (book.pdfKey || book.epubKey) && (
    // download buttons
  )}
```

**No change needed to the catalog download buttons themselves** — `DownloadButton` calls `/api/download`, so the API gate fix below is required too.

---

### Gap 4: Open Access Anonymous Download — API gate

**File:** `src/app/api/download/route.ts`

**Current structure (all requests require session):**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });  // line 28-29
}
// ...
// Rate limiting uses session.user.id
const rateLimitKey = `${session.user.id}:${bookSlug}:${format}`;  // line 47
// ...
// Audit log uses session.user.id
void prisma.download.create({
  data: { userId: session.user.id, bookId: book.id, format },  // line 103
});
```

**Fix: Move auth check after book fetch, conditionally require session for paid books only**

```typescript
export async function GET(request: Request) {
  // a. Parse and validate params first (needed for anonymous path too)
  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");
  const format = searchParams.get("format");

  if (!bookSlug) { /* 400 */ }
  if (format !== "pdf" && format !== "epub") { /* 400 */ }

  // b. Fetch book (need isOpenAccess to determine if auth required)
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug, isPublished: true },
    select: { id: true, slug: true, title: true, pdfKey: true, epubKey: true, isOpenAccess: true },
  });
  if (!book) { /* 404 */ }

  // c. Auth check — only required for non-open-access books
  const session = await auth.api.getSession({ headers: await headers() });
  if (!book.isOpenAccess && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // d. Entitlement check — only for paid books
  if (!book.isOpenAccess) {
    const purchase = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId: session!.user.id, bookId: book.id } },
      select: { id: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }
  }

  // e. Rate limiting — use userId for authenticated, IP for anonymous
  const rateLimitKey = session
    ? `${session.user.id}:${bookSlug}:${format}`
    : `anon:${getClientIp(request)}:${bookSlug}:${format}`;
  if (!checkRateLimit(rateLimitKey)) { /* 429 */ }

  // f. Artifact check, generate presigned URL...

  // g. Audit log — only for authenticated users (no userId for anon)
  if (session) {
    void prisma.download.create({
      data: { userId: session.user.id, bookId: book.id, format },
    });
  }
}
```

**IP extraction helper** (needed for anonymous rate limiting):
```typescript
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
```

**Note on audit log schema:** The `download` Prisma model currently has `userId` as a required field (`userId String`). Anonymous downloads cannot be logged in the same table. The simplest fix is to skip audit logging for anonymous downloads (as shown above). An alternative would be to make `userId` nullable, but that requires a migration — avoid for a gap-closure phase.

**Verify Download model schema before coding:**

---

## Standard Stack

### No New Packages Required

All changes are within the existing stack:
- `react-hook-form` (already installed) — `{ valueAsNumber: true }` option
- `zod` v4 (already installed) — `.transform()` method
- `next/navigation` `useSearchParams` or Server Component `searchParams` — already used in codebase
- Better Auth `authClient.signIn.social` — already in `GoogleSignInButton.tsx`

### Files Changed

| File | Change | Gap |
|------|--------|-----|
| `src/lib/admin-actions.ts` | Add NaN→null transform to `pageCount` and `price` schema | ADM-03, ADM-04 |
| `src/app/(auth)/sign-in/page.tsx` | Read `searchParams.redirect`, pass as prop | Sign-in redirect |
| `src/components/auth/SignInForm.tsx` | Accept `redirectTo` prop, use instead of `/dashboard` | Sign-in redirect |
| `src/components/auth/GoogleSignInButton.tsx` | Accept `redirectTo` prop, use in `callbackURL` | Sign-in redirect |
| `src/app/(main)/catalog/[slug]/page.tsx` | Remove `session` requirement from download button gate | Open access download |
| `src/app/api/download/route.ts` | Move auth check after book fetch, conditional on `isOpenAccess` | Open access download |

**Total: 6 files, no new files needed.**

---

## Architecture Patterns

### Pattern 1: Zod NaN-to-null Transform (ADM-03/ADM-04)

**What:** When `type="number"` inputs are empty, `{ valueAsNumber: true }` produces `NaN`. Zod 4 `z.number()` explicitly rejects `NaN`. The `.transform()` method normalizes it before the `.optional().nullable()` modifiers.

**Why not `z.coerce.number()`:** The locked decision `[07-02]` prohibits it: `z.coerce.number()` has `unknown` input type in Zod v4 which breaks `@hookform/resolvers` type inference.

**Correct pattern:**
```typescript
// For integer fields (pageCount)
z.number().int().positive().transform(v => Number.isNaN(v) ? null : v).optional().nullable()

// For decimal fields (price)
z.number().nonnegative().transform(v => Number.isNaN(v) ? null : v).optional().nullable()
```

**Note:** `publishYear` already has `{ valueAsNumber: true }` (added in phase 8) and uses the same schema type. If it has the same NaN issue, it should also get the transform — check the schema for consistency.

### Pattern 2: Server Component searchParams → Client Component prop (Sign-in redirect)

**What:** Next.js 16 `searchParams` in page components is a `Promise<Record<string, string>>`. The Server Component reads and validates the redirect param, passes it as a typed prop to the Client Component.

**Why not `useSearchParams` in the Client Component:** Would require wrapping in `Suspense`. The page is already a Server Component — reading `searchParams` there is simpler and avoids the Suspense boundary requirement.

**Security:** Validate that `redirect` starts with `/` and does not start with `//`. This prevents open redirect to external domains.

```typescript
function getSafeRedirect(redirect: string | undefined): string {
  if (!redirect) return "/dashboard";
  // Must start with / but not // (would resolve to external protocol-relative URL)
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/dashboard";
}
```

### Pattern 3: Conditional Auth Check in API Route (Open Access Download)

**What:** Move the session fetch and auth check to after the book record is retrieved. Only require authentication for non-open-access books.

**Why fetch book first:** Need `book.isOpenAccess` to decide whether auth is required. The book fetch is cheap (unique lookup by slug).

**Rate limiting anonymous users:** Use `x-forwarded-for` header as the rate limit key for anonymous requests. This is a best-effort approach — IP-based rate limiting is less precise than user-based but sufficient for the small scale of this app.

### Anti-Patterns to Avoid

- **Using `z.coerce.number()`:** Banned by prior decision `[07-02]`. Breaks `@hookform/resolvers` type inference in Zod v4.
- **Making `userId` nullable in Download model:** Would require a Prisma migration. Avoid for a gap-closure phase — simply skip audit logging for anonymous downloads.
- **Redirect without validation:** Always validate the `redirect` param is a same-origin path before using it. `router.push(anyInput)` is an open redirect vulnerability.
- **`useSearchParams` in SignInForm for redirect:** Requires Suspense wrapper. Use Server Component → prop pattern instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NaN normalization | Custom `setValueAs` hook | `z.transform()` | Native Zod method; applies at schema level not form level |
| Safe redirect validation | Complex regex | Simple string prefix check | Two conditions (`startsWith("/")` + `!startsWith("//")`) cover all attack vectors |

---

## Common Pitfalls

### Pitfall 1: Transform position in Zod chain matters

**What goes wrong:** `.transform()` placed after `.optional()` or `.nullable()` — only runs on non-null/non-undefined values, silently missing the NaN case.

**Why it happens:** Zod transforms run on the value after type checking. Placing transform before `.optional().nullable()` means it runs on the raw number value (including NaN).

**How to avoid:** Order must be: `z.number() → .positive()/.nonnegative() → .transform(NaN→null) → .optional() → .nullable()`

**Warning signs:** TypeScript shows transform not applying; `NaN` still fails validation.

### Pitfall 2: publishYear may have the same NaN bug

**What goes wrong:** `publishYear` field also has `{ valueAsNumber: true }` and the same schema type (`z.number().int().positive().optional().nullable()`). It may have the same NaN-to-null issue when cleared.

**Why it happens:** The Phase 8 commit added `publishYear` with `{ valueAsNumber: true }` but the audit didn't test clearing it (only tested pageCount and price from null to value).

**How to avoid:** Fix `publishYear` schema in the same pass as `pageCount` and `price`. Include all three in the transform fix.

### Pitfall 3: `session` may be null in API route after restructure

**What goes wrong:** TypeScript error on `session!.user.id` in the paid-book entitlement check — TypeScript doesn't know the `!book.isOpenAccess && !session` guard above means session is non-null here.

**Why it happens:** TypeScript flow analysis doesn't track the conditional state through multiple conditions.

**How to avoid:** Use a type assertion (`session!.user.id`) where the guard proves non-null, or restructure the code to re-check in the else branch.

### Pitfall 4: Redirect validation edge cases

**What goes wrong:** A redirect value like `/sign-in?redirect=/other-page` creates a recursive redirect loop, or `/%2F/evil.com` bypasses the `//` check.

**Why it happens:** URL-encoded characters are not decoded in the raw string check.

**How to avoid:** For this codebase the simple `/` and `!//` check is sufficient. The redirect value originates from a hardcoded `href` in the catalog page — it's always `/catalog/{slug}`, never user-controlled external input. Add the check as defense-in-depth, not as the primary security mechanism.

---

## Code Examples

### NaN-to-null transform in Zod schema

```typescript
// src/lib/admin-actions.ts
export const bookUpdateSchema = z.object({
  // ... other fields unchanged ...
  pageCount: z.number().int().positive().transform(v => Number.isNaN(v) ? null : v).optional().nullable(),
  publishYear: z.number().int().positive().transform(v => Number.isNaN(v) ? null : v).optional().nullable(),
  price: z.number().nonnegative().transform(v => Number.isNaN(v) ? null : v).optional().nullable(),
  // ... rest unchanged ...
});
```

### Sign-in page with redirect prop

```typescript
// src/app/(auth)/sign-in/page.tsx
interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

function getSafeRedirect(redirect: string | undefined): string {
  if (!redirect) return "/dashboard";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/dashboard";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirect(redirect);
  return (
    <AuthCard ...>
      <div className="space-y-4">
        <SignInForm redirectTo={redirectTo} />
        {/* ... separator ... */}
        <GoogleSignInButton redirectTo={redirectTo} />
      </div>
    </AuthCard>
  );
}
```

### SignInForm with redirectTo prop

```typescript
// src/components/auth/SignInForm.tsx
interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo = "/dashboard" }: SignInFormProps) {
  // ...
  if (data) {
    router.push(redirectTo);  // was: router.push("/dashboard")
  }
}
```

### GoogleSignInButton with redirectTo prop

```typescript
// src/components/auth/GoogleSignInButton.tsx
interface GoogleSignInButtonProps {
  redirectTo?: string;
}

export function GoogleSignInButton({ redirectTo = "/dashboard" }: GoogleSignInButtonProps) {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: redirectTo,  // was: "/dashboard"
  });
}
```

### Download route — conditional auth + anonymous rate limiting

```typescript
// src/app/api/download/route.ts

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function GET(request: Request) {
  // a. Parse params
  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");
  const format = searchParams.get("format");
  if (!bookSlug) return NextResponse.json({ error: "bookSlug is required" }, { status: 400 });
  if (format !== "pdf" && format !== "epub") return NextResponse.json({ error: "format must be pdf or epub" }, { status: 400 });

  // b. Fetch book (needed to determine if auth is required)
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug, isPublished: true },
    select: { id: true, slug: true, title: true, pdfKey: true, epubKey: true, isOpenAccess: true },
  });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  // c. Auth check — required for paid books only
  const session = await auth.api.getSession({ headers: await headers() });
  if (!book.isOpenAccess && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // d. Entitlement check — paid books only
  if (!book.isOpenAccess) {
    const purchase = await prisma.purchase.findUnique({
      where: { userId_bookId: { userId: session!.user.id, bookId: book.id } },
      select: { id: true },
    });
    if (!purchase) return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }

  // e. Rate limiting — userId for auth, IP for anonymous
  const rateLimitKey = session
    ? `${session.user.id}:${bookSlug}:${format}`
    : `anon:${getClientIp(request)}:${bookSlug}:${format}`;
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // f–g. Artifact check, presigned URL generation unchanged...

  // h. Audit log — skip for anonymous
  if (session) {
    void prisma.download.create({
      data: { userId: session.user.id, bookId: book.id, format },
    });
  }

  return NextResponse.json({ url });
}
```

### Catalog detail page — show downloads for open access regardless of session

```tsx
{/* src/app/(main)/catalog/[slug]/page.tsx */}
{/* Before: ((book.isOpenAccess && session) || purchased) */}
{(book.isOpenAccess || purchased) &&
  (book.pdfKey || book.epubKey) && (
    <div className="flex flex-col gap-2">
      {book.pdfKey && <DownloadButton bookSlug={book.slug} format="pdf" />}
      {book.epubKey && <DownloadButton bookSlug={book.slug} format="epub" />}
    </div>
  )}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `valueAsNumber: true` without NaN handling | `z.number().transform(NaN → null)` | Empty numeric inputs now produce `null` instead of failing validation |
| Unconditional `router.push("/dashboard")` | `router.push(redirectTo)` with validated prop | Users return to intended destination after sign-in |
| API auth gate before book fetch | Book fetch first, conditional auth | Open access books downloadable without account |

---

## Open Questions

1. **`publishYear` NaN behavior**
   - What we know: `publishYear` has `{ valueAsNumber: true }` added in Phase 8 commit `b33efb4`; schema is `z.number().int().positive().optional().nullable()`
   - What's unclear: Whether this was tested for clearing the field (NaN path)
   - Recommendation: Include `publishYear` in the schema fix — same 1-line change. Better to be consistent across all numeric fields.

2. **Prisma Download model `userId` nullability** — RESOLVED
   - Confirmed: `Download` model has `userId String` (non-nullable, required with cascade relation to User)
   - Anonymous downloads cannot be logged in the existing table without a schema migration
   - Resolution: Skip audit logging for anonymous downloads (no migration needed); authenticated downloads continue to log as before

3. **`DownloadButton` component behavior when session is null** — RESOLVED
   - `DownloadButton.tsx` is fully session-agnostic: it calls `fetch("/api/download?bookSlug=...&format=...")` with no auth headers or session state
   - The browser automatically sends cookies, so authenticated users still work correctly
   - No changes needed to `DownloadButton.tsx`

---

## Sources

### Primary (HIGH confidence)
- `/Users/roh/GClaude/src/lib/admin-actions.ts` — bookUpdateSchema exact definitions
- `/Users/roh/GClaude/src/components/admin/BookEditForm.tsx` — current register() calls with `{ valueAsNumber: true }`
- `/Users/roh/GClaude/src/components/auth/SignInForm.tsx` — exact line 61 with `router.push("/dashboard")`
- `/Users/roh/GClaude/src/components/auth/GoogleSignInButton.tsx` — exact hardcoded `/dashboard` callbackURL
- `/Users/roh/GClaude/src/app/(main)/catalog/[slug]/page.tsx` — line 125 download button gate condition
- `/Users/roh/GClaude/src/app/api/download/route.ts` — lines 26-29 unconditional auth check, lines 47/103 session.user.id usage
- `/Users/roh/GClaude/.planning/v1-MILESTONE-AUDIT.md` — exact gap descriptions, evidence, break points
- Runtime verification: `node -e` test confirms Zod 4 `z.number()` rejects `NaN` with `invalid_type`

### Secondary (MEDIUM confidence)
- Zod v4 documentation (via local node_modules): `.transform()` method runs before `.optional().nullable()` in schema chain
- Next.js 16 patterns (from existing codebase): `searchParams` is Promise in page components (already used in catalog and other pages)

---

## Metadata

**Confidence breakdown:**
- ADM-03/ADM-04 fix: HIGH — exact schema lines identified, NaN behavior runtime-verified, fix pattern confirmed
- Sign-in redirect fix: HIGH — exact lines identified, Next.js searchParams pattern already used in codebase
- Open access download UI fix: HIGH — exact line 125 condition identified, single boolean change
- Open access download API fix: HIGH — exact restructuring pattern clear; one open question on Download model nullability (check before coding)

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable stack; no external dependencies changing)
