# Phase 5: Payments and Entitlement - Research

**Researched:** 2026-02-19
**Domain:** Stripe Checkout (one-time payments), webhook fulfillment, purchase entitlement, My Library, Resend receipt email
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Purchase Flow
- Dedicated success page after Stripe checkout with "Start Reading" button — not a direct redirect to the reader or back to the detail page
- Success page confirms the purchase and provides a clear call-to-action to begin reading

#### Receipt Email
- Professional and minimal tone — clean confirmation, no marketing fluff
- Include: book title, price, purchase date, and a "Start Reading" link
- Also include a download reminder mentioning PDF/EPUB availability (downloads ship in Phase 6 — placeholder or forward-looking mention is fine)

### Claude's Discretion

- **Buy button placement** on book detail page — Claude picks best position based on existing detail page layout
- **Guest purchase handling** — Claude decides whether to require sign-in first or allow Stripe email-based account creation, based on existing Better Auth setup
- **Already-purchased state** on detail page — Claude decides how to swap buy button for read access (e.g., "Read Now" button, with or without a "Purchased" badge)
- **My Library card design** — Claude designs book cards based on existing design system (what info to show, progress inclusion, etc.)
- **My Library location** — section on dashboard vs dedicated page, Claude decides based on existing layout
- **My Library book ordering** — Claude picks default sort order
- **Open-access in library** — Claude decides whether open-access books appear in My Library or stay catalog-only
- **Email provider** — Claude picks Resend (existing) or Stripe receipts based on codebase setup
- **Cover image in email** — Claude decides based on email deliverability best practices
- **Catalog card pricing** — Claude picks placement (badge vs text below title) based on existing card design
- **Free vs paid visual treatment** — Claude decides how to distinguish open-access from paid books
- **Currency** — Claude picks (likely USD-only for simplicity)
- **Price detail on book page** — Claude decides total-only vs "includes X" breakdown based on what's available in Phase 5

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | User can purchase full book access via Stripe checkout | Stripe SDK + Server Action creates checkout session with `mode: 'payment'`, `price_data` from `BookPrice.amount`, metadata: `{ userId, bookId }`; redirect to Stripe-hosted checkout page |
| PAY-02 | Publisher can mark books as open access (free, no paywall) | Already implemented: `Book.isOpenAccess` field exists in schema; chapter access check in `ChapterPage` already gates on `chapter.book.isOpenAccess`; only UI indicators needed (catalog card badge, detail page treatment) |
| PAY-03 | Open access books are readable and downloadable without purchase | Reader access check `canRead = chapter.book.isOpenAccess || chapter.isFreePreview || hasPurchased(...)` already handles this; no auth check needed for open-access; no schema changes |
| PAY-04 | Purchase entitlement is granted via Stripe webhook (idempotent, not via redirect) | `POST /api/webhooks/stripe` route handler; `req.text()` for raw body; `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`; listen for `checkout.session.completed`; `prisma.purchase.upsert` with `@@unique([userId, bookId])` as idempotency key — duplicate webhook cannot create two records |
| AUTH-03 | User can view their purchased books in My Library | Dashboard page already has `EmptyLibrary` placeholder component; needs server-side purchase query + populated `LibraryBookCard` components; `Purchase` model joined with `Book` gives all needed data |
| AUTH-04 | User receives email confirmation after purchase with access details | Resend already installed (`^6.9.2`), `@react-email/components` already installed (`^1.0.7`); send from webhook handler after successful `upsert`; follow `VerificationEmail` template pattern already in codebase |
</phase_requirements>

---

## Summary

This phase adds Stripe Checkout for one-time book purchases, webhook-driven entitlement, My Library on the dashboard, and purchase confirmation email via Resend. The codebase is well-prepared: the `Purchase` model with `@@unique([userId, bookId])` already exists in the Prisma schema, the reader access gate (`hasPurchased`) is already implemented in `ChapterPage`, the dashboard has `EmptyLibrary` and `EmptyRecentlyRead` placeholder components ready to populate, and Resend + react-email are already installed with an existing `VerificationEmail` template to follow.

The critical implementation path is: (1) install `stripe` npm package, (2) create a Server Action that generates a Stripe Checkout session with `price_data` from `BookPrice.amount` and metadata carrying `userId` and `bookId`, (3) create a webhook handler at `POST /api/webhooks/stripe` that reads raw body via `req.text()`, verifies the Stripe signature, handles `checkout.session.completed`, upserts the `Purchase` record, and sends the Resend receipt email, (4) create the dedicated success page at `/purchase/success`, (5) populate the My Library section on the dashboard with purchased books.

