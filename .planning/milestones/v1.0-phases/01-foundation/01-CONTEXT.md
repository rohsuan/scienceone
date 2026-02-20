# Phase 1: Foundation - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Next.js 15 project scaffold, PostgreSQL database schema, and user authentication. Delivers a stable base — project structure, design system, auth flow, and full schema — so every subsequent phase builds on solid ground. Catalog, reader, payments, and all other features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Auth experience
- Sign-up fields: Claude's discretion (likely email + password + name)
- Google sign-in supported alongside email+password as a convenience option
- Email verification required before account is usable — user must click verification link
- Error messages use a friendly, helpful tone — e.g., "That password doesn't look right. Try again or reset it."

### Visual identity
- Clean academic aesthetic — elegant, restrained, scholarly feel (think Nature, arXiv modernized)
- Serif headings, generous whitespace, deep blue + white color palette (navy/indigo primary, clean white backgrounds)
- Tailwind CSS + shadcn/ui component library for accessible, consistent, customizable components
- Light mode only for Phase 1 — dark mode deferred to a future enhancement

### Post-auth landing
- Logged-in users see a welcome dashboard shell with user's name, empty sections for "My Library" and "Recently Read" that fill in as later phases ship
- Non-logged-in users see a simple branded landing page with tagline, value proposition, and sign-up/login buttons
- Full header from day one: logo, nav links (placeholder for catalog, etc.), and auth controls (login/avatar) — consistent across all pages
- Branded footer: logo, copyright, links section (About, Contact, Terms, Privacy)

### Database schema scope
- Full schema defined upfront — users, books, chapters, purchases, downloads, etc. — so later phases use existing tables rather than constant migrations
- Seed script with sample books, chapters, and test users so every phase has data to work with immediately
- Users table includes a role field (user/admin) to distinguish the founder from regular users
- Book pricing stored in a separate pricing table linked to books, supporting future flexibility (regional pricing, time-limited offers)

### Claude's Discretion
- Exact sign-up form fields (email + password minimum, name likely included)
- Password strength requirements
- Verification email design and copy
- Loading states and transition animations
- Exact spacing, typography scale, and component styling within the academic aesthetic
- Dashboard shell layout and empty state illustrations
- Specific schema field types, indexes, and constraints
- Seed data content (sample book titles, chapter content)

</decisions>

<specifics>
## Specific Ideas

- Academic aesthetic reference: Nature journal, modernized arXiv — scholarly but contemporary
- Error tone reference: warm and guiding, not clinical ("That password doesn't look right" not "Invalid credentials")
- Header should have nav link placeholders ready for catalog, reader, etc. as they ship
- Dashboard shell should feel like a real product from day one, not a prototype

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-18*
