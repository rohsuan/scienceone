# Phase 3: Catalog and Discovery - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Readers can browse, filter, search, and preview ScienceOne's book catalog in a browser, with open-access books immediately readable and all detail pages structured for search engine discovery. This phase delivers the public catalog page, book detail pages, search, sample chapter access, and Schema.org SEO structured data.

</domain>

<decisions>
## Implementation Decisions

### Catalog Browsing
- Layout style, card content, category filtering pattern, and page header: Claude's discretion — pick the best approach for a small academic STEM catalog (<20 books)

### Book Detail Page
- Layout: Cover left, info right — classic two-column structure (like Amazon book pages)
- Pricing/access display: Subtle — price shown but not dominant; focus on the book content, purchase is secondary
- Author section: Minimal — name and one-liner affiliation, not a full bio with photo
- Table of contents display: Claude's discretion

### Search Experience
- Search behavior (instant vs submit), placement (header vs catalog-only), result display, and empty state handling: Claude's discretion — optimize for a small catalog

### Sample Chapter Access
- Presentation (inline vs separate view), access gating, end-of-sample upsell, and sample scope (chapter 1 vs configurable): Claude's discretion — note the success criteria states "without an account or purchase" and Phase 4 (browser reader) follows immediately

### Claude's Discretion
- Catalog browsing: layout style, card content, filtering pattern, page header
- Book detail page: TOC display approach
- Search: behavior type, placement, result display, empty states
- Sample chapter: presentation mode, upsell approach, sample scope
- All empty states and loading states
- SEO structured data implementation details

</decisions>

<specifics>
## Specific Ideas

- Book detail page should use cover-left/info-right layout — the user explicitly wants the classic bookstore pattern
- Pricing should be understated — this is an academic publisher, not an impulse-buy storefront
- Author info should be minimal (name + affiliation) — the book content and its math are what matter, not author bios

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-catalog*
*Context gathered: 2026-02-19*
