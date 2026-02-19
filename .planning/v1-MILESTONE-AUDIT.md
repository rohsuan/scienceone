---
milestone: v1.0
audited: 2026-02-20
status: gaps_found
scores:
  requirements: 25/27
  phases: 7/8
  integration: 6/8
  flows: 6/8
gaps:
  requirements:
    - id: "ADM-03"
      status: "unsatisfied"
      phase: "Phase 7"
      claimed_by_plans: ["07-02-PLAN.md"]
      completed_by_plans: ["07-02-SUMMARY.md"]
      verification_status: "gaps_found"
      evidence: "BookEditForm.tsx registers pageCount and price without { valueAsNumber: true }. Zod z.number() rejects string values from HTML number inputs. Editing these fields from null to a value fails validation silently."
    - id: "ADM-04"
      status: "unsatisfied"
      phase: "Phase 7"
      claimed_by_plans: ["07-01-PLAN.md", "07-02-PLAN.md"]
      completed_by_plans: ["07-01-SUMMARY.md", "07-02-SUMMARY.md"]
      verification_status: "gaps_found"
      evidence: "Price field in BookEditForm.tsx has same valueAsNumber bug as pageCount. When isOpenAccess is toggled off and admin enters a price, Zod z.number() rejects the string input. Admin cannot set price on a book that currently has no price."
  integration:
    - from: "Phase 1 (Auth)"
      to: "Phase 5 (Payments)"
      issue: "Sign-in page ignores ?redirect= query parameter. SignInForm unconditionally pushes to /dashboard. Users signing in to purchase a book are dropped at /dashboard instead of returning to the book detail page."
      affected_requirements: ["PAY-01"]
      severity: "degraded_flow"
    - from: "Phase 5 (Payments)"
      to: "Phase 6 (Downloads)"
      issue: "Open access downloads require authenticated session. Both catalog detail page UI gate (line 125: book.isOpenAccess && session) and /api/download route (line 26: 401 if no session) block anonymous users from downloading open access books. Reading works anonymously; downloading does not."
      affected_requirements: ["PAY-03"]
      severity: "degraded_flow"
  flows:
    - flow: "Sign-in to Purchase"
      breaks_at: "SignInForm.tsx line 61 — router.push('/dashboard') ignores redirect param"
    - flow: "Open Access Anonymous Download"
      breaks_at: "catalog/[slug]/page.tsx line 125 (UI gate) and api/download/route.ts line 26 (API gate) both require session"
tech_debt:
  - phase: 02-ingest
    items:
      - "health-report.ts lines 37-41: dead if/else branch — both paths push to pandocWarnings"
  - phase: 05-payments-and-entitlement
    items:
      - "hasPurchased() in reader-queries.ts does not filter by status: 'completed' — benign since webhook always sets completed, but less defensive than hasPurchasedBySlug()"
      - "PurchaseConfirmation email lines 65-69: misleading copy says 'downloads will be available soon' when they are immediately available after ingest"
  - phase: 06-secure-downloads
    items:
      - "In-memory rate limiter (downloadRequests Map) resets on deploy and does not coordinate across Node processes — acceptable at current scale"
  - phase: 07-admin-dashboard
    items:
      - "BookEditForm.tsx: pageCount and price register() missing { valueAsNumber: true } (this is the ADM-03/ADM-04 blocker)"
---

# v1 Milestone Audit Report

**Milestone:** v1.0 — ScienceOne Initial Release
**Audited:** 2026-02-20
**Status:** gaps_found
**Core Value:** Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser

---

## Requirements Coverage (25/27)

### 3-Source Cross-Reference

