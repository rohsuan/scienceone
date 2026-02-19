# Phase 4: Browser Reader - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Readers can open any book they have access to and read chapters in the browser with correctly rendered mathematical formulas, a table of contents sidebar for navigation, and a layout that works on mobile and desktop — with their reading position saved between sessions. This phase does NOT include dark mode, font customization, highlighting, bookmarking, or in-book search (those are v2 enhancements).

</domain>

<decisions>
## Implementation Decisions

### Reader layout
- Claude's discretion on layout structure (sidebar + content vs full-width with drawer) and content width — optimize for STEM books with math equations
- Claude's discretion on whether to use a dedicated reader layout (minimal chrome) or keep the site header — balance immersion with navigation
- Reference: GitBook / Docusaurus feel — technical docs style, sidebar nav, clean typography, code/math-friendly

### ToC & navigation
- Claude's discretion on sidebar behavior (always visible vs collapsible) and prev/next chapter controls
- Claude's discretion on ToC state indicators (current chapter highlight, read chapter markers)
- Each chapter has its own URL (e.g., /read/book-slug/chapter-3) — bookmarkable, shareable, browser back button works

### Mobile adaptation
- Fully Claude's discretion on all mobile patterns — ToC access method, math overflow handling, top bar behavior
- Must work at 375px (mobile) and 768px (tablet) per success criteria

### Progress & resume
- Reading progress requires authentication — only logged-in users get progress saved and restored
- Anonymous users reading open-access books do NOT get progress persistence
- Claude's discretion on storage mechanism (DB, localStorage, hybrid), resume UX (silent vs notification), and visual progress indicators

### Claude's Discretion
- Layout structure and content width for academic reading with math
- Dedicated reader chrome vs site header
- ToC sidebar behavior (always visible vs collapsible)
- Prev/next chapter navigation controls
- ToC state indicators (read markers)
- All mobile patterns (ToC access, math overflow, sticky/auto-hide bar)
- Progress storage mechanism and resume UX
- Visual progress indicators

</decisions>

<specifics>
## Specific Ideas

- GitBook / Docusaurus as the reference feel — clean technical docs style with sidebar navigation
- Chapter URLs must be individually addressable for bookmarking and sharing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-reader*
*Context gathered: 2026-02-19*
