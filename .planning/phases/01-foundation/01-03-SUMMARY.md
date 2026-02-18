---
phase: 01-foundation
plan: "03"
subsystem: auth
tags: [nextjs, better-auth, react-hook-form, zod, shadcn-ui, tailwind, typescript, google-oauth]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Better Auth client (authClient.signUp.email, signIn.email, signIn.social), Zod schemas (signUpSchema, signInSchema)"
  - phase: 01-02
    provides: "shadcn/ui components (Form, Card, Button, Input, Label, Separator), academic CSS variables (navy primary, Lora serif)"
provides:
  - "Sign-up page at /sign-up with name/email/password form + Google OAuth option"
  - "Sign-in page at /sign-in with email/password form + Google OAuth option"
  - "Verify-email page at /verify-email with instructions and resend capability"
  - "Auth layout (centered, muted background, ScienceOne serif logo)"
  - "Reusable AuthCard component for consistent auth page framing"
  - "GoogleSignInButton triggering Better Auth Google OAuth flow"
  - "SignUpForm with Zod validation, password visibility toggle, friendly error messages"
  - "SignInForm with Zod validation, password visibility toggle, friendly error messages"
  - "ResendVerificationButton with sessionStorage email retrieval and fallback input"
affects:
  - 01-04
  - all-subsequent-phases

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client forms use react-hook-form with zodResolver for client-side validation before API calls"
    - "Form-level errors displayed via form.setError('root', { message }) pattern"
    - "Friendly error messages mapped from Better Auth error codes/HTTP status codes"
    - "Password visibility toggle using local useState with Eye/EyeOff lucide icons"
    - "sessionStorage used to pass email from sign-up to verify-email page for resend flow"
    - "Google OAuth initiated client-side via authClient.signIn.social with callbackURL"

key-files:
  created:
    - "src/app/(auth)/layout.tsx"
    - "src/components/auth/AuthCard.tsx"
    - "src/components/auth/GoogleSignInButton.tsx"
    - "src/components/auth/SignUpForm.tsx"
    - "src/components/auth/SignInForm.tsx"
    - "src/components/auth/ResendVerificationButton.tsx"
    - "src/app/(auth)/sign-up/page.tsx"
    - "src/app/(auth)/sign-in/page.tsx"
    - "src/app/(auth)/verify-email/page.tsx"
  modified: []

key-decisions:
  - "sessionStorage holds pending-verification-email after sign-up for use by ResendVerificationButton — avoids requiring user to re-enter email"
  - "Better Auth error codes mapped to friendly messages: USER_ALREADY_EXISTS→'account already exists', INVALID_EMAIL_OR_PASSWORD→'that password doesn't look right', EMAIL_NOT_VERIFIED→'please verify your email first'"
  - "ResendVerificationButton falls back to email input when sessionStorage has no email (direct page navigation)"
  - "Auth layout is a standalone route group (auth) with its own layout.tsx — no shared Header/Footer from main layout"

patterns-established:
  - "Pattern: AuthCard reusable wrapper for consistent auth page chrome (title/description/footer)"
  - "Pattern: form.setError('root') for API-level errors displayed above submit button"
  - "Pattern: Friendly error messages over technical status codes per user decision in CONTEXT.md"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 7min
completed: 2026-02-18
---

# Phase 1 Plan 03: Auth UI Summary

**Sign-up, sign-in, and verify-email pages with react-hook-form + Zod validation, Google OAuth button, and friendly Better Auth error messages**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T12:16:28Z
- **Completed:** 2026-02-18T12:24:02Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Complete auth UI flow: three pages (/sign-up, /sign-in, /verify-email) all using the auth layout (centered, muted background, ScienceOne serif logo)
- SignUpForm and SignInForm with Zod client-side validation, password visibility toggle, and friendly error messages mapped from Better Auth error codes
- Google OAuth sign-in available on both sign-up and sign-in pages via GoogleSignInButton (full-width, official Google G logo)
- Resend verification email flow: email passed via sessionStorage from sign-up → verify-email page, fallback to email input for direct navigation
- Next.js build compiles cleanly with all pages statically pre-rendered; TypeScript has zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth layout and reusable auth components** - `0d624eb` (feat)
2. **Task 2: Build sign-up, sign-in, and verify-email pages** - `3a44dae` (feat)