| REQ-ID | Description | VERIFICATION | SUMMARY | REQ.md | Final |
|--------|-------------|-------------|---------|--------|-------|
| AUTH-01 | Create account with email+password | passed | 01-01,01-03,01-04 | [x] | **satisfied** |
| AUTH-02 | Log in, session persists across refresh | passed | 01-01,01-02,01-03,01-04 | [x] | **satisfied** |
| AUTH-03 | View purchased books in My Library | passed | 05-02 | [x] | **satisfied** |
| AUTH-04 | Email confirmation after purchase | passed | 05-01 | [x] | **satisfied** |
| CAT-01 | Browse catalog with category filters and sorting | passed | 03-01 | [x] | **satisfied** |
| CAT-02 | Book detail page (cover, synopsis, bio, TOC, ISBN, pricing) | passed | 03-02 | [x] | **satisfied** |
| CAT-03 | Search by title, author, subject | passed | 03-01 | [x] | **satisfied** |
| CAT-04 | Preview sample chapter before purchasing | passed | 03-02 | [x] | **satisfied** |
| CAT-05 | Schema.org Book structured data for SEO | passed | 03-02 | [x] | **satisfied** |
| READ-01 | Read chapters with KaTeX math rendering | passed | 04-01 | [x] | **satisfied** |
| READ-02 | Navigate chapters via ToC sidebar | passed | 04-01 | [x] | **satisfied** |
| READ-03 | Responsive on mobile and tablets | passed | 04-01 | [x] | **satisfied** |
| READ-04 | Reading progress saved and restored | passed | 04-02 | [x] | **satisfied** |
| PAY-01 | Purchase via Stripe checkout | passed | 05-01 | [x] | **satisfied** |
| PAY-02 | Publisher can mark books as open access | passed | 05-01 | [x] | **satisfied** |
| PAY-03 | Open access readable/downloadable without purchase | passed | 05-01 | [x] | **satisfied** |
| PAY-04 | Webhook-driven entitlement, idempotent | passed | 05-01 | [x] | **satisfied** |
| DL-01 | Download PDF via presigned URL | passed | 06-01,06-02 | [x] | **satisfied** |
| DL-02 | Download EPUB via presigned URL | passed | 06-01,06-02 | [x] | **satisfied** |
| DL-03 | Print purchase link on detail page | passed | 06-01 | [x] | **satisfied** |
| ADM-01 | Ingest LaTeX, Word, Markdown via Pandoc | passed | 02-01,02-02 | [x] | **satisfied** |
| ADM-02 | Pipeline produces HTML+KaTeX, PDF, EPUB | passed | 02-01,02-02 | [x] | **satisfied** |
| ADM-03 | Manage book metadata (cover, ISBN, bio, etc.) | **gaps_found** | 07-02 | [x] | **unsatisfied** |
| ADM-04 | Set access model per book (pay/open) | **gaps_found** | 07-01,07-02 | [x] | **unsatisfied** |
| ADM-05 | Preview ingested content before publishing | passed | 07-03 | [x] | **satisfied** |
| ADM-06 | Browser-based admin dashboard | passed | 07-01,07-03 | [x] | **satisfied** |
| ADM-07 | Citation export in BibTeX and APA | passed | 08-01 | [x] | **satisfied** |

**Orphaned requirements:** None. All 27 v1 requirements appear in at least one phase VERIFICATION.md.

### Unsatisfied Requirements Detail

**ADM-03: Publisher can manage book metadata**
- **Gap:** `BookEditForm.tsx` registers `pageCount` and `price` fields without `{ valueAsNumber: true }`. Zod schema uses `z.number()` which rejects string values from HTML number inputs. Admin cannot edit pageCount from null to a numeric value.
- **Fix:** Add `{ valueAsNumber: true }` to `register("pageCount")` and `register("price")` calls in BookEditForm.tsx.
- **Impact:** 2 of ~15 metadata fields affected. All other fields (title, slug, author, ISBN, dimensions, synopsis, categories, images, print link) work correctly.

**ADM-04: Publisher can set access model per book**
- **Gap:** Same `price` field bug as ADM-03. When toggling isOpenAccess off and entering a price, Zod rejects the string input. The isOpenAccess toggle itself works.
- **Fix:** Same fix as ADM-03 — add `{ valueAsNumber: true }` to `register("price")`.
- **Impact:** Cannot set a price on a book that currently has no price set. Books with existing prices save correctly.

---

## Phase Status (7/8)