The Better Auth Stripe plugin does NOT support one-time payments (only subscriptions) — use the Stripe Node.js SDK directly. Guest checkout is inadvisable given the existing Better Auth setup: purchases need a `userId` to link to `Purchase` records, and Better Auth does not provide a guest account mechanism. Require sign-in before initiating checkout (redirect unauthenticated users to `/sign-in?redirect=/catalog/[slug]`).

**Primary recommendation:** Manual Stripe SDK integration (not Better Auth Stripe plugin). Server Action for checkout session creation. Webhook route handler with `req.text()` raw body. Prisma `upsert` with `userId_bookId` unique constraint for idempotency. Resend for receipt email (already installed). My Library as populated section on the existing dashboard page.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.3.1 (latest) | Server-side Stripe API: create checkout sessions, verify webhooks | Official Stripe Node.js SDK; handles all server API calls |
| Resend | 6.9.2 (installed) | Send purchase confirmation email | Already used for verification emails; API key already configured |
| @react-email/components | 1.0.7 (installed) | Email template component library | Already used for `VerificationEmail`; consistent template style |
| Prisma | 7.x (installed) | `Purchase.upsert`, `Purchase.findMany` for library | Already the project ORM; `Purchase` model already in schema |
| Better Auth | 1.4.18 (installed) | `auth.api.getSession()` to get userId in Server Action and webhook | Already the project auth; established pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js Server Actions | (built-in, Next.js 16.1.6) | Create checkout session, redirect to Stripe | Eliminates API route boilerplate for checkout initiation; automatic loading state on form submit |
| Next.js Route Handlers | (built-in) | `POST /api/webhooks/stripe` webhook endpoint | Must be a route handler (not Server Action) — Stripe calls it from outside |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Stripe SDK | Better Auth Stripe plugin | Plugin only supports subscriptions, not one-time payments — cannot use here |
| Server Action for checkout | API route + client fetch | Server Action is simpler, same security, integrates with `redirect()` natively |
| Resend for receipt | Stripe's built-in receipts | Stripe receipts are generic; Resend gives full control over content including download reminder and "Start Reading" link |
| `price_data` (dynamic) | Pre-created Stripe Price IDs | `price_data` avoids Stripe dashboard management; price lives in `BookPrice.amount` DB field |

### New Installation Required

```bash
npm install stripe
```

Note: `@stripe/stripe-js` (client-side JS) is NOT needed — this integration uses Stripe-hosted checkout (redirect), not embedded/inline Elements.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Populate My Library section (server-side purchases query)
│   │   ├── catalog/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Add Buy button + purchased state (server component)
│   │   └── purchase/
│   │       └── success/
│   │           └── page.tsx          # Dedicated success page (locked decision)
│   └── api/
│       └── webhooks/
│           └── stripe/
│               └── route.ts          # POST: verify signature, upsert Purchase, send email
├── components/
│   ├── catalog/
│   │   └── BuyButton.tsx             # "use client" — form + Server Action, handles loading state
│   ├── dashboard/
│   │   └── LibraryBookCard.tsx       # Book card for My Library (server component friendly)
│   └── emails/
│       └── PurchaseConfirmation.tsx  # react-email template
├── lib/
│   ├── stripe.ts                     # Stripe singleton instance
│   ├── purchase-queries.ts           # getUserPurchases(), hasPurchasedBySlug()
│   └── checkout-actions.ts           # createCheckoutSession() Server Action
```

### Pattern 1: Stripe Singleton

Initialize once, import everywhere on the server.

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // No need to pin apiVersion; stripe-node 20.x uses the latest at release time
});
```

### Pattern 2: Server Action for Checkout Session Creation

The Server Action reads the session, fetches the price from DB (never trust client-sent amounts), creates the Stripe session with metadata, and redirects.

