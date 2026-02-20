# Phase 5: Payments and Entitlement - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Stripe checkout for paid books, webhook-driven access entitlement, My Library showing purchased books, and purchase confirmation email. Open-access books remain freely readable. Downloads (PDF/EPUB) are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Purchase Flow
- Dedicated success page after Stripe checkout with "Start Reading" button — not a direct redirect to the reader or back to the detail page
- Success page confirms the purchase and provides a clear call-to-action to begin reading

### Receipt Email
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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user trusts Claude's judgment on visual and UX details, with two firm decisions: a dedicated post-purchase success page and professional/minimal receipt emails with download reminders.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-payments-and-entitlement*
*Context gathered: 2026-02-19*
