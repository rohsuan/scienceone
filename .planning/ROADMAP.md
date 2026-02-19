# Roadmap: ScienceOne

## Overview

ScienceOne builds from the ground up: project scaffold and auth first, then the manuscript ingest pipeline (the highest-risk dependency — every other feature depends on content being correctly ingested with pre-rendered math), then the public catalog and browser reader that deliver the core value, then payments that gate access, then secure downloads, then the admin dashboard that makes the founder self-sufficient, and finally reader enhancements that polish the academic experience. Eight phases, each delivering one complete verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js 16 project scaffold, PostgreSQL schema, and user authentication
- [x] **Phase 2: Ingest Pipeline** - Manuscript conversion to pre-rendered HTML/PDF/EPUB with KaTeX math (completed 2026-02-19)
- [x] **Phase 3: Catalog and Discovery** - Public book browsing, search, detail pages, and SEO (completed 2026-02-19)
- [x] **Phase 4: Browser Reader** - In-browser chapter reading with LaTeX math and navigation (completed 2026-02-19)
- [x] **Phase 5: Payments and Entitlement** - Stripe checkout, webhook-driven access grants, and My Library (completed 2026-02-19)
- [x] **Phase 6: Secure Downloads** - Purchase-verified presigned URL delivery for PDF and EPUB files (completed 2026-02-19)
- [ ] **Phase 7: Admin Dashboard** - Browser-based book management UI for the founder
- [ ] **Phase 8: Reader Enhancements** - Sample preview, reading progress, and academic citation export

## Phase Details

### Phase 1: Foundation
**Goal**: The project scaffold, database schema, and user authentication are in place so every subsequent phase has a stable foundation to build on
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password
  2. User can log in and remain logged in across browser refresh and tab close/reopen
  3. User can log out from any page in the application
  4. Next.js 16 application builds and deploys without errors; Prisma schema is migrated against PostgreSQL
**Plans**: 4 plans
- [x] 01-01-PLAN.md — Project scaffold, Prisma 7 schema, Better Auth config, seed data
- [x] 01-02-PLAN.md — Design system (Tailwind v4 academic theme, shadcn/ui), Header, Footer, landing page
- [x] 01-03-PLAN.md — Auth UI (sign-up, sign-in, verify-email pages with Google OAuth)
- [x] 01-04-PLAN.md — Protected dashboard shell, route protection, logout, end-to-end verification

### Phase 2: Ingest Pipeline
**Goal**: The founder can convert manuscripts in LaTeX, Word, or Markdown into correctly structured book records — chapters with pre-rendered KaTeX math stored in the database, PDF and EPUB artifacts uploaded to R2 — ready for catalog display and reading
**Depends on**: Phase 1
**Requirements**: ADM-01, ADM-02
**Success Criteria** (what must be TRUE):
  1. Founder can run the ingest CLI against a LaTeX manuscript and receive chapters with pre-rendered KaTeX HTML in the database, no client-side math rendering required
  2. Founder can run the ingest CLI against a Word (.docx) and Markdown manuscript and receive the same structured output
  3. Ingest pipeline outputs a conversion health report flagging Pandoc warnings, broken equations, and unsupported commands — pipeline halts on errors rather than silently corrupting content
  4. Generated PDF and EPUB artifacts are uploaded to Cloudflare R2 and their storage keys are recorded in the database
**Plans**: 2 plans
- [ ] 02-01-PLAN.md — Core pipeline modules: Pandoc wrapper, KaTeX renderer, chapter splitter, health report, schema migration
- [ ] 02-02-PLAN.md — CLI orchestration, R2 upload, DB persistence, test fixtures, end-to-end verification

### Phase 3: Catalog and Discovery
**Goal**: Readers can browse, filter, search, and preview ScienceOne's book catalog in a browser, with open-access books immediately readable and all detail pages structured for search engine discovery
**Depends on**: Phase 2
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05
**Success Criteria** (what must be TRUE):
  1. User can browse the book catalog filtered by category and sorted by title, date, or author; books display cover images
  2. User can search the catalog by title, author, and subject and receive relevant results
  3. User can view a book detail page showing cover, synopsis, author bio and photo, full table of contents, ISBN, pricing, print metadata, and print purchase link
  4. User can read a free sample chapter (first chapter) of any book without an account or purchase
  5. Book detail pages include Schema.org Book structured data parseable by Google's Rich Results Test
**Plans**: 2 plans
- [ ] 03-01-PLAN.md — Catalog listing page with book grid, category filters, sorting, and live search
- [ ] 03-02-PLAN.md — Book detail page with JSON-LD SEO, sample chapter preview, and visual verification