| Phase | Status | Score | Key Findings |
|-------|--------|-------|-------------|
| 1. Foundation | passed | 18/18 | All auth and scaffold verified; 4 items human-verified |
| 2. Ingest Pipeline | passed | 8/10 auto + 2 human | Dry-run verified; live DB/R2 need human test |
| 3. Catalog and Discovery | passed | 12/12 | All truths verified; 4 items need browser test |
| 4. Browser Reader | passed | 9/9 | All structural checks pass; 5 items need browser test |
| 5. Payments and Entitlement | passed | 5/5 | All code verified; 3 items need Stripe/Resend live test |
| 6. Secure Downloads | passed | 9/9 | All truths verified; no gaps |
| 7. Admin Dashboard | **gaps_found** | 15/16 | pageCount/price valueAsNumber bug affects 2 fields |
| 8. Reader Enhancements | passed | 5/5 | Citation export fully verified |

---

## Integration Check (6/8 flows)

### Complete Flows

| # | Flow | Path | Status |
|---|------|------|--------|
| 1 | Paid Access: Catalog → Purchase → Reader | catalog → BuyButton → Stripe → webhook → Purchase upsert → reader access | Complete |
| 2 | Reader Access Control | chapter page → auth + hasPurchased check → grant/redirect | Complete |
| 3 | Ingest → Catalog → Reader | admin upload → R2 → ingest pipeline → DB chapters → catalog display → reader render | Complete |
| 4 | My Library | dashboard → getUserPurchases → LibraryBookCard → reader link | Complete |
| 5 | Reading Progress | scroll → debounced PATCH → DB upsert → page load → getReadingProgress → redirect + restore | Complete |
| 6 | Citation Export | catalog detail → getBookBySlug → CitationData → buildBibtex/buildApa → clipboard | Complete |

### Degraded Flows

| # | Flow | Break Point | Impact | Affected Reqs |
|---|------|-------------|--------|---------------|
| 7 | Sign-in → Purchase | `SignInForm.tsx:61` — `router.push("/dashboard")` ignores `?redirect=` param | Unauthenticated user clicking "Sign In to Purchase" lands on /dashboard, must manually navigate back to book | PAY-01 |
| 8 | Open Access Anonymous Download | `catalog/[slug]/page.tsx:125` UI gate and `api/download/route.ts:26` API gate both require session | Anonymous users can READ open access books but cannot DOWNLOAD them | PAY-03 |

### Cross-Phase Wiring

All 27 requirements have verified cross-phase connections. Key integration points:
- **Auth → Reader/Dashboard:** `auth.api.getSession` used in 7 server components
- **Ingest → Catalog:** `getPublishedBooks`/`getBookBySlug` query the same DB rows written by ingest pipeline
- **Catalog → Reader:** Pre-rendered KaTeX HTML stored by ingest, served via `dangerouslySetInnerHTML`
- **Payments → Downloads:** `hasPurchased`/purchase record gates both reader and download access
- **Admin → Ingest:** Browser-based IngestUploader triggers the same `scripts/ingest.ts` pipeline

---

## Tech Debt Summary

### By Phase

**Phase 2: Ingest Pipeline**
- `health-report.ts` lines 37-41: dead if/else branch (both paths push to pandocWarnings)

**Phase 5: Payments**
- `hasPurchased()` in reader-queries.ts doesn't filter by `status: "completed"` (benign — webhook always sets completed)
- `PurchaseConfirmation.tsx` lines 65-69: misleading copy says "downloads will be available soon" when they're immediately available

**Phase 6: Downloads**
- In-memory rate limiter resets on deploy; no cross-process coordination (acceptable at current scale)

**Phase 7: Admin Dashboard**
- `BookEditForm.tsx`: pageCount and price `register()` missing `{ valueAsNumber: true }` (this is the ADM-03/ADM-04 blocker — included here as tech debt is also a gap)

### Total: 5 items across 4 phases

---

## Notes

**CAT-02 (author photo):** The integration checker noted that `authorImage` is stored but not rendered in the public catalog. This was documented as an intentional product decision in Phase 3 VERIFICATION: "author photos are excluded per locked project decision." Author bio is rendered as a one-liner. Not flagged as a gap.

**AUTH-04 (email copy):** Purchase confirmation email contains slightly misleading copy about download availability ("available soon" vs immediately available). Functional email delivery is implemented; this is a copy issue tracked as tech debt.

---

_Audited: 2026-02-20_
_Auditor: Claude (milestone audit orchestrator)_
