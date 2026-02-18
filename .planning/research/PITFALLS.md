# Pitfalls Research

**Domain:** Online STEM book publishing platform with LaTeX rendering and payment models
**Researched:** 2026-02-18
**Confidence:** MEDIUM-HIGH (most findings verified from multiple sources; specific conversion rate data unavailable)

---

## Critical Pitfalls

### Pitfall 1: Client-Side Math Rendering Flashing and Accessibility Failure

**What goes wrong:**
Every page load causes browsers to fetch raw LaTeX markup, parse it, and render it client-side with KaTeX or MathJax. Readers see a flash of unstyled LaTeX source before rendering completes. On slow connections or low-powered devices the delay is significant. More critically, image-based or JavaScript-dependent math breaks screen readers entirely — the math becomes invisible to assistive technology.

**Why it happens:**
Client-side rendering is the default "just add this script tag" approach. Developers ship fast in Phase 1 without thinking through SSR math. The performance and accessibility consequences only become obvious after deployment with real content.

**How to avoid:**
Pre-render math server-side during content ingestion using MathJax v3's Node.js API (outputs static HTML/CSS or SVG, no client-side execution required). Store rendered output in the database or CDN. Client-side rendering should only be a fallback for dynamic user-typed expressions. Set `aria-label` or MathML output for screen reader compatibility.

**Warning signs:**
- Users report seeing `$\frac{1}{2}$` or `\begin{align}` text briefly on page load
- Lighthouse accessibility scores below 70 on math-heavy pages
- Screen reader users report equations read as gibberish or skipped
- High CLS (Cumulative Layout Shift) scores on Core Web Vitals

**Phase to address:**
Content rendering pipeline phase (the phase that builds the book reader). Do not ship client-only rendering to production for any chapter, even during early testing.

---

### Pitfall 2: KaTeX Equation Numbering and Cross-Reference Gaps

**What goes wrong:**
KaTeX does not natively support `\label` and `\eqref` for equation cross-referencing. STEM books — especially physics and mathematics — rely heavily on numbered equations that are referenced elsewhere in the text ("see equation 3.14"). Without this support, equation numbers appear but clicking or referencing them does nothing, or numbers are wrong. Authors discover this only after their manuscript is processed.

**Why it happens:**
KaTeX's speed advantage over MathJax comes partly from its limited scope. Cross-referencing requires a two-pass compilation model (like LaTeX itself) that KaTeX's single-pass design does not implement. Developers pick KaTeX for performance without auditing the feature gaps specific to academic content.

**How to avoid:**
Two options — choose before Phase 1:
1. Use MathJax v3 (slower client-side, but supports `\eqref`, `\label`, `\tag`, equation numbering natively)
2. Use KaTeX with a custom post-processing step that assigns equation numbers and builds a cross-reference map server-side during ingestion, injecting them as rendered spans

Do not assume either library handles all LaTeX commands from submitted manuscripts. Build an explicit list of supported/unsupported commands and reject or flag manuscripts that use unsupported ones.

**Warning signs:**
- Physics or mathematics manuscripts contain `\label{eq:`, `\ref{eq:`, or `\eqref{` — check for these during ingestion
- Equation reference links in rendered HTML go nowhere or show "??" instead of numbers
- Authors report that equation numbering in the web version differs from their PDF original

**Phase to address:**
Manuscript ingestion and content rendering pipeline — must be decided before building the reader. Retrofitting later requires re-rendering all existing content.

---

### Pitfall 3: Payment Access Entitlement Race Condition and Webhook Unreliability

**What goes wrong:**
When a reader purchases chapter or book access, the app grants access based on a Stripe webhook (`payment_intent.succeeded` or `checkout.session.completed`). Webhooks can arrive late, out of order, or be retried multiple times. If entitlement is not idempotent, users may be double-charged in edge cases, or may pay successfully but see "access denied" because the webhook hasn't fired yet. For pay-per-view, where access is purchased per session, this directly blocks content delivery.

