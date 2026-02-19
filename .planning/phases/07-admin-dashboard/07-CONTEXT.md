# Phase 7: Admin Dashboard - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Browser-based book management UI for the founder. Upload manuscripts and trigger ingest, edit all book metadata, set access models, preview ingested content, publish/unpublish books. No CLI required. Single founder user — not multi-tenant.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Data table for the book list — rows with columns: title, status, access model, available formats (PDF/EPUB), date, actions
- Dense, scannable, sortable — designed for managing ~20 books

### Upload & ingest UX
- Re-ingest supported with a confirmation dialog — founder can re-upload a corrected manuscript to replace existing chapters and artifacts
- Upload pattern, progress display, and error presentation are Claude's discretion

### Metadata editing
- Manual save button — edit fields freely, click Save when ready
- Synopsis and author bio fields use plain text / Markdown — rendered as markdown on the public site
- Cover image handling and form field organization are Claude's discretion

### Publish workflow
- Draft → Published workflow — books start as draft after ingest, must be explicitly published
- Unpublishing keeps purchaser access — book disappears from catalog and search, but purchasers can still read and download
- No publish validation gate — founder can publish whenever they want, even with incomplete fields (trust the curator)

### Claude's Discretion
- Admin page navigation structure (single page vs separate pages, route layout)
- Admin layout (reuse site layout vs dedicated admin layout)
- Upload pattern (drag-and-drop vs file picker)
- Ingest progress display (step-by-step vs simple spinner)
- Error presentation (inline health report vs summary + downloadable log)
- Cover image upload flow (live preview vs upload-on-save)
- Form field organization (tabbed sections vs single scrollable form)
- Preview experience (reuse existing reader vs inline panel)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-admin-dashboard*
*Context gathered: 2026-02-19*
