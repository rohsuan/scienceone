---
phase: 06-secure-downloads
verified: 2026-02-19T14:45:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 6: Secure Downloads Verification Report

**Phase Goal:** Users with access to a book can download its PDF and EPUB files via time-limited presigned URLs; unauthenticated or unpurchased requests are rejected; print purchase links are visible on detail pages
**Verified:** 2026-02-19T14:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria + Plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Authenticated user with purchase can download PDF via time-limited presigned URL | VERIFIED | `route.ts:90-99` — `getSignedUrl` with `expiresIn: 900`; entitlement gate at line 69 allows through on purchase |
| 2 | Authenticated user with purchase can download EPUB via time-limited presigned URL | VERIFIED | Same route; `format === "epub"` selects `book.epubKey`; same presign logic |
| 3 | Unauthenticated or unpurchased request returns 401/403 (not a broken link) | VERIFIED | `route.ts:27-29` → 401 if no session; `route.ts:76-78` → 403 if no purchase |
| 4 | Open-access books allow download with session only (no purchase required) | VERIFIED | `route.ts:69` — entitlement check skipped when `book.isOpenAccess` is true |
| 5 | Print purchase link appears in metadata section (right column, near ISBN/pages/dimensions) | VERIFIED | `page.tsx:200-215` — `book.printLink` rendered inside `<dl>` metadata grid; `page.tsx:178` — condition includes `book.printLink` |
| 6 | Download error toasts display correctly via sonner Toaster | VERIFIED | `layout.tsx:33` — `<Toaster />` mounted globally; `DownloadButton.tsx:35,42` — `toast.error()` calls on failure |
| 7 | My Library book cards show download dropdown with PDF and EPUB options | VERIFIED | `LibraryBookCard.tsx:38-48` — `DownloadDropdown` rendered conditionally; `MyLibrary.tsx:27-28` — booleans derived from `purchase.book.pdfKey`/`epubKey` |
| 8 | Reader header shows download dropdown with PDF and EPUB options | VERIFIED | `ReaderTopBar.tsx:40-48` — `DownloadDropdown` conditionally rendered; `layout.tsx:26-28` — `hasPdf`/`hasEpub` booleans passed from server |
| 9 | Download buttons hidden when no artifacts exist | VERIFIED | `DownloadDropdown.tsx:53` — returns `null` when `!hasPdf && !hasEpub`; detail page: `page.tsx:114-115` — conditional on `book.pdfKey || book.epubKey` |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Level 1 (Exists) | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|------------------|-----------------------|-----------------|--------|
| `src/lib/r2.ts` | Shared R2 client; exports `createR2Client` | PRESENT | 15 lines; exports `createR2Client` with WHEN_REQUIRED checksum config | Imported in `api/download/route.ts` line 7 | VERIFIED |
| `src/app/api/download/route.ts` | GET handler with auth + entitlement + presign + audit log | PRESENT | 109 lines; all 9 steps (auth, validate, rate-limit, fetch book, entitlement, artifact check, presign, audit, return) implemented | Reachable via Next.js App Router at `/api/download` | VERIFIED |
| `src/components/catalog/DownloadButton.tsx` | Client component for individual PDF/EPUB download | PRESENT | 59 lines; "use client"; `useState` loading; `fetch /api/download`; `window.location.href` redirect; `toast.error` on failure | Imported and rendered in `catalog/[slug]/page.tsx` line 13, 118, 121 | VERIFIED |
| `src/components/catalog/DownloadDropdown.tsx` | Client component dropdown for compact placements | PRESENT | 79 lines; "use client"; dropdown with PDF/EPUB items; same fetch/redirect/toast pattern; returns null when no formats | Imported in `LibraryBookCard.tsx:4`, `ReaderTopBar.tsx:7`; rendered conditionally in both | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `DownloadButton.tsx` | `/api/download` | `fetch` with `bookSlug` + `format` params | WIRED | Line 30-32: `fetch('/api/download?bookSlug=${...}&format=${format}')` + response handled at lines 33-39 |
| `api/download/route.ts` | `src/lib/r2.ts` | `createR2Client()` + `getSignedUrl` | WIRED | Line 7: import; line 91: `getSignedUrl(createR2Client(), ...)` |
| `catalog/[slug]/page.tsx` | `DownloadButton.tsx` | conditional render based on `pdfKey`/`epubKey` + access | WIRED | Line 13: import; lines 114-124: conditional on `(isOpenAccess && session) || purchased` AND `book.pdfKey || book.epubKey` |
| `LibraryBookCard.tsx` | `DownloadDropdown.tsx` | import + render with `hasPdf`/`hasEpub` booleans | WIRED | Line 4: import; lines 38-48: conditional render with props |
| `ReaderTopBar.tsx` | `DownloadDropdown.tsx` | import + render with `hasPdf`/`hasEpub` booleans | WIRED | Line 7: import; lines 40-48: conditional render with props |
| `reader layout.tsx` | `ReaderTopBar.tsx` | pass `hasPdf={!!book.pdfKey}`, `hasEpub={!!book.epubKey}` | WIRED | Lines 22-28: `ReaderTopBar` receives booleans derived from `getBookChapters` result |
| `MyLibrary.tsx` | `LibraryBookCard.tsx` | pass `hasPdf`/`hasEpub` booleans from purchase data | WIRED | Lines 27-28: `hasPdf={!!purchase.book.pdfKey}` `hasEpub={!!purchase.book.epubKey}` |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DL-01 | 06-01, 06-02 | User can download purchased books as PDF (secured with time-limited presigned URLs) | SATISFIED | API route generates presigned URL with 900s expiry; DownloadButton fetches it; detail page, library card, and reader header all wire to same endpoint |
| DL-02 | 06-01, 06-02 | User can download purchased books as EPUB | SATISFIED | Same route handles `format=epub`; DropdownDropdown provides EPUB option in all three placements |
| DL-03 | 06-01 | Book detail page shows print purchase link (external link to buy print edition) | SATISFIED | `page.tsx:200-215` — `book.printLink` rendered in metadata `<dl>` with `target="_blank"`, `rel="noopener noreferrer"`, and `ExternalLink` icon |