```typescript
// src/lib/checkout-actions.ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function createCheckoutSession(bookId: string) {
  // 1. Auth check — require sign-in
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in"); // caller should append ?redirect=... if needed
  }

  // 2. Fetch book + price from DB (never trust client-sent price)
  const book = await prisma.book.findUnique({
    where: { id: bookId, isPublished: true },
    include: { pricing: true },
  });
  if (!book || !book.pricing || !book.pricing.isActive) {
    throw new Error("Book not available for purchase");
  }

  // 3. Check not already purchased (prevent duplicate sessions)
  const existing = await prisma.purchase.findUnique({
    where: { userId_bookId: { userId: session.user.id, bookId } },
  });
  if (existing) {
    redirect(`/read/${book.slug}`);
  }

  // 4. Create Stripe Checkout session
  const origin = process.env.NEXT_PUBLIC_APP_URL!;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email, // prefills checkout form
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(book.pricing.amount) * 100), // cents
          product_data: {
            name: book.title,
            description: `Full digital access — ${book.authorName}`,
          },
        },
      },
    ],
    metadata: {
      userId: session.user.id,
      bookId: book.id,
      bookSlug: book.slug,
      userEmail: session.user.email,
    },
    success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/catalog/${book.slug}`,
  });

  redirect(checkoutSession.url!);
}
```

### Pattern 3: Webhook Handler — Raw Body + Idempotent Upsert

The webhook handler is the only place that grants access. It must use `req.text()` (not `req.json()`) and the `@@unique([userId, bookId])` constraint makes the upsert inherently idempotent.

```typescript
// src/app/api/webhooks/stripe/route.ts
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { PurchaseConfirmationEmail } from "@/emails/PurchaseConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text(); // raw body — MUST NOT use request.json()
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // payment_status check: 'paid' for card payments (sync), 'unpaid' for async methods
    if (session.payment_status !== "paid") {
      // Async payment method — wait for checkout.session.async_payment_succeeded
      return Response.json({ received: true });
    }

    const { userId, bookId, bookSlug, userEmail } = session.metadata ?? {};
    if (!userId || !bookId) {
      return Response.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Idempotent upsert: @@unique([userId, bookId]) prevents duplicate records
    // stripePaymentId is nullable; we store session.payment_intent as the reference
    await prisma.purchase.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: {
        userId,
        bookId,
        stripePaymentId: session.payment_intent as string ?? session.id,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "usd",
        status: "completed",
      },
      update: {
        // Already exists — nothing to update; upsert is a no-op on conflict
        status: "completed",
      },
    });

    // Send receipt email (fire and forget — don't block webhook response)
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { title: true, slug: true },
    });
    if (book && userEmail) {
      void resend.emails.send({
        from: "ScienceOne <noreply@scienceone.com>",
        to: userEmail,
        subject: `Your ScienceOne purchase: ${book.title}`,
        react: PurchaseConfirmationEmail({
          bookTitle: book.title,
          bookSlug: book.slug ?? bookSlug!,
          amount: (session.amount_total ?? 0) / 100,
          purchaseDate: new Date(),
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      });
    }
  }

  return Response.json({ received: true });
}
```

### Pattern 4: Buy Button Component

The book detail page is a Server Component. The buy action needs to be triggered by a client form (or `startTransition`). Create a `"use client"` `BuyButton` that wraps the Server Action in a `<form>`.

```typescript
// src/components/catalog/BuyButton.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/checkout-actions";

interface BuyButtonProps {
  bookId: string;
  price: number; // display only — actual price fetched server-side in action
}

export default function BuyButton({ bookId, price }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => createCheckoutSession(bookId))}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? "Redirecting…" : `Buy — $${price.toFixed(2)}`}
    </Button>
  );
}
```

### Pattern 5: Success Page — Retrieve Session for Display

```typescript
// src/app/(main)/purchase/success/page.tsx
import { stripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) notFound();

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items"],
  });

  if (session.payment_status !== "paid") notFound();

  const bookSlug = session.metadata?.bookSlug;
  const bookTitle = session.line_items?.data[0]?.description ?? "your book";

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold mb-4">Purchase Complete</h1>
      <p className="text-muted-foreground mb-2">You now have full access to:</p>
      <p className="font-serif text-xl font-semibold mb-8">{bookTitle}</p>
      <p className="text-sm text-muted-foreground mb-8">
        A receipt has been sent to {session.customer_details?.email}.
      </p>
      <Button asChild size="lg">
        <Link href={`/read/${bookSlug}`}>Start Reading</Link>
      </Button>
    </div>
  );
}
```

### Pattern 6: My Library — Server-Side Purchase Query

```typescript
// src/lib/purchase-queries.ts
import { cache } from "react";
import prisma from "@/lib/prisma";

