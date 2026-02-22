---
phase: 11-resource-admin
plan: "01"
subsystem: admin-uploads
tags: [image-upload, r2, subjects, refactor]
dependency_graph:
  requires: []
  provides: [generic-image-upload, resource-cover-upload, fixed-subject-select]
  affects: [ResourceEditForm, BookEditForm, BlogPostEditForm, SubjectSelect]
tech_stack:
  added: []
  patterns: [generic-prop-interface, public-url-construction, read-only-subject-select]
key_files:
  created: []
  modified:
    - src/components/admin/ImageUploadField.tsx
    - src/components/admin/ResourceEditForm.tsx
    - src/components/admin/BookEditForm.tsx
    - src/components/admin/BlogPostEditForm.tsx
    - src/components/admin/SubjectSelect.tsx
    - src/lib/resource-admin-actions.ts
    - .env.example
decisions:
  - "ImageUploadField uses entityId+uploadType generic interface — no entity-specific props"
  - "Full public URL stored on upload via NEXT_PUBLIC_R2_PUBLIC_URL prefix — bare R2 key as fallback"
  - "SubjectSelect is read-only multi-select — no create-subject capability per Phase 10-01 decision"
  - "createSubject server action removed — subjects are seeded, not created at runtime"
metrics:
  duration: "2 min"
  completed: "2026-02-22"
  tasks_completed: 2
  files_modified: 7
---

# Phase 11 Plan 01: ImageUploadField Refactor and SubjectSelect Cleanup Summary

**One-liner:** Generic entityId+uploadType image upload with full public URL construction, plus read-only SubjectSelect removing dead createSubject code.

## What Was Done

### Task 1: Refactor ImageUploadField and Fix ResourceEditForm Props

Replaced the book-specific `bookId` + `type` interface on `ImageUploadField` with a generic `entityId` + `uploadType` interface that supports books, resources, and blog posts in one component.

Key changes:
- `bookId: string` → `entityId: string`
- `type: "cover" | "author"` → `uploadType: "cover" | "author" | "resource-cover" | "blog-cover" | "blog-author"`
- Upload body now sends the correct ID field (`bookId` for books, `resourceId` for resources/blog) based on `uploadType`
- After XHR upload success, constructs full public URL: `${NEXT_PUBLIC_R2_PUBLIC_URL}/${r2Key}` — falls back to bare `r2Key` if env var unset
- `ResourceEditForm` updated: `bookId={resource.id} type="cover"` → `entityId={resource.id} uploadType="resource-cover"`
- `BookEditForm` updated: both cover and author upload fields use `entityId` + `uploadType`
- `BlogPostEditForm` updated: cover uses `uploadType="blog-cover"`, author uses `uploadType="blog-author"`
- `.env.example` documents `NEXT_PUBLIC_R2_PUBLIC_URL`

### Task 2: Remove create-subject UI from SubjectSelect

Stripped all create-subject functionality from `SubjectSelect.tsx`:
- Removed: `newSubjectName`, `isCreating`, `createError` states
- Removed: `handleCreateSubject` function
- Removed: `createSubject` import from resource-admin-actions
- Removed: Input + "Add" Button create UI block
- Removed: local `subjects` state — now uses `subjects` prop directly
- Updated empty state text: "No subjects yet. Create one below." → "No subjects available."
- Component reduced from ~130 lines to ~75 lines

Also removed the dead `createSubject` server action from `src/lib/resource-admin-actions.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed BlogPostEditForm using old ImageUploadField props**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `BlogPostEditForm.tsx` had `bookId={post.id} type="cover"` and `type="author"` — caused 2 TS errors after interface change
- **Fix:** Updated to `entityId={post.id} uploadType="blog-cover"` and `uploadType="blog-author"` — correct types for the upload-url API route
- **Files modified:** `src/components/admin/BlogPostEditForm.tsx`
- **Commit:** 5785507

## Commits

| Hash | Description |
|------|-------------|
| 5785507 | feat(11-01): refactor ImageUploadField to generic entityId+uploadType props |
| 12b7268 | feat(11-01): simplify SubjectSelect to read-only multi-select, remove createSubject |

## Self-Check: PASSED

All 7 modified files exist on disk. Both task commits (5785507, 12b7268) found in git log.
