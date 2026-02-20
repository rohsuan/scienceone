---
phase: 09-audit-gap-closure
plan: "01"
subsystem: admin-forms, auth, catalog, download-api
tags: [zod, nan-coercion, redirect, open-access, anonymous-download]
dependency_graph:
  requires: []
  provides: [ADM-03, ADM-04, sign-in-redirect, open-access-anonymous-download]
  affects: [admin-dashboard, catalog-detail, download-api, sign-in-flow]
tech_stack:
  added: []
  patterns:
    - z.union([z.number(), z.nan().transform(() => null)]) for NaN-to-null coercion in Zod 4
    - Server Component searchParams → Client Component prop pattern for redirect
    - Conditional auth in API route (fetch resource first, then decide auth requirement)
    - IP-based rate limiting for anonymous API requests
key_files:
  created: []
  modified:
    - src/lib/admin-actions.ts
    - src/app/(auth)/sign-in/page.tsx
    - src/components/auth/SignInForm.tsx
    - src/components/auth/GoogleSignInButton.tsx
    - src/app/(main)/catalog/[slug]/page.tsx
    - src/app/api/download/route.ts
decisions:
  - "[09-01] z.union([z.number(), z.nan().transform(() => null)]) used instead of z.preprocess for NaN-to-null — z.preprocess makes input type unknown, breaking @hookform/resolvers type inference in Zod 4"
metrics:
  duration: 3 min
  completed: 2026-02-20
  tasks_completed: 2
  files_modified: 6
---

# Phase 9 Plan 01: Audit Gap Closure Summary

**One-liner:** Four v1 audit gaps closed — Zod NaN-to-null union pattern, sign-in redirect prop flow, and conditional auth for open-access anonymous downloads.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Zod NaN handling and sign-in redirect | e6976bb | admin-actions.ts, sign-in/page.tsx, SignInForm.tsx, GoogleSignInButton.tsx |
| 2 | Open access anonymous download (UI + API) | 78de483 | catalog/[slug]/page.tsx, api/download/route.ts |

## What Was Built

### Task 1: Zod NaN-to-null and Sign-in Redirect

**ADM-03 / ADM-04 fix:** Admin numeric fields (pageCount, publishYear, price) now accept empty inputs without validation failure. When an HTML `type="number"` input is cleared, `{ valueAsNumber: true }` produces `NaN`. Zod 4 `z.number()` rejects NaN at the type-check stage before any transform runs. The fix uses `z.union([z.number().int().positive(), z.nan().transform(() => null)]).optional().nullable()` — the union tries `z.number()` first (accepts valid numbers) and falls through to `z.nan().transform(() => null)` when the value is NaN, converting it to null.

**Sign-in redirect:** Sign-in page is now async and reads `searchParams.redirect`. The redirect is validated (must start with `/`, must not start with `//` to prevent open redirect). The validated `redirectTo` is passed as a prop to both `SignInForm` and `GoogleSignInButton`. After successful email/password login, `router.push(redirectTo)` is called instead of the hardcoded `/dashboard`. For Google OAuth, `callbackURL: redirectTo` is used instead of `callbackURL: "/dashboard"`.

### Task 2: Open Access Anonymous Download

**UI gate:** Catalog detail page download button condition changed from `((book.isOpenAccess && session) || purchased)` to `(book.isOpenAccess || purchased)`. Anonymous users now see PDF/EPUB download buttons for open access books.

**API gate:** Download route restructured so book is fetched first (needed to check `isOpenAccess`), then auth is checked conditionally: `if (!book.isOpenAccess && !session) return 401`. Open access downloads proceed without a session. Added `getClientIp()` helper using `x-forwarded-for` header. Rate limiting uses `userId` for authenticated users and `anon:IP` for anonymous. Audit logging (Download record) is skipped for anonymous users since `Download.userId` is non-nullable (no migration needed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] z.preprocess causes unknown input type breaking @hookform/resolvers**

- **Found during:** Task 1 TypeScript verification
- **Issue:** Plan specified `z.preprocess()` for NaN-to-null coercion, but `z.preprocess` in Zod 4 sets the input type to `unknown`, causing type errors in `BookEditForm.tsx` where `useForm<BookUpdateData>` expects `number | null | undefined` for numeric fields
- **Fix:** Used `z.union([z.number().int().positive(), z.nan().transform(() => null)])` pattern instead — functionally equivalent but preserves `number | null` input type inference. This was already the pattern recommended in the research notes (Pattern 1 section).
- **Files modified:** src/lib/admin-actions.ts
- **Commit:** e6976bb

**2. [Rule 3 - Blocking] Removed scratch test files causing TS errors**

- **Found during:** Task 1 TypeScript verification
- **Issue:** `src/lib/__zod-test-preprocess.ts` and `src/lib/__zod-test-union.ts` were leftover exploration files (untracked) that contained `z.preprocess` pattern and caused TypeScript compilation errors
- **Fix:** Deleted both files — they were scratch test files not production code
- **Files modified:** (deleted) src/lib/__zod-test-preprocess.ts, src/lib/__zod-test-union.ts
- **Commit:** e6976bb

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| Admin can save numeric fields from empty/null without validation errors | PASS — z.union NaN-to-null coercion |
| Sign-in page reads ?redirect= and sends user to that path | PASS — searchParams.redirect validated and passed as prop |
| Open access books show download buttons to all visitors | PASS — (book.isOpenAccess || purchased) condition |
| Download API serves open access files to anonymous users | PASS — conditional auth gate after book fetch |
| Paid book downloads still require auth + purchase | PASS — !book.isOpenAccess && !session check preserved |
| No TypeScript compilation errors | PASS — npx tsc --noEmit exits 0 |

## Key Decisions

**z.union over z.preprocess for NaN-to-null (locked):** `z.preprocess` was specified in the plan but causes `unknown` input type in Zod 4 which breaks `@hookform/resolvers` type inference. The `z.union([z.number(), z.nan().transform(() => null)])` pattern achieves the same runtime behavior while preserving TypeScript type safety. This extends the existing locked decision [07-02] which already banned `z.coerce.number()` for the same reason.

## Self-Check: PASSED

Files verified present:
- src/lib/admin-actions.ts — FOUND (z.union pattern at lines 72-87)
- src/app/(auth)/sign-in/page.tsx — FOUND (redirectTo prop at lines 22, 42, 53)
- src/components/auth/SignInForm.tsx — FOUND (redirectTo prop at lines 23, 61)
- src/components/auth/GoogleSignInButton.tsx — FOUND (redirectTo callbackURL at lines 7, 15)
- src/app/(main)/catalog/[slug]/page.tsx — FOUND (isOpenAccess || purchased at line 125)
- src/app/api/download/route.ts — FOUND (getClientIp, conditional auth at lines 24, 64, 84)

Commits verified:
- e6976bb — Task 1: Zod NaN + sign-in redirect
- 78de483 — Task 2: open access anonymous download