All 3 requirements (DL-01, DL-02, DL-03) claimed across plans 06-01 and 06-02 are satisfied. No orphaned requirements found — REQUIREMENTS.md maps only DL-01, DL-02, DL-03 to Phase 6.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No TODO/FIXME/placeholder comments, no empty implementations, no stub return values, no console.log-only handlers found in any phase files.

---

### Human Verification Required

The following items cannot be fully verified programmatically. They were marked as passing in SUMMARY.md (via Rodney browser testing) but cannot be re-confirmed here without a browser.

#### 1. End-to-End Download Flow

**Test:** Log in as a user with a purchase, navigate to the book detail page, click "Download PDF" or "Download EPUB"
**Expected:** Browser initiates download via presigned R2 URL (or shows toast if R2 not configured in dev)
**Why human:** Requires live database with a purchase record, valid R2 credentials, and actual network request — cannot be verified statically

#### 2. Unauthenticated Detail Page — No Download Buttons

**Test:** Log out and visit a book detail page
**Expected:** No PDF/EPUB download buttons appear anywhere in the left column
**Why human:** Access control rendering depends on session state at runtime

#### 3. Print Link Opens in New Tab

**Test:** Click "Buy Print Edition" link on a book detail page with `printLink` configured
**Expected:** Opens in new tab; does not navigate away from detail page
**Why human:** Browser behavior, not statically verifiable

---

### Security Observations (No Action Required)

1. **Storage keys never exposed to browser:** `pdfKey`/`epubKey` are converted to booleans (`!!pdfKey`) at the server/client boundary in `MyLibrary.tsx:27-28` and `reader layout.tsx:26-27`. Only `{ url }` is returned from the API route — the underlying R2 object key is never in the response.

2. **Rate limiter is in-memory per process:** The `downloadRequests` Map resets on deploy and does not coordinate across multiple Node processes. Acceptable for current scale; noted in SUMMARY as a known limitation upgradeable to Redis.

3. **Audit log is fire-and-forget:** `void prisma.download.create()` — does not block the response. Schema-ready for analytics use in later phases.

---

### Gaps Summary

No gaps. All must-haves from plans 06-01 and 06-02 are verified at all three levels (exists, substantive, wired). All 3 phase requirements (DL-01, DL-02, DL-03) are satisfied. Commits 938e19b, 4a7ef34, and 877791a exist and are correctly described in SUMMARY.md.

---

_Verified: 2026-02-19T14:45:00Z_
_Verifier: Claude (gsd-verifier)_
