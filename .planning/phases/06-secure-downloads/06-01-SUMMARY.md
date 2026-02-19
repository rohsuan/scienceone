---
phase: 06-secure-downloads
plan: 01
subsystem: api
tags: [r2, cloudflare, presigned-url, download, s3-request-presigner, sonner, lucide]

# Dependency graph
requires:
  - phase: 05-payments-and-entitlement
    provides: Purchase model and hasPurchasedBySlug entitlement check
  - phase: 02-ingest
    provides: pdfKey/epubKey R2 object keys on Book model; R2 upload pattern with WHEN_REQUIRED checksum config

provides:
  - GET /api/download route with auth, rate limiting, entitlement, presigned URL, audit log
  - createR2Client shared utility (src/lib/r2.ts)
  - DownloadButton component (individual format, detail page)
  - DownloadDropdown component (compact dropdown, library/reader use)
  - Toaster mounted in root layout for global toast feedback

affects:
  - 06-02-PLAN (will wire DownloadDropdown into LibraryBookCard and reader header)

# Tech tracking
tech-stack:
  added: ["@aws-sdk/s3-request-presigner (getSignedUrl)"]
  patterns:
    - "Presigned URL pattern: API generates time-limited URL (900s), client redirects to it via window.location.href"
    - "In-memory rate limiter: Map<key, {count, resetAt}> scoped per userId:bookSlug:format"
    - "Fire-and-forget audit log: void prisma.download.create() — does not block response"
    - "Toaster mounted in root layout (not per-page) — single instance for all routes"

key-files:
  created:
    - src/lib/r2.ts
    - src/app/api/download/route.ts
    - src/components/catalog/DownloadButton.tsx
    - src/components/catalog/DownloadDropdown.tsx
  modified:
    - src/app/layout.tsx
    - src/app/(main)/catalog/[slug]/page.tsx

key-decisions:
  - "window.location.href (not <a download>) for presigned URL redirect — cross-origin download requires redirect not anchor tag"
  - "Download buttons hidden (not disabled) for unauthenticated/unpurchased users on detail page — per plan discretion"
  - "Print link relocated to right-column metadata section (near ISBN/pages/dimensions) — was in left-column pricing area"
  - "Rate limit: 10 requests per user per book per format per 60 seconds — in-memory (resets on deploy)"
  - "Presigned URL expiry: 900 seconds (15 minutes) — sufficient for download to start"

patterns-established:
  - "Download flow: fetch /api/download → receive { url } → window.location.href = url"
  - "Component visibility: access check happens in server component, client component receives no sensitive keys"

requirements-completed: [DL-01, DL-02, DL-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 6 Plan 01: Secure Downloads Summary

**Presigned R2 download API with entitlement check, rate limiting, and DownloadButton/DownloadDropdown components wired onto the book detail page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T13:19:31Z
- **Completed:** 2026-02-19T13:22:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- GET /api/download route: auth (401), validation (400), rate limiting (429), entitlement check (403), artifact check (404), presigned URL generation (200), fire-and-forget audit log
- DownloadButton and DownloadDropdown components with sonner toast error feedback
- Book detail page conditionally shows PDF/EPUB download buttons only for users with access (purchased or open-access + logged in)
- Print link relocated from left-column pricing area to right-column metadata section near ISBN/pages/dimensions
- Toaster mounted in root layout for global toast availability

## Task Commits

Each task was committed atomically:

1. **Task 1: R2 client, download API route, and Toaster mount** - `938e19b` (feat)
2. **Task 2: Download components, detail page integration, and print link relocation** - `4a7ef34` (feat)

## Files Created/Modified

- `src/lib/r2.ts` - Shared R2 S3Client factory with WHEN_REQUIRED checksum config
- `src/app/api/download/route.ts` - GET download handler: auth, rate limit, entitlement, presign, audit
- `src/components/catalog/DownloadButton.tsx` - Client component for individual format download button
- `src/components/catalog/DownloadDropdown.tsx` - Client component dropdown (compact placements)
- `src/app/layout.tsx` - Added Toaster mount after {children}
- `src/app/(main)/catalog/[slug]/page.tsx` - Added download buttons + relocated print link to metadata section

## Decisions Made

- `window.location.href` used for download redirect (not `<a download>`) — cross-origin presigned URLs do not work with anchor download attribute
- Download buttons hidden (not disabled) for users without access — cleaner UX, no confusion
- Print link moved to metadata dl grid with ExternalLink icon — context-appropriate placement near physical book details
- Rate limiter is in-memory (per-process) — resets on deploy; acceptable for this use case, could be upgraded to Redis if needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no new external service configuration required. Existing R2 env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) from Phase 2 are reused.

## Next Phase Readiness

- DownloadButton and DownloadDropdown components ready for Plan 02 wiring into LibraryBookCard and reader header
- /api/download route tested and proven in build; functional testing requires DB + R2 credentials
- Toaster available globally — no additional setup needed for Plan 02 toast usage

---
*Phase: 06-secure-downloads*
*Completed: 2026-02-19*