**Plan metadata:** (pending — created after summary)

## Files Created/Modified

- `src/app/(auth)/layout.tsx` - Auth layout: full-viewport centered, muted background, ScienceOne serif logo link
- `src/components/auth/AuthCard.tsx` - Reusable Card wrapper with title/description/children/footer props
- `src/components/auth/GoogleSignInButton.tsx` - Full-width outline button with Google G SVG logo, loading state, calls authClient.signIn.social
- `src/components/auth/SignUpForm.tsx` - Name/email/password form, zodResolver(signUpSchema), password visibility toggle, friendly error mapping, stores email in sessionStorage on success
- `src/components/auth/SignInForm.tsx` - Email/password form, zodResolver(signInSchema), password visibility toggle, friendly error mapping, Forgot password? link
- `src/components/auth/ResendVerificationButton.tsx` - Reads email from sessionStorage, falls back to email input, calls authClient.sendVerificationEmail
- `src/app/(auth)/sign-up/page.tsx` - Sign-up page with AuthCard, SignUpForm, OR separator, GoogleSignInButton, "Already have account?" footer
- `src/app/(auth)/sign-in/page.tsx` - Sign-in page with AuthCard, SignInForm, OR separator, GoogleSignInButton, "Don't have account?" footer
- `src/app/(auth)/verify-email/page.tsx` - Instructions page with mail icon, explanation text, ResendVerificationButton, "Back to sign in" footer

## Decisions Made

- **sessionStorage for email passing:** After sign-up, email is stored in `sessionStorage["pending-verification-email"]` so the verify-email page can offer resend without user re-entering it. Falls back to email input field for direct navigation to /verify-email.
- **Error code mapping:** Better Auth returns both `.status` (HTTP code) and `.code` (string). Both are checked for maximum compatibility: `USER_ALREADY_EXISTS` OR 409 → "account with this email already exists"; `INVALID_EMAIL_OR_PASSWORD` OR 401 → "that password doesn't look right"; `EMAIL_NOT_VERIFIED` OR 403 → "please verify your email first".
- **Resend via Better Auth client:** `authClient.sendVerificationEmail({ email, callbackURL })` is the correct Better Auth v1.4 client method — requires email to be passed (not inferred from session).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ResendVerificationButton component**
- **Found during:** Task 2 (verify-email page implementation)
- **Issue:** Plan specified a "Resend verification email" button on the verify-email page, but Better Auth's `sendVerificationEmail` requires the email address. The verify-email page is a redirect destination with no form, so the email must come from somewhere.
- **Fix:** Created ResendVerificationButton that reads email from sessionStorage (populated by SignUpForm on success), falls back to rendering an email input field for direct navigation. Also updated SignUpForm to store email in sessionStorage before redirecting.
- **Files modified:** `src/components/auth/SignUpForm.tsx`, `src/components/auth/ResendVerificationButton.tsx`
- **Verification:** TypeScript passes, build succeeds
- **Committed in:** `3a44dae` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — resend email flow mechanism)
**Impact on plan:** Auto-fix required for resend flow to work correctly. No scope creep — the plan specified a resend button but the mechanism wasn't specified.

## Issues Encountered

None — build and TypeScript both clean on first attempt.

## User Setup Required

None — auth UI works with Better Auth once the environment variables from Plan 01-01 are configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET for Google OAuth; RESEND_API_KEY for email verification).

## Next Phase Readiness

- Auth UI is complete and production-ready once PostgreSQL + env vars are configured
- All three auth pages compile statically and render correctly
- Plan 01-04 can build on the authenticated session state (dashboard shell, header with user avatar)

---
*Phase: 01-foundation*
*Completed: 2026-02-18*
