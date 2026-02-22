# Roadmap: ScienceOne

## Milestones

- ✅ **v1.0 MVP** — Phases 1-9 (shipped 2026-02-20)
- 🚧 **v1.1 Content Hub** — Phases 10-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-9) — SHIPPED 2026-02-20</summary>

- [x] Phase 1: Foundation (4/4 plans) — completed 2026-02-18
- [x] Phase 2: Ingest Pipeline (2/2 plans) — completed 2026-02-19
- [x] Phase 3: Catalog and Discovery (2/2 plans) — completed 2026-02-19
- [x] Phase 4: Browser Reader (2/2 plans) — completed 2026-02-19
- [x] Phase 5: Payments and Entitlement (2/2 plans) — completed 2026-02-19
- [x] Phase 6: Secure Downloads (2/2 plans) — completed 2026-02-19
- [x] Phase 7: Admin Dashboard (3/3 plans) — completed 2026-02-19
- [x] Phase 8: Reader Enhancements (1/1 plan) — completed 2026-02-20
- [x] Phase 9: Audit Gap Closure (1/1 plan) — completed 2026-02-20

</details>

### 🚧 v1.1 Content Hub (In Progress)

**Milestone Goal:** Polish and ship blog, resource library, and interactive simulations to production quality — verifying, bug-fixing, and wiring existing first-pass code.

- [x] **Phase 10: Infrastructure** - Verify DB migration, subject system, and shared XSS sanitization utility (completed 2026-02-22)
- [x] **Phase 11: Resource Admin** - Admin CRUD for resources with file upload, simulation tab, and subject tagging (completed 2026-02-22)
- [x] **Phase 12: Resource Public and Purchase** - Resource listing, free downloads, and end-to-end Stripe purchase flow (completed 2026-02-22)
- [ ] **Phase 13: Simulations** - Simulation gallery and detail pages with SSR-safe dynamic loading and responsive canvas
- [ ] **Phase 14: Blog** - Blog admin CRUD and public listing with SEO, sitemap, and sanitized content rendering
- [ ] **Phase 15: Polish and Cross-linking** - Pagination on all listings and subject-based cross-links between content types

## Phase Details

### Phase 10: Infrastructure
**Goal**: The database schema for all v1.1 content types is migrated and verified; the shared Subject taxonomy is seeded and working; a sanitizeHtml utility wraps all dangerouslySetInnerHTML call sites so no unsanitized content can reach the browser
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: None directly — prerequisite phase unblocking Phases 11-14
**Success Criteria** (what must be TRUE):
  1. Running `prisma migrate deploy` (or `prisma db push`) succeeds with no errors and all new tables (Resource, BlogPost, Simulation, Subject, ResourcePurchase) appear in the database
  2. The SubjectSelect component renders a dropdown of seeded subjects (Physics, Mathematics, Chemistry, Computer Science) in an admin form without errors
  3. A shared `sanitizeHtml()` utility exists and is applied at all four dangerouslySetInnerHTML sites (blog content, resource content, simulation teacherGuide, simulation parameterDocs) — no raw HTML from the database reaches the DOM unsanitized
**Plans**: 1 plan

Plans:
- [ ] 10-01-PLAN.md — Verify migration, seed subjects, and wire sanitizeHtml utility

### Phase 11: Resource Admin
**Goal**: Admin can fully manage resources — create, edit, publish, delete, upload files and cover images to R2, assign subjects, and configure simulations — using a verified admin form with no silent failures
**Depends on**: Phase 10
**Requirements**: RES-01, RES-02
**Success Criteria** (what must be TRUE):
  1. Admin can create a new resource (fill title, description, type, level, subject tags, price) and see it appear in the admin resource table
  2. Admin can upload a resource file (PDF) and a cover image; both upload to R2 and their URLs are stored on the record
  3. Admin can set resource type to SIMULATION, choose a componentKey from the dropdown, and save — the Simulation record is created or updated
  4. Admin can toggle publish/unpublish on a resource and see the status change reflected immediately in the table
  5. Admin can delete a resource and it is removed from the admin table
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Fix ImageUploadField for resource covers, store full R2 public URL, remove SubjectSelect create UI
- [ ] 11-02-PLAN.md — Extract ResourceRowActions with useTransition + toast for publish/delete feedback

### Phase 12: Resource Public and Purchase
**Goal**: Visitors can browse and search published resources with filtering, download free resources instantly, and purchase paid resources through Stripe with correct webhook-driven access gating
**Depends on**: Phase 11
**Requirements**: RES-03, RES-04, RES-05, RES-06, RES-07, RES-08, RES-09
**Success Criteria** (what must be TRUE):
  1. Visitor can browse published resources and filter by subject, type, and level — unpublished resources never appear
  2. Visitor can search resources by keyword and results update correctly
  3. Visitor can click "Download" on a free resource and receive the file via a presigned R2 URL without being prompted to purchase
  4. Visitor sees the price and a "Purchase" button on paid resources; clicking it redirects to Stripe Checkout
  5. After Stripe payment succeeds, the webhook creates a ResourcePurchase record and the resource becomes downloadable for the purchasing user
  6. The Stripe webhook routes by explicit `productType` metadata ("book" vs "resource"), eliminating the dead-code implicit routing bug
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md — Fix download button, isActive pricing filter, and verify listing/search/filter/download
- [ ] 12-02-PLAN.md — Add productType metadata to checkouts, fix webhook routing, verify purchase flow

