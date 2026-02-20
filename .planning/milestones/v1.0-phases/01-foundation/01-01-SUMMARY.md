---
phase: 01-foundation
plan: "01"
subsystem: database
tags: [nextjs, prisma, better-auth, postgresql, zod, react-email, resend, tailwind, typescript]

# Dependency graph
requires: []
provides:
  - "Next.js 16.1.6 project scaffold with TypeScript, Tailwind v4, ESLint, App Router"
  - "Prisma 7 schema with 11 models covering auth and domain tables"
  - "Better Auth server config with email+password, email verification, Google OAuth"
  - "Better Auth client hooks (signIn, signUp, signOut, useSession)"
  - "Auth API route handler at /api/auth/*"
  - "Zod validation schemas for sign-up and sign-in"
  - "React Email verification template"
  - "Prisma seed script with categories, users, and 3 sample books with chapters"
  - "Prisma generated client at src/generated/prisma/"
affects:
  - 01-02
  - 01-03
  - 01-04
  - all-subsequent-phases

# Tech tracking
tech-stack:
  added:
    - "next@16.1.6"
    - "better-auth@1.4.18"
    - "@prisma/client@7.4.0"
    - "@prisma/adapter-pg@7.4.0"
    - "prisma@7.4.0"
    - "pg@8.18"
    - "dotenv@17"
    - "resend@6.9"
    - "@react-email/components@1.0.7"
    - "react-hook-form@7.71"
    - "@hookform/resolvers@5.2"
    - "zod@4.3"
    - "tsx@4.21"
    - "@types/pg@8.16"
    - "tailwindcss@4"
  patterns:
    - "Prisma 7 singleton with PrismaPg Driver Adapter via globalThis"
    - "Better Auth with prismaAdapter — email+password + Google OAuth + email verification"
    - "Auth API catch-all route via toNextJsHandler(auth)"
    - "Fire-and-forget email sends with void resend.emails.send(...)"
    - "Zod schema validation with inferred TypeScript types"

key-files:
  created:
    - "prisma/schema.prisma"
    - "prisma.config.ts"
    - "prisma/seed.ts"
    - "src/lib/prisma.ts"
    - "src/lib/auth.ts"
    - "src/lib/auth-client.ts"
    - "src/lib/validations/auth.ts"
    - "src/app/api/auth/[...all]/route.ts"
    - "src/emails/verification.tsx"
    - "src/generated/prisma/ (generated)"
    - ".env.example"
    - "package.json"
  modified:
    - ".gitignore"

key-decisions:
  - "Prisma 7 uses prisma.config.ts at project root (not prisma/prisma.config.ts) — Prisma init creates it there"
  - "Prisma 7 generated client import path requires /client suffix: @/generated/prisma/client (no index.ts)"
  - "Seed users do not have passwords — display/test data only; login testing uses Better Auth API directly"
  - "Fire-and-forget email sends (void) to avoid timing attack vectors per RESEARCH.md anti-patterns"
  - "Google OAuth users auto-verified by Better Auth — no manual email verification required for OAuth flow"

patterns-established:
  - "Pattern: Prisma singleton with globalForPrisma guard for hot-reload safety"
  - "Pattern: Better Auth route handler via toNextJsHandler(auth)"
  - "Pattern: Async-only Next.js 16 request APIs (await cookies/headers/params)"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 15min
completed: 2026-02-18
---

# Phase 1 Plan 01: Foundation Infrastructure Summary

**Next.js 16 + Prisma 7 scaffold with Better Auth (email+password + Google OAuth + email verification) and full domain schema (11 models) ready for migration**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-18T11:56:11Z
- **Completed:** 2026-02-18T12:11:21Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Next.js 16.1.6 project created with all production and dev dependencies (better-auth, prisma 7, resend, zod, react-hook-form, react-email)
- Full Prisma 7 schema with 11 models: auth tables (User, Session, Account, Verification) and domain tables (Book, BookPrice, Chapter, Category, BookCategory, Purchase, Download, ReadingProgress)
- Better Auth server configured with email+password (requireEmailVerification), Google OAuth, and Resend-powered verification email
- TypeScript compiles cleanly, dev server starts in ~455ms with Turbopack

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Next.js 16 project with all dependencies** - `3edbe84` (feat)
2. **Task 2: Configure Prisma 7, full schema, Better Auth, and seed script** - `e2a8d1b` (feat)

