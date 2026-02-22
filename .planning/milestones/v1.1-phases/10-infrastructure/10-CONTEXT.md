# Phase 10: Infrastructure - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the v1.1 database migration (all new tables exist and are correct), seed the Subject taxonomy, and create a shared sanitizeHtml utility applied at all four dangerouslySetInnerHTML call sites. This phase unblocks Phases 11-14 but delivers no user-facing features itself.

</domain>

<decisions>
## Implementation Decisions

### Subject taxonomy
- Seed four subjects: Physics, Mathematics, Chemistry, Computer Science
- Flat list (no hierarchy) — subjects are tags, not a tree
- Subjects are admin-managed via the existing SubjectSelect component

### Content sanitization policy
- Allow safe formatting tags: headings, paragraphs, bold, italic, links, images, lists, code blocks, blockquotes, tables
- Strip all script tags, event handlers, iframes, and other XSS vectors
- Apply the same sanitization rules consistently across all four call sites (blog content, resource content, simulation teacherGuide, simulation parameterDocs)

### Seed data
- Seed subjects only — no sample blog posts, resources, or simulations
- Phase 11+ will create real content through admin workflows

### Claude's Discretion
- All implementation details: sanitizer library configuration, migration verification approach, seed script structure
- How to structure the shared sanitizeHtml utility (location, API surface)
- Error handling for missing subjects or failed sanitization
- Whether to use `prisma migrate deploy` or `prisma db push` for verification

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-infrastructure*
*Context gathered: 2026-02-22*