### Phase 13: Simulations
**Goal**: The simulation gallery and detail pages load without server-side errors, all three simulations render correctly in the browser with working interactive controls, and the canvas layout is responsive across desktop, tablet, and mobile
**Depends on**: Phase 11
**Requirements**: SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06
**Success Criteria** (what must be TRUE):
  1. The simulation gallery page loads with subject filtering and displays all published simulations — no server-side errors
  2. Clicking a simulation navigates to its detail page and the canvas renders without hydration errors or console errors
  3. All three simulations (projectile motion, wave interference, spring-mass) are interactive: Play/Reset controls respond and sliders change simulation parameters
  4. The simulation canvas is not hardcoded to 600px — it scales correctly on a phone-sized viewport (375px) and an iPad-sized viewport (768px)
  5. Teacher guide and parameter documentation text appears on each simulation detail page
**Plans**: 2 plans

Plans:
- [ ] 13-01-PLAN.md — Split registry to fix SSR errors, make canvases responsive via ResizeObserver, seed simulation DB records
- [ ] 13-02-PLAN.md — Verify all three simulations end-to-end with Rodney browser automation

### Phase 14: Blog
**Goal**: Admin can create and publish blog posts, visitors can browse and read them with correct SEO metadata, all content is sanitized before rendering, and the sitemap includes blog posts
**Depends on**: Phase 10
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07
**Success Criteria** (what must be TRUE):
  1. Admin can create, edit, and delete blog posts; the post appears in the admin table after creation
  2. Admin can toggle a post between draft and published — published posts appear on /blog, draft posts do not
  3. Visitor can browse /blog and filter posts by category and subject; search by keyword returns matching posts
  4. A published blog post page includes a JSON-LD Article schema block and Open Graph meta tags with correct title, description, and image
  5. The sitemap at /sitemap.xml includes URLs for all published blog posts (and published resources and simulations)
  6. Blog post HTML content is passed through sanitizeHtml() before being rendered — raw database HTML never reaches the DOM
**Plans**: TBD

Plans:
- [ ] 14-01: Verify blog admin CRUD, publish workflow, and slug revalidation fix
- [ ] 14-02: Verify blog public listing, search, filters, SEO metadata, and sitemap

### Phase 15: Polish and Cross-linking
**Goal**: All content listing pages have pagination so the database is never queried without a LIMIT, and visitors browsing any content type see subject-based links to related content in the other content areas
**Depends on**: Phases 12, 13, 14
**Requirements**: RES-10, XLINK-01, XLINK-02, XLINK-03
**Success Criteria** (what must be TRUE):
  1. The resource listing page shows a maximum of 12 resources per page with a working "Load more" or page navigation control
  2. The blog listing page shows a maximum of 12 posts per page with working pagination
  3. A blog post detail page shows a "Related Resources" section listing resources that share at least one subject tag with the post
  4. A resource detail page shows a "Related Articles" section listing blog posts that share at least one subject tag with the resource
  5. A simulation detail page shows links to related lab guide resources that share the simulation's subject
**Plans**: TBD

Plans:
- [ ] 15-01: Add pagination to resource and blog listing queries and UI
- [ ] 15-02: Add subject-based cross-link sections to blog post, resource, and simulation detail pages

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-02-18 |
| 2. Ingest Pipeline | v1.0 | 2/2 | Complete | 2026-02-19 |
| 3. Catalog and Discovery | v1.0 | 2/2 | Complete | 2026-02-19 |
| 4. Browser Reader | v1.0 | 2/2 | Complete | 2026-02-19 |
| 5. Payments and Entitlement | v1.0 | 2/2 | Complete | 2026-02-19 |
| 6. Secure Downloads | v1.0 | 2/2 | Complete | 2026-02-19 |
| 7. Admin Dashboard | v1.0 | 3/3 | Complete | 2026-02-19 |
| 8. Reader Enhancements | v1.0 | 1/1 | Complete | 2026-02-20 |
| 9. Audit Gap Closure | v1.0 | 1/1 | Complete | 2026-02-20 |
| 10. Infrastructure | 1/1 | Complete    | 2026-02-22 | - |
| 11. Resource Admin | 2/2 | Complete    | 2026-02-22 | - |
| 12. Resource Public and Purchase | 2/2 | Complete    | 2026-02-22 | - |
| 13. Simulations | v1.1 | 0/2 | Not started | - |
| 14. Blog | v1.1 | 0/2 | Not started | - |
| 15. Polish and Cross-linking | v1.1 | 0/2 | Not started | - |
