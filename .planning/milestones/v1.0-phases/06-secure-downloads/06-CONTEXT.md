# Phase 6: Secure Downloads - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver purchased book files (PDF and EPUB) via time-limited presigned R2 URLs. Block unauthorized download attempts. Display print purchase links on book detail pages when configured. No new file formats, no watermarking, no DRM.

</domain>

<decisions>
## Implementation Decisions

### Download placement
- Download buttons appear in three locations: book detail page, My Library cards, and inside the reader header
- Open-access books require login before downloading (no anonymous downloads)

### Download experience
- Claude's discretion on PDF/EPUB button grouping (single dropdown vs separate buttons) — pick best approach per placement context
- Claude's discretion on click behavior (direct download vs new tab)
- Claude's discretion on toast/feedback after download click
- Claude's discretion on downloaded filename format (human-readable slug vs original)
- Claude's discretion on rate limiting approach

### Access denial UX
- Claude's discretion on logged-in-but-unpurchased behavior (redirect to checkout vs inline message)
- Claude's discretion on unauthenticated direct URL access handling
- Claude's discretion on missing artifact visibility (hide button vs show disabled)
- Claude's discretion on expired presigned URL error handling

### Print purchase link
- Print link appears in the book metadata section (near ISBN, page count, dimensions) — not grouped with main buy/read actions
- No price shown on print link — just the link text, price is on the external site
- Print link only appears when a printPurchaseUrl is configured — hidden completely otherwise
- Claude's discretion on styling (text link with icon vs secondary button)

### Claude's Discretion
- Button grouping strategy per placement (dropdown vs separate)
- Download click behavior and user feedback
- Filename format for downloads
- Rate limiting / abuse prevention
- Access denial patterns (redirect vs inline message vs 403)
- Missing artifact handling
- Expired URL error presentation
- Print link visual styling
- Download button visibility for unpurchased users (visible-but-locked vs hidden)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user gave Claude wide discretion on UX details, focusing decisions on placement and print link behavior.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-secure-downloads*
*Context gathered: 2026-02-19*
