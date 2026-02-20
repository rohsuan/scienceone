---
phase: 05-payments-and-entitlement
plan: 01
subsystem: payments
tags: [stripe, resend, react-email, server-actions, webhooks, prisma]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: auth (Better Auth session), Prisma schema (Purchase model), Resend email infrastructure
  - phase: 03-catalog
    provides: Book detail page, book-queries, pricing data
  - phase: 04-reader
    provides: /read/[bookSlug] reading route that purchase grants access to
provides:
  - Stripe Checkout redirect flow (Buy button -> Server Action -> Stripe-hosted checkout)
  - Idempotent Purchase upsert via Stripe webhook (not redirect)
  - Purchase confirmation email via Resend
  - /purchase/success page with Start Reading CTA
  - hasPurchasedBySlug and getUserPurchases query helpers
affects: [05-02-my-library, 04-reader access control]

# Tech tracking
tech-stack:
  added: [stripe@20.x]
  patterns:
    - Server Action with redirect() for checkout initiation
    - Raw body reading with request.text() for Stripe webhook signature verification
    - Fire-and-forget email with void resend.emails.send()
    - Idempotent upsert via Prisma @@unique([userId, bookId]) constraint
    - React cache() for per-request deduplication of purchase queries

key-files:
  created:
    - src/lib/stripe.ts
    - src/lib/checkout-actions.ts
    - src/lib/purchase-queries.ts
    - src/components/catalog/BuyButton.tsx
    - src/app/(main)/purchase/success/page.tsx
    - src/app/api/webhooks/stripe/route.ts
    - src/emails/PurchaseConfirmation.tsx
  modified:
    - src/app/(main)/catalog/[slug]/page.tsx
    - .env.example
    - package.json

key-decisions:
  - "Stripe-hosted checkout (redirect) used — not embedded Elements; no @stripe/stripe-js needed"
  - "Access granted via webhook (checkout.session.completed), never via success page redirect — prevents access without payment"
  - "Duplicate webhook events handled by Prisma upsert on @@unique([userId, bookId]) — idempotent by design"
  - "Purchase confirmation email is fire-and-forget (void) — email failure does not block purchase completion"
  - "request.text() must be used in webhook route (not request.json()) — Stripe signature verification requires raw body"
  - "Placeholder Stripe env vars added to .env to allow build to succeed without real credentials"

patterns-established:
  - "Server Action pattern: 'use server' + headers() + auth.api.getSession() + redirect()"
  - "Client component with useTransition for async Server Action calls (prevents double-submit)"
  - "Webhook pattern: raw body -> signature verify -> event type switch -> upsert -> fire-and-forget email"
  - "Purchase email template: same style system as VerificationEmail (#1e2d5e header, same fonts, same footer)"

requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, AUTH-04]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 05 Plan 01: Stripe Checkout and Purchase Confirmation Summary

**Stripe-hosted checkout flow with webhook-driven Purchase upsert, idempotent access grant, and receipt email via Resend**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T09:38:59Z
- **Completed:** 2026-02-19T09:42:32Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Full Stripe Checkout redirect flow: Buy button -> Server Action -> Stripe-hosted checkout -> success page
- Webhook handler grants access via idempotent Purchase upsert (never via redirect)
- Purchase confirmation email with book title, price, date, Start Reading CTA, and download reminder
- Book detail page conditionally renders Buy/Read Now/Sign In to Purchase/Read Free based on auth + purchase + access state

## Task Commits

Each task was committed atomically:

1. **Task 1: Stripe SDK, checkout action, buy button, success page** - `e010df6` (feat)
2. **Task 2: Stripe webhook handler and purchase confirmation email** - `176abec` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/lib/stripe.ts` - Stripe SDK singleton (new Stripe(process.env.STRIPE_SECRET_KEY!))
- `src/lib/checkout-actions.ts` - createCheckoutSession Server Action with auth check, price fetch, idempotency check
- `src/lib/purchase-queries.ts` - hasPurchasedBySlug (by slug join) and getUserPurchases (for My Library)
- `src/components/catalog/BuyButton.tsx` - Client component with useTransition for loading state
- `src/app/(main)/purchase/success/page.tsx` - Success page retrieving Stripe session, showing Start Reading CTA
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler: raw body, signature verify, idempotent upsert, fire-and-forget email
- `src/emails/PurchaseConfirmation.tsx` - Receipt email template matching VerificationEmail style system
- `src/app/(main)/catalog/[slug]/page.tsx` - Updated with conditional Buy/Read Now/Sign In to Purchase/Read Free
- `.env.example` - Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL

## Decisions Made
- Used Stripe-hosted checkout (redirect), not embedded Elements — simpler, more secure, no PCI scope
- Access granted via webhook only, never via success page redirect — prevents access without confirmed payment
- Idempotent Purchase upsert using Prisma's @@unique([userId, bookId]) — safe for duplicate webhook delivery
- Email sending is fire-and-forget (void) — email failure does not block or roll back the purchase
- request.text() in webhook route — critical; request.json() breaks Stripe signature verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Stripe placeholder env vars to .env**
- **Found during:** Task 1 (build verification)
- **Issue:** Build failed with "Neither apiKey nor config.authenticator provided" — Stripe SDK initializes at module evaluation time and requires STRIPE_SECRET_KEY even during build
- **Fix:** Added `STRIPE_SECRET_KEY=sk_test_placeholder`, `STRIPE_WEBHOOK_SECRET=whsec_placeholder`, `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env`
- **Files modified:** .env (not committed — git-ignored)
- **Verification:** Build passed after adding placeholders
- **Committed in:** e010df6 (Task 1 commit, only .env.example committed)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for build to succeed locally without real Stripe credentials. .env is git-ignored; only .env.example (with documented placeholder values) is committed.

## Issues Encountered
- Stripe SDK requires API key at module import time — build fails without STRIPE_SECRET_KEY in .env. Resolved by adding placeholder values to local .env (not committed).

## User Setup Required

Before using the payment flow, configure in `.env`:

1. **Stripe Dashboard Setup:**
   - Get Secret Key: Stripe Dashboard -> Developers -> API keys -> Secret key (`sk_test_...`)
   - Set `STRIPE_SECRET_KEY=sk_test_...`

2. **Stripe CLI for local webhooks:**
   ```bash
   brew install stripe/stripe-cli/stripe && stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # Copy the whsec_... value printed
   ```
   - Set `STRIPE_WEBHOOK_SECRET=whsec_...`

3. **App URL:**
   - Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` (already added to .env via deviation fix)

## Next Phase Readiness
- Plan 02 (My Library) can now use `getUserPurchases(userId)` from `src/lib/purchase-queries.ts`
- Purchase access check pattern established: hasPurchasedBySlug() used in detail page, same pattern can be applied elsewhere
- Stripe payment flow is complete end-to-end; Stripe keys needed for live testing

---
*Phase: 05-payments-and-entitlement*
*Completed: 2026-02-19*

## Self-Check: PASSED

All claimed files exist and all commits verified:
- FOUND: src/lib/stripe.ts
- FOUND: src/lib/checkout-actions.ts
- FOUND: src/lib/purchase-queries.ts
- FOUND: src/components/catalog/BuyButton.tsx
- FOUND: src/app/(main)/purchase/success/page.tsx
- FOUND: src/app/api/webhooks/stripe/route.ts
- FOUND: src/emails/PurchaseConfirmation.tsx
- FOUND: src/app/(main)/catalog/[slug]/page.tsx
- FOUND: .env.example
- FOUND: commit e010df6 (Task 1)
- FOUND: commit 176abec (Task 2)
