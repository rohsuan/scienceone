---
phase: 15-polish-and-cross-linking
plan: "02"
subsystem: cross-linking
tags: [cross-linking, blog, resources, simulations, discovery, ux]
dependency_graph:
  requires: [15-01]
  provides: [cross-link-queries, related-resources-section, related-articles-section, related-lab-guides-section]
  affects: [blog-queries, resource-queries, blog-detail-page, resource-detail-page, simulation-detail-page]
tech_stack:
  added: []
  patterns: [subject-based-cross-linking, conditional-section-rendering, parallel-data-fetching]
key_files:
  created: []
  modified:
    - src/lib/blog-queries.ts
    - src/lib/resource-queries.ts
    - src/app/(main)/blog/[slug]/page.tsx
    - src/app/(main)/resources/[slug]/page.tsx
    - src/app/(main)/simulations/[slug]/page.tsx
decisions:
  - "getRelatedResources excludes SIMULATION type — simulations have dedicated pages at /simulations/{slug} so cross-linking from blog always points to /resources/{slug}"
  - "excludeId is optional on getRelatedResources (blog cross-links are cross-model, no self-exclusion) but included for future-proofing"
  - "getRelatedLabGuides passes resource.id as excludeResourceId — simulations and lab guides share the Resource table so self-exclusion is required"
  - "Related Articles section placed below the 2-column grid (full-width) on resource detail, not inside a column"
metrics:
  duration: 2 min
  completed_date: "2026-02-22"
  tasks_completed: 2
  files_modified: 5
---

# Phase 15 Plan 02: Cross-Link Sections on Detail Pages Summary

Subject-based cross-linking added to all three detail page types: blog posts show Related Resources, resource pages show Related Articles, and simulation pages show Related Lab Guides in the sidebar.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add cross-link query functions | 2177b4e | src/lib/blog-queries.ts, src/lib/resource-queries.ts |
| 2 | Add cross-link UI sections to detail pages | 5f0a918 | src/app/(main)/blog/[slug]/page.tsx, src/app/(main)/resources/[slug]/page.tsx, src/app/(main)/simulations/[slug]/page.tsx |

## Decisions Made

- **SIMULATION type excluded from blog cross-links**: `getRelatedResources` uses `type: { not: "SIMULATION" }` because simulations have dedicated pages at `/simulations/{slug}`. Cross-links from blog always route to `/resources/{slug}`.
- **Self-exclusion in getRelatedLabGuides**: Simulations and lab guides are both stored in the `Resource` table, so `excludeResourceId` is required to prevent a simulation from appearing in its own Related Lab Guides list.
- **Related Articles placed full-width**: On the resource detail page, Related Articles renders below the two-column grid as a full-width section, giving articles the horizontal space to display excerpts readably.
- **Conditional rendering guards**: All three cross-link sections use `.length > 0` guards — no empty headings ever render if there are no related items.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 5 key files verified present on disk. Both task commits (2177b4e, 5f0a918) confirmed in git log. TypeScript compilation (`npx tsc --noEmit`) passes with no errors. `npm run build` completes successfully with all three detail pages listed as dynamic routes.
