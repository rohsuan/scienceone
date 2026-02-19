# Requirements: ScienceOne

**Defined:** 2026-02-18
**Core Value:** Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Catalog & Discovery

- [x] **CAT-01**: User can browse book catalog with category filters and sorting
- [ ] **CAT-02**: User can view book detail page with cover, synopsis, author bio/photo, table of contents, ISBN, pricing, and print metadata
- [x] **CAT-03**: User can search catalog by title, author, and subject
- [ ] **CAT-04**: User can preview a sample chapter before purchasing
- [ ] **CAT-05**: Book pages include Schema.org Book structured data for SEO

### Reader

- [ ] **READ-01**: User can read book chapters in browser with correctly rendered LaTeX math formulas (KaTeX, server-side pre-rendered)
- [ ] **READ-02**: User can navigate between chapters via table of contents sidebar
- [ ] **READ-03**: Reader is responsive and usable on mobile devices and tablets
- [ ] **READ-04**: User's reading progress is saved and restored when they return

### Authentication & Accounts

- [x] **AUTH-01**: User can create an account with email and password
- [x] **AUTH-02**: User can log in and maintain a session across browser refresh
- [ ] **AUTH-03**: User can view their purchased books in My Library
- [ ] **AUTH-04**: User receives email confirmation after purchase with access details

### Payments & Monetization

- [ ] **PAY-01**: User can purchase full book access via Stripe checkout
- [ ] **PAY-02**: Publisher can mark books as open access (free, no paywall)
- [ ] **PAY-03**: Open access books are readable and downloadable without purchase
- [ ] **PAY-04**: Purchase entitlement is granted via Stripe webhook (idempotent, not via redirect)

### Downloads

- [ ] **DL-01**: User can download purchased books as PDF (secured with time-limited presigned URLs)
- [ ] **DL-02**: User can download purchased books as EPUB
- [ ] **DL-03**: Book detail page shows print purchase link (external link to buy print edition)

### Content Management (Admin)

- [x] **ADM-01**: Publisher can ingest manuscripts in LaTeX, Word, and Markdown formats via automated pipeline (Pandoc)
- [x] **ADM-02**: Pipeline produces browser-readable HTML with pre-rendered KaTeX math, PDF, and EPUB artifacts
- [ ] **ADM-03**: Publisher can manage book metadata: cover image, ISBN, author bio/photo, synopsis, categories/tags, table of contents, print info (page count, dimensions), and print purchase link
- [ ] **ADM-04**: Publisher can set access model per book (pay-per-book or open access)
- [ ] **ADM-05**: Publisher can preview ingested content before publishing
- [ ] **ADM-06**: Publisher has a browser-based admin dashboard for uploading and managing books
- [ ] **ADM-07**: Reader can export book citation in BibTeX and APA formats

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reader Enhancements

- **READ-05**: User can customize reading experience (dark mode, font size, line spacing)
- **READ-06**: User can highlight text and add bookmarks within chapters
- **READ-07**: User can search within book content

### Payment Enhancements

- **PAY-05**: User can purchase individual chapters (pay-per-view)
- **PAY-06**: Publisher can create discount codes for bulk or institutional pricing

### Platform

- **PLAT-01**: User receives in-app notifications for new books in followed categories
- **PLAT-02**: Publisher can view analytics (views, purchases, downloads per book)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Author self-service portal | Founder manages all content; curator model preserves quality |
| DRM / copy protection | Academic STEM audience resents DRM; use watermarking instead |
| Subscription / all-access model | Insufficient catalog size (<20 books); revisit at 50+ books |
| Social features (reviews, ratings) | STEM credibility comes from author reputation, not user ratings |
| Real-time collaborative annotation | High complexity; ship single-user highlights first |
| LMS integration (Canvas, Moodle) | Significant engineering effort; defer until institutional deal |
| AI chatbot / ask-a-question | RAG over math content produces dangerous hallucinations |
| Native mobile app | Web-first; responsive design covers mobile |
| Offline reading mode | PDF download serves the offline need |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete (01-01) |
| AUTH-02 | Phase 1 | Complete (01-01) |
| ADM-01 | Phase 2 | Complete |
| ADM-02 | Phase 2 | Complete |
| CAT-01 | Phase 3 | Complete |
| CAT-02 | Phase 3 | Pending |
| CAT-03 | Phase 3 | Complete |
| CAT-04 | Phase 3 | Pending |
| CAT-05 | Phase 3 | Pending |
| READ-01 | Phase 4 | Pending |
| READ-02 | Phase 4 | Pending |
| READ-03 | Phase 4 | Pending |
| READ-04 | Phase 4 | Pending |
| PAY-01 | Phase 5 | Pending |
| PAY-02 | Phase 5 | Pending |
| PAY-03 | Phase 5 | Pending |
| PAY-04 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| DL-01 | Phase 6 | Pending |
| DL-02 | Phase 6 | Pending |
| DL-03 | Phase 6 | Pending |
| ADM-03 | Phase 7 | Pending |
| ADM-04 | Phase 7 | Pending |
| ADM-05 | Phase 7 | Pending |
| ADM-06 | Phase 7 | Pending |
| ADM-07 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after 01-04 completion — AUTH-01, AUTH-02 human-verified end-to-end (all 7 flows passed)*