**Why it happens:**
Stripe webhooks are delivered at-least-once, not exactly-once. Developers build the happy path but don't implement idempotency keys or event deduplication. The race condition between the redirect after payment and webhook delivery is the most common source of support tickets ("I paid but can't access").

**How to avoid:**
- Store processed Stripe event IDs. Check before processing — if already handled, return 200 immediately
- Do not grant access in the payment success redirect. Grant access only from the webhook handler
- Add a polling endpoint or websocket that the reader page uses to wait for access grant, with a 30-second timeout fallback that shows "payment is processing, refresh in a moment"
- Use Stripe idempotency keys for all write operations
- Return 200 from webhook handler always (even on failures) to prevent Stripe's retry flood

**Warning signs:**
- Users report "I paid but can't read" support requests
- Webhook delivery logs show events being processed more than once
- Entitlement records show duplicate purchases for the same user/content pair
- Payment success page redirects to access-denied page

**Phase to address:**
Payment integration phase. Build webhook deduplication and entitlement logic before testing any payment flow end-to-end.

---

### Pitfall 4: Multi-Format Manuscript Ingestion Producing Corrupt or Incomplete Content

**What goes wrong:**
LaTeX, Word (.docx), and Markdown manuscripts each have different conventions for figures, tables, footnotes, bibliographies, theorem environments, and custom macros. Automated conversion (Pandoc or similar) produces HTML that looks correct for simple chapters but silently drops or corrupts complex structures: custom `\newtheorem` environments, multi-column layouts, TikZ figures, bibliography cross-references, and embedded sub-figures. Founders discover the corruption only after publishing, when an author complains their book is wrong.

**Why it happens:**
Pandoc is the default tool and handles the 80% case well. The other 20% — which is disproportionately common in STEM manuscripts — requires custom filters, pre-processing, and manual review steps. Teams underestimate this and build a pipeline that claims to support all three formats but actually only handles clean Markdown reliably.

**How to avoid:**
- Build a manuscript validation step that runs before ingestion and outputs a "conversion health report" listing unknown commands, unsupported environments, and missing figures
- For LaTeX: maintain an explicit allowlist of supported packages and macros; reject or flag others
- For Word: treat as the most lossy format — require authors to submit clean Word without tracked changes, embedded objects, or custom styles
- For Markdown: support only CommonMark + math fences (no custom extensions)
- Always generate a preview and require founder sign-off before publishing

**Warning signs:**
- Ingested chapter HTML passes automated tests but looks wrong visually (spacing issues, missing boxes around theorems, missing figure captions)
- Authors report differences between their original and the published version
- Figures referenced with `\ref{fig:}` render as "Figure ??" in the web version
- Pandoc conversion logs contain warnings but pipeline treats them as non-blocking

**Phase to address:**
Manuscript ingestion pipeline phase. Build the review/preview workflow before scaling to more than 3 books — errors compound when many books exist.

---

### Pitfall 5: PDF/EPUB Downloads That Fail EU Accessibility Requirements

**What goes wrong:**
The European Accessibility Act (EAA) took full effect June 28, 2025, requiring all newly published ebooks sold in the EU to meet WCAG 2.1 Level AA. Most generated PDFs fail this by default: math renders as images with no alt text, heading structure is lost, tables have no scope attributes, and document language is unset. An inaccessible PDF is a legal liability in the EU and harms users with disabilities everywhere.

**Why it happens:**
PDF and EPUB are generated as a feature add-on after the web reader works. Accessibility is assumed to "just work" from the source LaTeX but it doesn't — LaTeX's PDF output has notoriously poor accessibility, and browser-print-to-PDF (Puppeteer) produces untagged PDFs by default.

**How to avoid:**
- For EPUB: use reflowable EPUB 3 with MathML (not images for equations). Validate with epubcheck and Ace by DAISY before publishing any download
- For PDF: use a pipeline that produces tagged PDF (PDF/UA). Consider generating from EPUB via Calibre or a dedicated PDF/UA tool rather than from LaTeX directly
- Include `lang` attribute on all HTML, proper heading hierarchy (h1 > h2 > h3), and `aria-label` on all math elements
- Add alt text workflow for figures — founder must enter alt text for every non-decorative image

