# Milestones

## v1.0 ScienceOne MVP (Shipped: 2026-02-20)

**Phases completed:** 9 phases, 19 plans, 102 commits
**Lines of code:** 32,689 TypeScript
**Timeline:** 3 days (2026-02-18 → 2026-02-20)
**Requirements:** 27/27 satisfied
**Audit:** tech_debt (no blockers)

**Key accomplishments:**
1. Full STEM book publishing platform with server-side KaTeX math rendering — no client-side JavaScript needed for equations
2. Manuscript ingest pipeline converting LaTeX, Word, and Markdown to browser-ready HTML, PDF, and EPUB via Pandoc
3. Public catalog with category filtering, live search, sample chapter preview, and Schema.org SEO structured data
4. In-browser chapter reader with ToC sidebar, mobile responsive drawer, and reading progress persistence
5. Stripe payment integration with webhook-driven access grants, idempotent purchase upserts, and receipt emails
6. Secure file downloads via time-limited R2 presigned URLs with entitlement verification
7. Browser-based admin dashboard — manuscript upload, metadata editing, content preview, publish/unpublish
8. Academic citation export in BibTeX and APA formats

**Tech debt carried forward:**
- In-memory rate limiter (upgrade to Redis at scale)
- Purchase success page shows author byline instead of book title (cosmetic)
- No direct "Preview" link from admin edit page

**Archives:**
- milestones/v1.0-ROADMAP.md
- milestones/v1.0-REQUIREMENTS.md
- milestones/v1.0-MILESTONE-AUDIT.md

---