### Phase 4: Browser Reader
**Goal**: Readers can open any book they have access to and read chapters in the browser with correctly rendered mathematical formulas, a table of contents sidebar for navigation, and a layout that works on mobile and desktop — with their reading position saved between sessions
**Depends on**: Phase 3
**Requirements**: READ-01, READ-02, READ-03, READ-04
**Success Criteria** (what must be TRUE):
  1. User can open a chapter and see all LaTeX math formulas rendered correctly — equations, integrals, matrices, and proofs display without layout shift or client-side flash
  2. User can navigate between chapters using the table of contents sidebar; current chapter is highlighted
  3. Reader layout is usable on mobile (375px) and tablet (768px) viewports — text readable, math visible, navigation accessible
  4. When user returns to a book, the reader opens to the last chapter and scroll position they were reading
**Plans**: 2 plans
- [ ] 04-01-PLAN.md — Reader layout, routing, ToC sidebar, chapter rendering with KaTeX math, mobile responsive drawer, access control
- [ ] 04-02-PLAN.md — Reading progress API, scroll tracker, progress bar, resume navigation, visual verification

### Phase 5: Payments and Entitlement
**Goal**: Readers can purchase paid books via Stripe checkout and immediately access them; access is granted reliably through webhook — never via redirect — and purchased books appear in the user's library with a receipt email confirming the transaction
**Depends on**: Phase 4
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can complete a purchase for a pay-per-book title via Stripe Checkout and gain access to the reader without a manual page refresh
  2. Access is granted via Stripe webhook (checkout.session.completed) with idempotent upsert — paying twice for the same book does not create duplicate records or break access
  3. Open-access books are readable and downloadable by any user without an account or purchase
  4. User can view all purchased books in My Library with links to read each one
  5. User receives a purchase confirmation email with book title and access instructions within minutes of payment
**Plans**: 2 plans
- [x] 05-01-PLAN.md — Stripe checkout flow, webhook-driven access grant, and purchase confirmation email
- [x] 05-02-PLAN.md — My Library dashboard integration and end-to-end purchase flow verification

### Phase 6: Secure Downloads
**Goal**: Users with access to a book can download its PDF and EPUB files via time-limited presigned URLs; unauthenticated or unpurchased requests are rejected; print purchase links are visible on detail pages
**Depends on**: Phase 5
**Requirements**: DL-01, DL-02, DL-03
**Success Criteria** (what must be TRUE):
  1. User with purchased access can download a book's PDF; the download link is a time-limited presigned URL (expires in 15 minutes) and does not expose the underlying R2 storage path
  2. User with purchased access can download a book's EPUB file via the same presigned URL mechanism
  3. Attempting to download a PDF or EPUB without purchase (unauthenticated or unpurchased) returns an access denied response — not a broken link
  4. Book detail page displays the print purchase link (external link to buy print edition) when one is configured
**Plans**: 2 plans
- [x] 06-01-PLAN.md — Download API route, R2 client, DownloadButton/DownloadDropdown components, detail page integration, print link relocation
- [x] 06-02-PLAN.md — Wire downloads into library cards and reader header, end-to-end verification

### Phase 7: Admin Dashboard
**Goal**: The founder can manage the entire book catalog from a browser — uploading manuscripts, editing metadata, setting access models, previewing ingested content, and publishing or unpublishing books — without touching the command line
**Depends on**: Phase 6
**Requirements**: ADM-03, ADM-04, ADM-05, ADM-06
**Success Criteria** (what must be TRUE):
  1. Founder can upload a manuscript file from the browser and trigger the ingest pipeline; status (processing, success, error with details) is visible in the UI
  2. Founder can edit all book metadata fields — cover image, ISBN, author bio/photo, synopsis, categories/tags, table of contents, print info, print purchase link — and save changes
  3. Founder can set each book's access model (pay-per-book or open access) from the dashboard
  4. Founder can preview ingested book content — reading the chapters as a user would — before publishing the book to the public catalog
  5. Founder can publish and unpublish books; unpublished books are invisible to catalog and search
**Plans**: TBD

### Phase 8: Reader Enhancements
**Goal**: The reading and academic experience is polished — users can export citations in standard academic formats, and reading progress is reliable across all access paths including open-access books
**Depends on**: Phase 7
**Requirements**: ADM-07
**Success Criteria** (what must be TRUE):
  1. User can export a book's citation in BibTeX format with a single click; the exported text includes title, author, publisher, year, ISBN, and URL
  2. User can export a book's citation in APA format; the formatted string is copy-pasteable
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-02-18 |
| 2. Ingest Pipeline | 2/2 | Complete   | 2026-02-19 |
| 3. Catalog and Discovery | 2/2 | Complete    | 2026-02-19 |
| 4. Browser Reader | 2/2 | Complete    | 2026-02-19 |
| 5. Payments and Entitlement | 2/2 | Complete    | 2026-02-19 |
| 6. Secure Downloads | 2/2 | Complete   | 2026-02-19 |
| 7. Admin Dashboard | 0/TBD | Not started | - |
| 8. Reader Enhancements | 0/TBD | Not started | - |