**Warning signs:**
- Ace by DAISY validator reports more than 2 EPUB accessibility failures
- PDF lacks bookmarks/outlines or shows no document structure in Acrobat's accessibility panel
- Math in EPUB displays as `[MATH]` placeholder in some e-readers
- No `lang` attribute visible on `<html>` tag of generated EPUB HTML files

**Phase to address:**
Download generation phase, but accessibility structure (heading hierarchy, lang, figure alt text) must be established in the content ingestion phase, not retrofit later.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Client-side KaTeX only (no SSR) | Fast initial implementation | Accessibility failure, CLS, flash-of-unstyled-LaTeX; re-rendering all content when fixed | Never — build SSR rendering from the start |
| Single ISBN for all formats (PDF, EPUB, web) | Simpler metadata | Rejected by retailers; metadata mismatch causes delisting; can't change after first sale | Never — assign distinct ISBNs per format |
| Serving download files directly from app server | Simple early setup | DMCA/piracy vector; server load spike; no download analytics | MVP only with <10 books; must migrate to CDN-signed URLs before launch |
| Storing Stripe payment state only in Stripe | No local DB required | Entitlement checks require API call on every page load; slow; fragile if Stripe is down | Never — mirror entitlement state locally |
| Skipping manuscript preview step | Faster ingestion | Silent content corruption discovered by readers, not founder | Never — always require preview sign-off |
| Storing rendered math in page HTML as inline `<style>` | Simple output | Huge HTML payloads for math-dense books; breaks caching | Acceptable only for SSR SVG output (smaller than CSS fallback) |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Webhooks | Granting entitlement in payment redirect, not webhook | Always grant entitlement from `payment_intent.succeeded` webhook; use polling on the client to wait for access |
| Stripe Webhooks | Not verifying webhook signature | Always verify with `stripe.webhooks.constructEvent()` using raw request body — parsed body breaks signature |
| Stripe Webhooks | Returning 4xx on business logic failure | Always return 200 to Stripe; handle failures internally with retry queues |
| KaTeX / MathJax | Assuming all LaTeX commands are supported | Build a validation step against each library's supported command list before ingestion |
| Pandoc (LaTeX ingestion) | Treating conversion warnings as non-fatal | Conversion warnings indicate content loss; treat as errors requiring manual review |
| PDF generation via Puppeteer | Not waiting for math rendering before capture | MathJax/KaTeX render asynchronously; Puppeteer must wait for `window.MathJax.promise` or equivalent before `page.pdf()` |
| EPUB validators | Skipping epubcheck | EPUB stores (Apple Books, Kobo) reject invalid EPUBs silently; run epubcheck in CI |
| CDN (file downloads) | Serving with permanent public URLs | Enables link sharing that bypasses payment; use time-limited signed URLs (e.g., S3 presigned URLs, 15-minute expiry) |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering math client-side for every reader | Slow Time-to-Interactive on math-heavy chapters; high CPU on mobile | Pre-render and cache server-side HTML output during ingestion | Immediately for complex chapters; visibly at 100+ concurrent readers |
| Loading entire book content into DOM on first view | Long initial load; memory pressure on mobile browsers | Chapter-based lazy loading; virtualize long content | Books over ~50 pages or chapters with many figures |
| Synchronous manuscript ingestion in web request | Request timeout for large LaTeX files | Background job queue (BullMQ or similar); return job ID immediately; poll for status | Files over ~500KB; complex LaTeX with many figures |
| Entitlement checks via Stripe API call per page load | P99 latency spikes when Stripe has partial outages; read cost | Cache entitlement state in local database; invalidate on webhook events | Any time Stripe has degraded performance (~2-3x/year) |
| Serving EPUB/PDF files without CDN | Origin server bandwidth exhaustion during traffic spikes | Store files on object storage (S3/R2); serve via CDN with signed URLs | 50+ concurrent downloads |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing chapter content URLs without entitlement validation on every request | Any reader who has the URL (from cache, link sharing, DevTools) can read paid content | Every content endpoint must re-validate entitlement server-side; do not rely on URL obscurity |
| Download URLs that never expire | Purchased download link shared publicly; bypasses payment for future readers | Use presigned URLs with 15-minute TTL; log download events |
| Serving LaTeX source files publicly | Author's raw manuscript exposed; violates publisher agreements | LaTeX source is internal only; only rendered HTML/PDF/EPUB is served to readers |
| Embedding raw purchase data (user email, receipt) in client-visible metadata | PII exposure in HTML source or browser storage | Keep entitlement checks server-side; never embed purchase details in client responses |
| Soft DRM without watermarking | No way to trace pirated copies back to the buyer | Embed buyer email and order ID as invisible watermark in downloaded PDFs at generation time |
| Missing rate limits on download endpoint | One user can bulk-download all books to scrape content | Rate limit downloads per user per hour; flag anomalous patterns |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Fixed-layout reader that doesn't adapt to screen size | Math equations overflow or are clipped on mobile; reader must pinch-zoom | Reflowable HTML reader with responsive font sizes; horizontal scroll only for very wide equations |
| Requiring account creation before showing any book preview | High bounce rate from browse-intent visitors | Allow read-first-pages (e.g., first 10%) without account; gate full access |
| Pay-per-view with no "buy full book" upsell at point of purchase | Users pay per-chapter repeatedly and eventually spend more than book price without realizing; creates resentment | Show "full book price is $X — you've spent $Y on chapters" prominently |
| Table of contents that doesn't reflect actual rendered sections | Users navigate to wrong place; trust erosion | Generate TOC programmatically from rendered HTML headings, not from manuscript-supplied metadata alone |
| No progress persistence for long books | Users lose their place after closing browser | Store last-read position (chapter + scroll offset) server-side; restore on return |
| Sending readers to generic Stripe checkout page | Loss of brand continuity; trust reduction for academic audience | Use Stripe Payment Element embedded in the app; keep the reader in context |
| No clear "what's in this book" before purchase | High refund requests | Show: full table of contents, first chapter preview, author bio, ISBN, page count before purchase gate |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Math rendering:** Looks correct in Chrome desktop — verify on Firefox, Safari, iOS Chrome, and with JavaScript disabled (SSR fallback)
- [ ] **Payment flow:** Payment succeeds in Stripe dashboard — verify entitlement is written to local DB and reader gains access within 5 seconds without manual refresh
- [ ] **Chapter download:** PDF downloads and opens — verify heading structure exists in Acrobat's accessibility panel; verify equations are tagged not images
- [ ] **EPUB download:** EPUB opens in Calibre — run through epubcheck and Ace by DAISY validator; verify on Kindle, Apple Books, Kobo
- [ ] **Manuscript ingestion:** HTML looks correct in browser — check all cross-references (equation, figure, section) resolve; check bibliography renders; verify no raw `??` placeholders
- [ ] **Pay-per-view access control:** Content gated behind paywall in UI — verify direct HTTP request to content API without auth token returns 401, not the content
- [ ] **Open access books:** Marked as free — verify no payment prompts appear; verify download links work without login
- [ ] **ISBN metadata:** Book shows correct ISBN — verify each format (web/PDF/EPUB) has a distinct ISBN and metadata matches across all three
- [ ] **Book catalog page:** All metadata visible — verify cover image, author bio, synopsis, full TOC, print ISBN, and categories are populated before publishing

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| All content rendered client-side, need to switch to SSR | HIGH | Re-run ingestion pipeline for all books with SSR rendering; store pre-rendered HTML; update reader component; 1-2 week engineering sprint |
| Wrong ISBNs assigned to formats | HIGH | Contact ISBN agency; update metadata everywhere; risk of retailer delisting during transition; requires coordination with any distributors |
| Entitlement not idempotent — users double-charged | HIGH | Audit all payment events; issue refunds via Stripe; add deduplication and re-run affected webhook events |
| Pandoc-ingested content has silent errors across all books | MEDIUM | Write validation script to scan all books for known error patterns (`??`, empty theorem boxes, missing figures); triage by severity; re-ingest affected chapters |
| Download URLs permanently exposed and shared | MEDIUM | Rotate all existing download URLs to signed-URL model; communicate to existing purchasers that their links have changed; add re-download mechanism from account page |
| KaTeX chosen and equation cross-references broken | MEDIUM | Switch to MathJax v3 or build custom cross-reference post-processor; re-render all book HTML; test all equation references |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Client-side math rendering / accessibility | Content rendering pipeline (early) | Lighthouse accessibility audit on 3 math-heavy sample chapters before launch |
| KaTeX equation numbering gaps | Tech stack decision (before any rendering work) | Test `\label`, `\eqref`, `\tag` with real physics/math manuscript before committing to library |
| Payment entitlement race condition | Payment integration phase | Simulate slow webhook delivery (5-second delay); verify reader gains access via polling |
| Multi-format ingestion corruption | Manuscript ingestion phase | Ingest one LaTeX, one Word, one Markdown sample with theorems, figures, and bibliography; founder sign-off required |
| EPUB/PDF accessibility failures | Download generation phase | Run Ace by DAISY and epubcheck on every generated EPUB; open PDF in Acrobat's accessibility checker |
| Insecure content URLs | Auth and access control phase | Penetration test: attempt to access paid chapter API without valid session and without purchase record |
| Stripe webhook unreliability | Payment integration phase | End-to-end test: use Stripe CLI to simulate webhook delivery failure and verify retry is handled correctly |
| Fixed-layout reader on mobile | Reader UI phase | Test on physical iPhone SE and Android mid-range device with a 20-equation chapter |