export const getUserPurchases = cache(async (userId: string) => {
  return prisma.purchase.findMany({
    where: { userId, status: "completed" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          authorName: true,
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" }, // most recently purchased first
  });
});
```

### Anti-Patterns to Avoid

- **Granting access on the success page redirect:** Users can navigate to success URLs directly; only grant access in the webhook handler.
- **Using `request.json()` in the webhook handler:** Destroys the raw body and breaks Stripe signature verification. Always use `request.text()`.
- **Trusting client-sent prices:** Never accept the book price from the client. Always fetch from `BookPrice.amount` in DB inside the Server Action.
- **Fetching session_id on success page for entitlement:** The success page is for display only. The webhook is the source of truth for purchase grants.
- **Using the Better Auth Stripe plugin:** It only supports subscriptions. One-time payment support is confirmed absent as of Feb 2026.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment UI | Custom payment form with card field capture | Stripe-hosted Checkout | PCI compliance, 3DS handling, Apple/Google Pay, all managed by Stripe |
| Webhook signature verification | Manual HMAC verification | `stripe.webhooks.constructEvent()` | Timing-safe comparison, replay protection built in |
| Idempotency tracking | Separate `processedWebhookEvents` table | Prisma `upsert` with `@@unique([userId, bookId])` | The existing unique constraint is sufficient; books are unique per user |
| Email rendering | Plain-text receipts | `@react-email/components` | Already installed; consistent with `VerificationEmail` template |

**Key insight:** The Stripe-hosted Checkout page (redirect model) eliminates the need for `@stripe/stripe-js` or `@stripe/react-stripe-js` — no client-side Stripe JS is needed at all.

---

## Common Pitfalls

### Pitfall 1: Webhook Raw Body Corruption
**What goes wrong:** Calling `request.json()` instead of `request.text()` in the webhook handler causes `stripe.webhooks.constructEvent()` to throw a signature mismatch error.
**Why it happens:** `request.json()` re-serializes the JSON, potentially changing whitespace/key order, which changes the bytes Stripe signed.
**How to avoid:** Always use `const body = await request.text()` in the webhook route handler.
**Warning signs:** `Webhook Error: No signatures found matching the expected signature for payload.`

### Pitfall 2: Webhook Secret Mismatch (Local vs Production)
**What goes wrong:** The Stripe CLI (`stripe listen`) generates a temporary webhook secret (starts with `whsec_`) that is different from the secret registered in the Stripe Dashboard.
**Why it happens:** The CLI issues per-session secrets for local forwarding.
**How to avoid:** Use a `.env.local` file for development with the CLI secret, and a separate `STRIPE_WEBHOOK_SECRET` in production with the dashboard-registered secret.
**Warning signs:** Signature verification failures only in local development.

### Pitfall 3: Double Purchase on Retry
**What goes wrong:** Stripe can deliver webhooks more than once. Without idempotency, a second delivery creates a duplicate `Purchase` record.
**Why it happens:** Stripe's delivery-at-least-once guarantee.
**How to avoid:** The `@@unique([userId, bookId])` constraint on the `Purchase` model causes `upsert` to be a true no-op on conflict. Also check `payment_status === "paid"` before upserting.
**Warning signs:** Duplicate purchases in DB, `prisma.purchase.upsert` throwing if the constraint is missing.

### Pitfall 4: Access Granted Before Webhook Arrives
**What goes wrong:** After Stripe checkout, the user returns to the success page and immediately tries "Start Reading" before the webhook has been processed, landing on a paywall.
**Why it happens:** Webhook delivery can be delayed by seconds. The redirect from Stripe to the success page happens faster than the webhook POST.
**How to avoid:** The success page should NOT immediately redirect to the reader. Instead, use the dedicated success page (locked decision) that is purely informational — the "Start Reading" button is the user's explicit action, giving time for the webhook to process. Optionally, add a short polling or revalidation on the success page to confirm purchase before showing the button as active.
**Warning signs:** Users land on `/read/[slug]` and are bounced back to the catalog with `?access=required`.

### Pitfall 5: Sign-In Not Enforced Before Checkout
**What goes wrong:** The Server Action creates a checkout session with no `userId`, and the webhook has no user to link the purchase to.
**Why it happens:** Assuming Stripe's `customer_email` is enough to identify a user.
**How to avoid:** In the Server Action, check `auth.api.getSession()` and `redirect("/sign-in")` if no session. The `BuyButton` on the detail page should also conditionally render as a "Sign in to purchase" link for unauthenticated users, detected server-side.
**Warning signs:** Webhook receives `session.metadata.userId` as `undefined`.

### Pitfall 6: Open-Access Books Appearing Behind Paywall in Reader
**What goes wrong:** New access gate logic accidentally breaks open-access books.
**Why it happens:** Conditional logic error in `canRead` check.
**How to avoid:** The existing `canRead` check in `ChapterPage` already handles `isOpenAccess` correctly. Do not modify it. This phase only adds the `BuyButton` UI and the `Purchase` upsert.
**Warning signs:** Open-access chapters redirect to catalog with `?access=required`.

---

## Code Examples

### Environment Variables to Add

```bash
# .env.local (add to .env.example)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # from `stripe listen` output locally, dashboard in prod
NEXT_PUBLIC_APP_URL=http://localhost:3000  # already needed for auth
```

### Local Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI (if not present)
brew install stripe/stripe-cli/stripe

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe --events checkout.session.completed

# Trigger a test event (in a second terminal)
stripe trigger checkout.session.completed
```

### Purchase Confirmation Email Template Structure

```typescript
// src/emails/PurchaseConfirmation.tsx
// Follows the same pattern as /src/emails/verification.tsx (existing file)
interface PurchaseConfirmationEmailProps {
  bookTitle: string;
  bookSlug: string;
  amount: number;
  purchaseDate: Date;
  appUrl: string;
}

// Key content blocks:
// 1. Header: ScienceOne branding (same dark blue #1e2d5e as VerificationEmail)
// 2. Body: "Thank you for your purchase" + book title + formatted price + date
// 3. CTA button: "Start Reading" → {appUrl}/read/{bookSlug}
// 4. Note: "PDF and EPUB downloads will be available soon."
// 5. Footer: same as VerificationEmail
```

### Book Detail Page — Server-Side Purchase Check

```typescript
// In /catalog/[slug]/page.tsx (server component)
// Fetch session + purchase state server-side to render correct button
const session = await auth.api.getSession({ headers: await headers() });
const purchased = session
  ? await hasPurchased(session.user.id, book.id)
  : false;

// In JSX — left column, below price, above "Read Sample"
{!book.isOpenAccess && book.pricing && (
  purchased ? (
    <Button asChild>
      <Link href={`/read/${book.slug}`}>Read Now</Link>
    </Button>
  ) : session ? (
    <BuyButton bookId={book.id} price={Number(book.pricing.amount)} />
  ) : (
    <Button asChild variant="default">
      <Link href={`/sign-in?redirect=/catalog/${book.slug}`}>Sign In to Purchase</Link>
    </Button>
  )
)}
{book.isOpenAccess && (
  <Button asChild variant="default">
    <Link href={`/read/${book.slug}`}>Read Free</Link>
  </Button>
)}
```

### My Library — Dashboard Integration

The existing `EmptyLibrary` component is replaced when there are purchases. The dashboard `page.tsx` fetches purchases server-side and renders either populated cards or the existing empty state:

```typescript
// In dashboard/page.tsx
const purchases = await getUserPurchases(session.user.id);

// In JSX:
{purchases.length === 0 ? (
  <EmptyLibrary />
) : (
  <MyLibrary purchases={purchases} />
)}
```

---

## Decisions Made by Claude (Discretion Areas)

Based on codebase research:

| Area | Decision | Rationale |
|------|----------|-----------|
| Guest purchase handling | Require sign-in first | `Purchase` model requires `userId`; Better Auth has no guest mechanism; existing auth flow is smooth (Google + email) |
| Email provider | Resend (existing) | Already installed and configured with API key; consistent with `VerificationEmail` pattern |
| Cover image in email | No cover image | Hosted images (from R2) work best for deliverability over base64; but the image URL is pre-signed and short-lived — skip cover image in email to avoid broken images and keep email lightweight |
| My Library location | Section on existing dashboard page | Dashboard already has `EmptyLibrary` placeholder in the grid layout; no new route needed |
| My Library book ordering | Most recently purchased first (`createdAt: "desc"`) | Intuitive for a purchase history |
| Open-access in library | Open-access books do NOT appear in My Library | My Library = purchased books; open-access books are freely available in catalog without any purchase record |
| Catalog card pricing | Price as text below title (already implemented in `BookCard.tsx`) | Already rendering `${price}` text in the card footer area; add "Open Access" green badge for free (already in `BookCard.tsx`) |
| Free vs paid visual treatment | Green "Open Access" badge (already exists) | `BookCard.tsx` and detail page already render `<Badge>Open Access</Badge>` for `isOpenAccess` books |
| Currency | USD only | `BookPrice.currency` defaults to `"USD"` in schema; single-currency simplifies `price_data` |
| Price detail on book page | Total price only (e.g., "$24.99") | No tax/breakdown information available in Phase 5; clean and unambiguous |
| Already-purchased state | "Read Now" button replaces buy button; no separate "Purchased" badge | Clean and action-oriented; the detail page already shows the price, so swapping to "Read Now" makes the state obvious |
| Buy button placement | Left column, below price, above "Read Sample" | Existing layout has a `flex flex-col gap-2` container for pricing + buttons on the left; natural placement |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes with `export const config = { api: { bodyParser: false } }` | App Router route handlers use `request.text()` natively | Next.js 13+ App Router | `export const config` is deprecated in App Router; `request.text()` works without configuration |
| Creating Stripe Price IDs in dashboard per book | `price_data` inline on checkout session creation | Stripe API improvement | Avoids Stripe dashboard management; price lives in own DB |
| `@stripe/react-stripe-js` Elements (inline payment form) | Stripe-hosted Checkout (redirect) | Design choice for simplicity | Eliminates all client-side Stripe JS; PCI handled entirely by Stripe |
| Better Auth Stripe plugin | Manual Stripe SDK for one-time payments | Plugin limitation confirmed Feb 2026 | Plugin is subscriptions-only; direct SDK integration required |

---

## Open Questions

1. **Success page "Start Reading" timing**
   - What we know: Webhook delivery can lag the redirect by seconds. The success page is static/informational.
   - What's unclear: Should the "Start Reading" button be immediately active, or should the page poll/revalidate to confirm the purchase exists in DB before enabling the button?
   - Recommendation: Start with static "Start Reading" link (no polling). The webhook typically arrives within 1-2 seconds. If UX testing reveals the race condition is common, add a short `setTimeout` + `router.refresh()` polling pattern (3-4 checks over 5 seconds) in Phase 5 iteration.

2. **`NEXT_PUBLIC_APP_URL` environment variable**
   - What we know: The checkout `success_url` and `cancel_url` need the app's base URL. The detail page already uses `process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com"`.
   - What's unclear: This var is not in `.env.example` yet.
   - Recommendation: Add `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env.example` as part of this phase.

---

## Sources

### Primary (HIGH confidence)

- Stripe official documentation — Checkout quickstart: https://docs.stripe.com/checkout/quickstart?client=next
- Stripe official documentation — Webhooks: https://docs.stripe.com/webhooks
- Stripe official documentation — Fulfill orders: https://docs.stripe.com/checkout/fulfillment
- Stripe official documentation — Checkout session create API: https://docs.stripe.com/api/checkout/sessions/create
- Stripe official documentation — Metadata: https://docs.stripe.com/metadata
- Codebase — `/prisma/schema.prisma`: `Purchase` model with `@@unique([userId, bookId])`, `stripePaymentId` field
- Codebase — `/src/app/(reader)/read/[bookSlug]/[chapterSlug]/page.tsx`: existing `hasPurchased` + `canRead` gate
- Codebase — `/src/lib/auth.ts`: Resend client pattern, `VerificationEmail` react-email usage
- Codebase — `/src/app/api/reading-progress/route.ts`: established API route handler pattern with `auth.api.getSession`
- Codebase — `/src/components/dashboard/EmptyLibrary.tsx`: existing My Library placeholder component

### Secondary (MEDIUM confidence)

- Pedro Alonso blog (2025) — Stripe + Next.js 15 complete guide: https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/
- Better Auth docs — Stripe plugin: https://www.better-auth.com/docs/plugins/stripe — confirmed subscriptions-only
- AnswerOverflow (Better Auth community) — confirmed one-time payment not supported by plugin: https://www.answeroverflow.com/m/1351983903744856084

### Tertiary (LOW confidence)

- npm registry: stripe package version 20.3.1 (latest as of Feb 2026) — verify before installing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Stripe SDK, Resend, react-email all verified; Better Auth plugin limitation confirmed by official docs + community
- Architecture: HIGH — patterns derived from existing codebase conventions + official Stripe docs
- Pitfalls: HIGH — raw body issue verified against Next.js GitHub issues + official Stripe docs; webhook timing issue is well-documented
- Discretion decisions: HIGH — all based on direct codebase inspection

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (Stripe and Next.js stable; Better Auth Stripe plugin limitation should be re-checked if timeline extends)