**Plan metadata:** (pending — created after summary)

## Files Created/Modified

- `prisma/schema.prisma` - Full 11-model schema (auth + domain tables)
- `prisma.config.ts` - Prisma 7 config with env() datasource URL
- `prisma/seed.ts` - Seed with 4 categories, 2 users, 3 books, 8 chapters
- `src/lib/prisma.ts` - PrismaClient singleton with PrismaPg Driver Adapter
- `src/lib/auth.ts` - Better Auth server config (email+password, Google, email verification)
- `src/lib/auth-client.ts` - Better Auth client with signIn, signUp, signOut, useSession
- `src/lib/validations/auth.ts` - Zod schemas: signUpSchema, signInSchema + inferred types
- `src/app/api/auth/[...all]/route.ts` - Auth API route handler
- `src/emails/verification.tsx` - Academic-styled React Email verification template
- `src/generated/prisma/` - Generated Prisma 7 client (from prisma generate)
- `.env.example` - All required env variable names documented
- `.gitignore` - Updated to exclude .env (not .env.example) and src/generated/
- `package.json` - All deps + prisma.seed script

## Decisions Made

- **Prisma config location:** `prisma.config.ts` lives at project root (not `prisma/prisma.config.ts` as specified in plan) — Prisma 7 `init` creates it at root. This is correct Prisma 7 behavior.
- **Import path:** Prisma 7 generated client has no `index.ts`, so import must be `@/generated/prisma/client` not `@/generated/prisma`. Auto-fixed.
- **Seed users:** No passwords in seed data — Better Auth manages password hashing; seed users are test display data only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma 7 generated client import path**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** Plan specified `import { PrismaClient } from "@/generated/prisma"` but Prisma 7 generates `client.ts` without an `index.ts`, so the directory import fails. TypeScript error: "Cannot find module '@/generated/prisma'"
- **Fix:** Updated import to `@/generated/prisma/client` in `src/lib/prisma.ts` and `prisma/seed.ts`
- **Files modified:** `src/lib/prisma.ts`, `prisma/seed.ts`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `e2a8d1b` (Task 2 commit)

**2. [Rule 3 - Blocking] prisma.config.ts created at project root, not prisma/ subdirectory**
- **Found during:** Task 2 (npx prisma init)
- **Issue:** Plan specified `prisma/prisma.config.ts` but Prisma 7 `init` creates `prisma.config.ts` at the project root. This is the correct/required location for Prisma 7.
- **Fix:** Used root-level `prisma.config.ts` as created by Prisma (path already correct for Prisma tooling)
- **Files modified:** `prisma.config.ts` (at root)
- **Verification:** `npx prisma generate` succeeds loading from `prisma.config.ts`
- **Committed in:** `e2a8d1b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes required for correct Prisma 7 operation. No scope creep.

## Issues Encountered

- **PostgreSQL not running:** `npx prisma migrate dev --name init` and `npx prisma db seed` cannot run without a PostgreSQL instance. This is expected — the plan documents this in the `user_setup` section. The schema and seed script are complete and ready; migration will run once the user sets up their database (Docker or Neon per user_setup instructions).

## User Setup Required

External services require manual configuration before the application is fully operational:

**1. PostgreSQL Database (required for migration + seed)**
```bash
# Local Docker option:
docker run --name scienceone-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scienceone \
  -p 5432:5432 -d postgres:16

# Then run migration and seed:
npx prisma migrate dev --name init
npx prisma db seed
```
Or use [Neon free tier](https://neon.tech) and update `DATABASE_URL` in `.env`.

**2. Resend API Key** (required for email verification)
- Create at [Resend Dashboard](https://resend.com/api-keys)
- Add to `.env`: `RESEND_API_KEY=re_...`

**3. Google OAuth** (required for Google sign-in)
- Create OAuth 2.0 Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Add to `.env`: `GOOGLE_CLIENT_ID=...` and `GOOGLE_CLIENT_SECRET=...`

## Next Phase Readiness

- Project scaffold is complete and TypeScript-clean
- All library dependencies installed
- Schema is fully defined — Plan 02-04 can reference all models immediately
- Auth configuration is complete and will work once PostgreSQL is running and env vars are set
- Migration and seed are blocked pending PostgreSQL setup (user action required)

---
*Phase: 01-foundation*
*Completed: 2026-02-18*