---

## Sources

- KaTeX known issues and limitations: https://katex.org/docs/issues (HIGH confidence — official docs)
- KaTeX equation numbering limitation (GitHub issue #350, #571, Discussion #3708): https://github.com/KaTeX/KaTeX/issues/350 (HIGH confidence — official repo)
- "Math Rendering is Wrong" — server-side vs client-side math rendering analysis: https://danilafe.com/blog/math_rendering_is_wrong/ (MEDIUM confidence — practitioner analysis, well-reasoned)
- Accessibility in Digital Publishing 2025 — EPUB accessibility and EAA requirements: https://publishdrive.com/accessibility-in-digital-publishing-2025-your-complete-guide-to-creating-inclusive-epubs-2.html (MEDIUM confidence — verified against EAA effective date)
- AMS guidance for accessible mathematics online: https://www.ams.org/accessibility/accessibility-guidance (HIGH confidence — official mathematical society)
- Stripe idempotency documentation: https://docs.stripe.com/api/idempotent_requests (HIGH confidence — official Stripe docs)
- Stripe webhook best practices: https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks (MEDIUM confidence — practitioner post-mortem)
- Pandoc LaTeX to HTML conversion issues (GitHub issue #10176): https://github.com/jgm/pandoc/issues/10176 (HIGH confidence — official repo issue tracker)
- ISBN metadata mistakes: https://www.isbnservices.com/correct-isbn-metadata-after-publishing/ (MEDIUM confidence — ISBNservices industry source)
- DRM and ebook piracy protection 2025: https://www.editionguard.com/learn/ebook-drm-why-digital-rights-management-matters/ (MEDIUM confidence — industry publisher)
- Puppeteer PDF generation for server-side math: https://pptr.dev/guides/pdf-generation (HIGH confidence — official Puppeteer docs)
- European Accessibility Act effective date confirmed: June 28, 2025 (HIGH confidence — verified from multiple EU publishing sources)

---
*Pitfalls research for: ScienceOne — Online STEM book publishing platform*
*Researched: 2026-02-18*
