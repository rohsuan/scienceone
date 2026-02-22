# Requirements: ScienceOne

**Defined:** 2026-02-22
**Core Value:** Educators and students can discover STEM content — books, resources, simulations, and articles — with properly rendered math, directly in their browser

## v1.1 Requirements

Requirements for v1.1 Content Hub. Each maps to roadmap phases.

### Blog

- [ ] **BLOG-01**: Admin can create, edit, and delete blog posts
- [ ] **BLOG-02**: Admin can publish/unpublish blog posts with draft workflow
- [ ] **BLOG-03**: Visitor can browse published blog posts with category and subject filtering
- [ ] **BLOG-04**: Visitor can search blog posts by keyword
- [ ] **BLOG-05**: Blog post pages render with SEO metadata (JSON-LD, Open Graph)
- [ ] **BLOG-06**: Blog post content is sanitized against XSS before rendering
- [ ] **BLOG-07**: Blog posts are included in the sitemap

### Resources

- [ ] **RES-01**: Admin can create, edit, and delete resources with type, level, and subject metadata
- [ ] **RES-02**: Admin can upload resource files and cover images to R2
- [ ] **RES-03**: Visitor can browse published resources with filtering by subject, type, and level
- [ ] **RES-04**: Visitor can search resources by keyword
- [ ] **RES-05**: Visitor can download free resources without purchase
- [ ] **RES-06**: Paid resources display price and a purchase button
- [ ] **RES-07**: Paid resource checkout via Stripe works end-to-end
- [ ] **RES-08**: Stripe webhook creates ResourcePurchase records correctly
- [ ] **RES-09**: Purchased resources can be downloaded via presigned R2 URL
- [ ] **RES-10**: Resource and blog listings have pagination

### Simulations

- [ ] **SIM-01**: Simulation gallery page with subject filtering
- [ ] **SIM-02**: Simulation detail pages embed interactive canvas simulations
- [ ] **SIM-03**: Simulations load via next/dynamic (SSR-safe, no React.lazy)
- [ ] **SIM-04**: Simulation canvas is responsive across desktop, tablet, and mobile
- [ ] **SIM-05**: Teacher guide and parameter docs display on simulation pages
- [ ] **SIM-06**: Three simulations work correctly (projectile motion, wave interference, spring-mass)

### Cross-Linking

- [ ] **XLINK-01**: Blog posts show related resources based on shared subjects
- [ ] **XLINK-02**: Resource pages show related blog posts based on shared subjects
- [ ] **XLINK-03**: Simulation pages link to related resources

## Future Requirements

### Blog Enhancements

- **BLOG-08**: Blog posts display estimated reading time
- **BLOG-09**: Blog post pages show previous/next post navigation
- **BLOG-10**: Blog has an RSS feed

### Resource Enhancements

- **RES-11**: Resource detail pages show file format and size labels
- **RES-12**: Resource purchase triggers a confirmation email

### Design Overhaul

- **DESIGN-01**: Dark theme with "Where Physics Meets Code" branding
- **DESIGN-02**: Homepage redesign with particle hero animation and live simulation embed
- **DESIGN-03**: Stats bar with animated counters (social proof)

### Content Expansion

- **CONTENT-01**: Courses section with landing pages
- **CONTENT-02**: Newsletter signup with email platform integration (ConvertKit/Beehiiv)
- **CONTENT-03**: About page with mission and founder story
- **CONTENT-04**: Additional simulations (electric field, orbital mechanics, Fourier analysis)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rich text editor for blog (TipTap) | Raw HTML textarea sufficient for founder-managed content |
| Real-time simulation collaboration | Complexity outweighs value for solo-authored sims |
| Comments/discussion on blog posts | Deferred; no moderation infrastructure yet |
| LMS integration (LTI 1.3) | Future — university partnerships not started |
| Subscription model | Insufficient content catalog; revisit at 50+ resources |
| Additional simulations beyond 3 | Ship existing 3 first; add more in future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BLOG-01 | — | Pending |
| BLOG-02 | — | Pending |
| BLOG-03 | — | Pending |
| BLOG-04 | — | Pending |
| BLOG-05 | — | Pending |
| BLOG-06 | — | Pending |
| BLOG-07 | — | Pending |
| RES-01 | — | Pending |
| RES-02 | — | Pending |
| RES-03 | — | Pending |
| RES-04 | — | Pending |
| RES-05 | — | Pending |
| RES-06 | — | Pending |
| RES-07 | — | Pending |
| RES-08 | — | Pending |
| RES-09 | — | Pending |
| RES-10 | — | Pending |
| SIM-01 | — | Pending |
| SIM-02 | — | Pending |
| SIM-03 | — | Pending |
| SIM-04 | — | Pending |
| SIM-05 | — | Pending |
| SIM-06 | — | Pending |
| XLINK-01 | — | Pending |
| XLINK-02 | — | Pending |
| XLINK-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 (awaiting roadmap)

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after initial definition*
