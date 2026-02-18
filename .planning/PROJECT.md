# ScienceOne

## What This Is

ScienceOne is an online publishing platform for STEM books — particularly mathematics and physics — with first-class LaTeX formula rendering. The founder manages a curated multi-author catalog where readers can browse, read chapters in-browser, and download books. Three monetization models (pay-per-view, pay-per-book, open access) give flexibility to adapt to market demand.

## Core Value

Readers can discover and read STEM books with properly rendered mathematical formulas, directly in their browser — no clunky PDFs, no broken equations.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Publisher can upload and manage books with rich metadata
- [ ] Readers can browse the book catalog with categories and search
- [ ] Readers can read book chapters in-browser with LaTeX math rendering
- [ ] Readers can download books (PDF/EPUB)
- [ ] Three monetization models: pay-per-view, pay-per-book, open access
- [ ] Each book has cover image, ISBN, author bio/photo, synopsis, table of contents, categories/tags, print metadata (page count, dimensions), and print purchase link
- [ ] Multiple input formats supported for manuscript upload

### Out of Scope

- Author self-service portal — founder uploads and manages all content
- Mobile native app — web-first
- Real-time collaboration/editing — this is publishing, not authoring
- Subscription model — not in v1, may explore later

## Context

- New publishing venture — no existing digital platform or legacy systems
- Catalog starts under 20 books, planned to scale to 20-100 within a year
- Content is math/physics-heavy — LaTeX rendering is non-negotiable, not a nice-to-have
- Audience is mixed: university students, working professionals, and curious general public
- Authors submit manuscripts in various formats (LaTeX, Word, Markdown, etc.) — founder handles conversion and upload
- Each book may have a print counterpart with its own ISBN and purchase link
- Payment model flexibility is important — the founder wants to experiment with what works in the market

## Constraints

- **Tech stack**: Mainstream, well-supported technologies — keep it simple
- **Scale**: Must handle growth from ~20 to ~100 books without rearchitecting
- **Math rendering**: Must render complex LaTeX formulas accurately in browser (equations, proofs, derivations)
- **Content protection**: Paid content needs basic access control (not DRM-level, but gated)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Founder manages all uploads (no author portal) | Small catalog, founder controls quality | — Pending |
| Three payment models from v1 | Market experimentation is a priority | — Pending |
| Web-first, no native apps | Reduce complexity, reach all devices via browser | — Pending |
| Support multiple manuscript input formats | Authors use different tools | — Pending |

---
*Last updated: 2026-02-18 after initialization*
