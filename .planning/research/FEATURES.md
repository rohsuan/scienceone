# Feature Research

**Domain:** Online STEM book publishing platform (mathematics and physics)
**Researched:** 2026-02-18
**Confidence:** MEDIUM — Strong signals from Cambridge Core, Perlego, VitalSource, LiveCarta, and open-source math publishing (MathJax, PreTeXt). Some claims verified via official docs; table stakes confirmed by multiple platforms. Anti-features are LOW confidence (pattern extrapolation from feature-creep literature).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Browser-based book reader | Every modern platform delivers in-browser reading; PDF-only feels 2005 | MEDIUM | Must handle math rendering — MathJax or KaTeX required |
| LaTeX/MathJax formula rendering | Core product for STEM — broken math = broken product | MEDIUM | MathJax v3 is de facto standard; KaTeX faster but less complete |
| Book catalog with browse/filter | Users need to find books by subject, author, level | LOW | Filter by category/topic/difficulty; sort by date, title |
| Book detail page | Author, cover, synopsis, ISBN, TOC, pricing info — standard bookstore pattern | LOW | Must include structured data (schema.org/Book) for SEO |
| Table of contents navigation | STEM books are long; readers jump to chapters constantly | LOW | Sticky sidebar or drawer; chapter/section hierarchy |
| PDF download | Professionals and students expect offline-capable PDF — it's the contract format for academic content | LOW | Requires access control check before serving file |
| EPUB download | Standard for e-readers (Kindle-compatible); expected by professional audiences | MEDIUM | Math in EPUB requires images or MathML; more complex than PDF |
| Search within catalog | Users arrive knowing what they want; search is the primary discovery path | LOW | Full-text search on title, author, subject, keywords |
| Shopping cart / checkout | Single-book purchase is the expected model for professional STEM content | MEDIUM | Stripe for payments; webhook-driven access grant |
| Purchase receipt + access confirmation | Users need proof of purchase and a clear path back to their content | LOW | Email receipt + persistent "my library" view |
| User account / authentication | Required for purchase history, download access, and gating paid content | MEDIUM | Email/password minimum; OAuth (Google) is strong expectation |
| "My Library" / purchased books view | Users need to re-access what they bought; no account = no repeat reading | LOW | List of owned books with download and read links |
| Mobile-responsive reader | 40%+ of academic reading happens on tablets/phones; non-responsive = unusable | MEDIUM | Especially critical for math: equations must reflow or scroll |
| Secure file delivery | Publishers require that PDF/EPUB downloads are not public URLs | LOW | Signed, time-limited download URLs (S3 presigned or equivalent) |
| Open access book support | Growing expectation in academic publishing; funders often mandate it | LOW | Mark books as free; same reader UX, no checkout step |
| Book cover image | Visual identity; catalog without covers feels like a database, not a bookstore | LOW | High-resolution cover; consistent aspect ratio |
| Author bio and photo | Expected on every academic publisher page (Cambridge, Springer pattern) | LOW | Short bio, optional headshot, institution affiliation |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| LaTeX source ingestion pipeline | ScienceOne's input is LaTeX, Word, Markdown — most platforms require manual reformatting; automated pipeline reduces publisher labor dramatically | HIGH | Pandoc + MathJax preprocessing; LaTeX → HTML is the hard path; MathJax not 100% compatible with all LaTeX macros |
| Pay-per-chapter / pay-per-section | LiveCarta pioneered this for higher ed; lets readers buy only what they need — reduces price objection for students | HIGH | Requires granular content segmentation and purchase tracking |
| Reading customization (font, dark mode) | Perlego, VitalSource both offer this; for long-form technical reading, dark mode and font control significantly reduce eye strain | MEDIUM | Font size, line spacing, dark/light/sepia themes |
| In-browser highlights and bookmarks | Perlego's signature feature; academics markup heavily; highlights stored per-user, per-book | HIGH | Requires backend storage per user; sync across devices is table stakes once highlights exist |
| Citation export (BibTeX, APA, MLA) | STEM readers cite constantly; one-click BibTeX export from a book page saves real time | LOW | Cambridge Core does this; schema.org metadata powers it |
| Reading progress tracking | Motivates completion; lets readers resume exactly where they stopped | MEDIUM | Progress stored server-side; requires user account |
| Schema.org Book structured data + SEO | Google Search shows buy/read actions directly in results; dramatically improves organic discoverability for academic searchers | LOW | JSON-LD on every book page; ReadAction and BorrowAction markup |
| Admin ingestion dashboard | Founder manages the catalog; a clean upload workflow (LaTeX zip, Word doc, Markdown) with processing status visibility removes friction on the supply side | HIGH | File upload → processing queue → preview → publish |
| Preview / sample chapter | Reduces purchase hesitation; standard in STEM publishing (Springer, Cambridge both offer chapter previews) | MEDIUM | First chapter or X% of content accessible without purchase |
| Print edition metadata (ISBN, print info) | Professional STEM audiences cross-reference with print editions; showing print ISBN, edition, page count builds trust | LOW | Data field only; links to Amazon/publisher print listings optional |
| Discount codes / institutional pricing | Universities buying access for students is a real channel; coupon system unlocks bulk deals | MEDIUM | Stripe promo codes; access duration control |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Author self-service upload portal | "Let authors submit their own books" | ScienceOne explicitly has a curator model; self-service brings quality control problems, abuse, spam, and a support burden that kills focus for a <100-book catalog | Founder-managed ingestion dashboard; keep the supply chain curated |
| DRM / copy-protect PDF | "Prevent piracy" | Academic STEM audiences strongly resent DRM; professional researchers share files, annotate, archive; DRM drives users to piracy or competing platforms (VitalSource's DRM is the #1 user complaint). At <100 books, piracy risk is low | Use license-bound watermarking (name + email embedded in PDF) instead; much lower friction |
| Subscription / all-access model | "Recurring revenue is better" | For <20 books at launch, unlimited subscription doesn't have enough value to justify the price; mixed monetization (open access + paid) makes pricing strategy incoherent if you add subscription on top | Stick to pay-per-book and open access; revisit subscription only after catalog exceeds 50 books |
| Social features (reviews, ratings, follows) | "Make it community-driven" | Requires moderation infrastructure; STEM audience is small and professional; academic credibility comes from author reputation and publisher brand, not user ratings | Display author credentials and institutional affiliations prominently instead |
| Real-time collaborative annotation | "Let study groups share highlights" | Multiplayer annotation is technically complex (CRDTs, WebSockets, conflict resolution); for a <100-book platform this is a distraction | Ship single-user highlights first; revisit after product-market fit |
| LMS integration (Canvas, Moodle) | "Universities will buy if we integrate with their LMS" | LMS LTI 1.3 integration is a significant engineering effort; institutional sales cycles are 6-18 months; wrong priority for early stage | Focus on direct consumer sales; add LMS only when first institutional deal is closing |
| AI chatbot / ask-a-question | "Let readers ask questions about the book content" | RAG over STEM content with heavy math is not solved; hallucinations on physics/math problems are dangerous for educational material | Provide excellent table of contents, search, and citation tools instead |
| Offline reading mode | "Let readers read without internet" | Service worker + offline-cached books with math rendering is very complex; math rendering libraries (MathJax) don't cache cleanly; PDF download satisfies the actual user need | Ensure PDF download works well; that IS the offline solution |

---

## Feature Dependencies

```
User Account / Authentication
    └──requires──> My Library (purchased books list)
    └──requires──> Highlights & Bookmarks
    └──requires──> Reading Progress

Book Catalog (browse/search)
    └──requires──> Book Detail Page
                       └──requires──> Book Cover Image
                       └──requires──> Author Bio
                       └──requires──> Table of Contents (metadata)
                       └──requires──> Schema.org structured data

Checkout / Payment
    └──requires──> User Account
    └──requires──> Book Detail Page (pricing info)
    └──produces──> Access Grant (unlocks reader + downloads)

Browser Reader
    └──requires──> MathJax/KaTeX rendering
    └──requires──> Access Gate (purchased or open access)
    └──enhances──> Highlights & Bookmarks (needs account)
    └──enhances──> Reading Progress (needs account)
    └──enhances──> Table of Contents navigation

PDF / EPUB Download
    └──requires──> Access Grant
    └──requires──> Secure file delivery (signed URLs)

Admin Ingestion Pipeline
    └──requires──> Manuscript formats (LaTeX, Word, Markdown)
    └──produces──> Browser-renderable HTML + math
    └──produces──> PDF artifact
    └──produces──> EPUB artifact
    └──produces──> Book metadata record in catalog

Pay-per-chapter
    └──requires──> Browser Reader (chapter-level content segmentation)
    └──requires──> Checkout / Payment (chapter-level products)
    └──conflicts──> Pay-per-book (mixed model adds UX complexity)

Preview / Sample Chapter
    └──requires──> Browser Reader
    └──requires──> Access Gate (partial — first chapter free)
    └──enhances──> Book Detail Page (embed preview inline)
```

### Dependency Notes

- **User Account requires My Library**: Once a user buys a book, they need a persistent place to find it. My Library is not optional once purchases exist.
- **Checkout produces Access Grant**: The access grant (linking a user to a purchased book) is the critical join between payment and content delivery. Must be webhook-driven (Stripe webhooks) to be reliable.
- **Admin Ingestion Pipeline produces everything**: The pipeline that takes manuscript input and produces HTML reader content, PDF, EPUB, and metadata is the highest-risk dependency. All reader features depend on it working correctly.
- **Pay-per-chapter conflicts with pay-per-book**: Offering both simultaneously for the same book creates confusing pricing. Decide per-book which model applies.
- **MathJax/KaTeX is a hard dependency for the reader**: The browser reader is broken without math rendering. This is not a later enhancement; it ships with the reader.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to publish books and earn revenue.

- [ ] **Book catalog with browse and search** — without discovery, there are no sales
- [ ] **Book detail page** (cover, synopsis, author bio, TOC, ISBN, pricing) — the conversion page
- [ ] **User account and authentication** — required for purchase and download access
- [ ] **Checkout / payment (pay-per-book)** — the revenue mechanism
- [ ] **My Library (purchased books)** — users must be able to re-access what they bought
- [ ] **Browser-based reader with MathJax math rendering** — the core value delivery for STEM
- [ ] **PDF download (secured)** — professionals expect it; PDF is the "real" copy for archiving
- [ ] **Open access book support** — some books will be free; the platform must handle both models
- [ ] **Admin ingestion dashboard** — founder must be able to publish books without engineering help
- [ ] **Schema.org Book structured data** — organic SEO discoverability from day one

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **EPUB download** — add when PDF download is stable and user requests confirm need
- [ ] **Sample chapter / preview** — add when conversion data shows hesitation at checkout
- [ ] **Reading progress tracking** — add when engagement data shows readers returning
- [ ] **Dark mode / reading customization** — add when reading sessions exceed 10 minutes average (signals deep engagement worth optimizing)
- [ ] **Citation export (BibTeX, APA)** — add when professional/academic users self-identify
- [ ] **Pay-per-chapter** — evaluate after catalog has multi-chapter books and chapter-level demand signals appear

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **In-browser highlights and bookmarks** — high complexity, high value; needs enough repeat readers to justify backend storage infrastructure
- [ ] **Discount codes / institutional pricing** — add when first university contact approaches
- [ ] **Print edition metadata linking** — cosmetic at v1; add when catalog is mature
- [ ] **AI search / recommendation** — defer until catalog is large enough for recommendations to be meaningful (50+ books minimum)
- [ ] **LMS integration (LTI 1.3)** — only when first institutional deal is imminent

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Browser reader + MathJax | HIGH | MEDIUM | P1 |
| Book catalog + search | HIGH | LOW | P1 |
| Book detail page | HIGH | LOW | P1 |
| User accounts | HIGH | MEDIUM | P1 |
| Checkout / pay-per-book | HIGH | MEDIUM | P1 |
| My Library | HIGH | LOW | P1 |
| PDF download (secured) | HIGH | LOW | P1 |
| Admin ingestion pipeline | HIGH (internal) | HIGH | P1 |
| Open access support | MEDIUM | LOW | P1 |
| Schema.org SEO markup | MEDIUM | LOW | P1 |
| EPUB download | MEDIUM | MEDIUM | P2 |
| Sample chapter preview | HIGH | MEDIUM | P2 |
| Reading progress | MEDIUM | MEDIUM | P2 |
| Dark mode / reader settings | MEDIUM | MEDIUM | P2 |
| Citation export | MEDIUM | LOW | P2 |
| Pay-per-chapter | MEDIUM | HIGH | P2 |
| Highlights / bookmarks | HIGH | HIGH | P3 |
| Discount codes | MEDIUM | MEDIUM | P3 |
| LMS integration | HIGH (institutional) | HIGH | P3 |
| AI recommendations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Cambridge Core | Perlego | VitalSource | ScienceOne Approach |
|---------|---------------|---------|-------------|---------------------|
| Math rendering | MathJax/MathML | Limited (most books are not math-heavy) | MathJax on web viewer | MathJax v3 — non-negotiable for STEM |
| Browser reader | Yes (chapter-level HTML) | Yes (reflowable EPUB) | Yes (web viewer) | Yes — HTML-first for math fidelity |
| PDF download | Yes (paid/institutional) | No (subscription blocks DL) | Yes (limited pages) | Yes — unrestricted for purchased books |
| EPUB download | Yes | No | Yes | Yes (v1.x) |
| Dark mode | Partial | Yes | Yes | v1.x — after core reader ships |
| Highlights/notes | Yes | Yes (full feature) | Yes | v2+ — high complexity |
| Citation export | Yes (20+ formats) | Yes | No | v1.x — low effort, high value for academics |
| Search in book | Yes | Yes ("Find in Book") | Yes | v1 reader (browser native find sufficient initially) |
| Pay-per-book | Yes (per chapter/book) | No (subscription only) | Yes | Yes — primary revenue model |
| Pay-per-chapter | Yes | No | No | v1.x — evaluate after launch |
| Open access | Yes | No | No | Yes — first-class model alongside paid |
| Admin catalog mgmt | Enterprise (not custom) | Publisher portal | Publisher portal | Custom admin dashboard (curator model) |
| LaTeX ingestion | Not automated | Not automated | Not automated | Core differentiator — automated pipeline |
| Sample chapter | Yes | Yes (preview pages) | Yes | v1.x |

---

## Sources

- [Cambridge Core platform](https://www.cambridge.org/core/) — browser reader, citation tools, navigation patterns (MEDIUM confidence, observed features)
- [Perlego ebook features and tools](https://help.perlego.com/en/articles/4450175-ebook-features-and-tools) — comprehensive reader feature list (HIGH confidence, official help doc)
- [VitalSource eTextBook formats](https://support.vitalsource.com/hc/en-us/articles/115003965568-What-eTextBook-format-do-you-provide) — PDF vs EPUB, DRM approach (HIGH confidence, official support doc)
- [LiveCarta Pay-by-Chapter](https://livecarta.com/digital-experience-platform-higher-education/) — pay-per-chapter model in academic publishing (MEDIUM confidence, platform marketing)
- [MathJax official site](https://www.mathjax.org/) — math rendering for browser (HIGH confidence, official)
- [Accessible Open Textbooks in Math-Heavy Disciplines, Richard Zach, March 2025](https://richardzach.org/2025/03/accessible-open-textbooks-in-math-heavy-disciplines/) — MathJax, PreTeXt, accessibility requirements (HIGH confidence, current specialist analysis)
- [Google Book Schema structured data](https://developers.google.com/search/docs/appearance/structured-data/book) — SEO/discoverability requirements (HIGH confidence, official Google docs)
- [Pandoc LaTeX-to-HTML workflows](https://pandoc.org/MANUAL.html) — manuscript conversion pipeline (HIGH confidence, official)
- [VitalSource DRM complaints](https://support.vitalsource.com/) — DRM as anti-feature confirmed by heavy user complaints (MEDIUM confidence, support forum pattern)
- [KITABOO digital publishing platform](https://kitaboo.com/) — industry monetization patterns (LOW confidence, vendor marketing)

---
*Feature research for: Online STEM book publishing platform (ScienceOne)*
*Researched: 2026-02-18*
