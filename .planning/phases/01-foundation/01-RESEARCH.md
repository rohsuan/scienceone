# Phase 1: Foundation - Research

**Researched:** 2026-02-18
**Domain:** Next.js 16 + Better Auth + Prisma 7 + shadcn/ui + Tailwind CSS v4
**Confidence:** HIGH (verified against official docs and current ecosystem state)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Auth experience
- Sign-up fields: Claude's discretion (likely email + password + name)
- Google sign-in supported alongside email+password as a convenience option
- Email verification required before account is usable — user must click verification link
- Error messages use a friendly, helpful tone — e.g., "That password doesn't look right. Try again or reset it."

#### Visual identity
- Clean academic aesthetic — elegant, restrained, scholarly feel (think Nature, arXiv modernized)
- Serif headings, generous whitespace, deep blue + white color palette (navy/indigo primary, clean white backgrounds)
- Tailwind CSS + shadcn/ui component library for accessible, consistent, customizable components
- Light mode only for Phase 1 — dark mode deferred to a future enhancement

#### Post-auth landing
- Logged-in users see a welcome dashboard shell with user's name, empty sections for "My Library" and "Recently Read" that fill in as later phases ship
- Non-logged-in users see a simple branded landing page with tagline, value proposition, and sign-up/login buttons
- Full header from day one: logo, nav links (placeholder for catalog, etc.), and auth controls (login/avatar) — consistent across all pages
- Branded footer: logo, copyright, links section (About, Contact, Terms, Privacy)

#### Database schema scope
- Full schema defined upfront — users, books, chapters, purchases, downloads, etc. — so later phases use existing tables rather than constant migrations
- Seed script with sample books, chapters, and test users so every phase has data to work with immediately
- Users table includes a role field (user/admin) to distinguish the founder from regular users
- Book pricing stored in a separate pricing table linked to books, supporting future flexibility (regional pricing, time-limited offers)

### Claude's Discretion
- Exact sign-up form fields (email + password minimum, name likely included)
- Password strength requirements
- Verification email design and copy
- Loading states and transition animations
- Exact spacing, typography scale, and component styling within the academic aesthetic
- Dashboard shell layout and empty state illustrations
- Specific schema field types, indexes, and constraints
- Seed data content (sample book titles, chapter content)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create an account with email and password | Better Auth `emailAndPassword` plugin handles sign-up with bcrypt-equivalent hashing (scrypt); Prisma stores user+account records; sign-up server action + shadcn Form component |
| AUTH-02 | User can log in and maintain a session across browser refresh | Better Auth session management with database-backed sessions (not JWT by default); sessions persist across tab close; `useSession` hook for client-side, `auth.api.getSession()` for server-side |
</phase_requirements>

---

## Summary

The current (February 2026) ecosystem has shifted significantly from what many tutorials describe. **Next.js 16** is the latest stable release (v16.1.6), not Next.js 15. **Prisma 7** is the current major version with a Rust-free architecture requiring Driver Adapters. **Auth.js (NextAuth) is now maintained by the Better Auth team**, who explicitly recommend Better Auth for all new projects — and Auth.js v5 has unresolved peer dependency conflicts with Next.js 16 as of this research date.

For this project, the recommended stack is: **Next.js 16 + Better Auth + Prisma 7 + shadcn/ui (Tailwind v4) + Resend + React Email**. This combination is fully compatible, actively maintained, and well-documented. The major paradigm change from Next.js 15 is that `middleware.ts` is renamed to `proxy.ts` and the exported function is renamed from `middleware` to `proxy`. Async-only request APIs (`cookies`, `headers`, `params`) are now enforced.

The full schema can be designed upfront in Prisma using the Better Auth CLI to generate auth tables, then adding custom tables (books, chapters, purchases, etc.) on top. shadcn/ui now officially supports Tailwind CSS v4 and React 19. The init CLI handles all configuration.

**Primary recommendation:** Use `npx create-next-app@latest` with Next.js 16, install Better Auth + Prisma 7 + shadcn/ui in that order, let Better Auth CLI generate auth schema, then add custom domain tables to the same schema file.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth / Auth.js | Better Auth (Auth.js team joined Better Auth) | Late 2025 | NextAuth v5 has unresolved peer dep errors with Next.js 16; Better Auth is the recommended choice for new projects |
| `middleware.ts` / `export function middleware` | `proxy.ts` / `export function proxy` | Next.js 16 | File rename required; Auth.js pattern `export { auth as middleware }` becomes `export { auth as proxy }` — but Better Auth uses its own cookie-based proxy pattern |
| Prisma Client in `node_modules` | Prisma Client in `src/generated/` | Prisma 7 | Generated code is now in project source; requires `output` field in schema and `prisma.config.ts` config file |
| `provider = "prisma-client-js"` | `provider = "prisma-client"` | Prisma 7 | Old string still works but new string is canonical; new architecture requires Driver Adapter (`@prisma/adapter-pg`) |
| `middleware.ts` uses Edge runtime | `proxy.ts` uses Node.js runtime only | Next.js 16 | Edge runtime is NOT supported in `proxy.ts`; keep `middleware.ts` if edge runtime is required (not needed here) |
| Synchronous `cookies()`, `headers()`, `params` | Fully async only | Next.js 16 | Must `await` all request APIs — no synchronous fallback |
| Tailwind CSS v3 + tailwindcss-animate | Tailwind CSS v4 + tw-animate-css | shadcn/ui 2025 refresh | New `@theme` directive, OKLCH colors, `data-slot` attributes on primitives |

**Deprecated/outdated:**
- `middleware.ts` + `export function middleware`: Deprecated in Next.js 16; replaced by `proxy.ts` + `export function proxy`
- `next-auth` (Auth.js v4/v5): Not recommended for new projects; peer dep conflict with Next.js 16; maintainers now recommend Better Auth
- `provider = "prisma-client-js"` with Rust engine: Works but legacy; new projects should use `provider = "prisma-client"` with Driver Adapter
- `serverRuntimeConfig` / `publicRuntimeConfig`: Removed in Next.js 16; use `process.env` directly
- `next lint` command: Removed in Next.js 16; use ESLint CLI directly

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest ~16.1.6) | React framework with App Router, Turbopack default | Current stable; Turbopack now default bundler (2-5x faster builds) |
| react / react-dom | 19.2 | UI library | Bundled with Next.js 16; React Compiler stable in v16 |
| better-auth | latest | Authentication (email+password, Google OAuth, sessions, email verification) | Auth.js team joined Better Auth; explicitly recommended for new projects; no Next.js 16 peer dep issues |
| @prisma/client | 7.x | Database ORM client | Current major; Rust-free, 90% smaller bundles, 3x faster |
| prisma | 7.x | CLI + migration tool | Required dev dependency alongside client |
| @prisma/adapter-pg | 7.x | PostgreSQL Driver Adapter | Required in Prisma 7 to connect to PostgreSQL |
| pg | latest | PostgreSQL driver | Required by `@prisma/adapter-pg` |
| tailwindcss | 4.x | Utility CSS framework | shadcn/ui now officially supports v4; `@theme` directive |
| shadcn/ui | latest (canary for v4) | Component library | User decision; provides Form, Input, Button, Card, etc. |
| typescript | 5.x (min 5.1.0) | Type safety | Required by Next.js 16 minimum TypeScript version |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | latest | Transactional email sending | Verification emails, password reset — recommended by auth ecosystem |
| @react-email/components | latest | React-based email templates | Build verification/welcome emails with React JSX |
| react-hook-form | latest | Form state management | Pairs with shadcn Form component and Zod |
| @hookform/resolvers | latest | Connect react-hook-form to Zod | Required for `zodResolver` |
| zod | latest | Schema validation | Used in sign-up/sign-in forms and server actions |
| bcryptjs / (scrypt built-in) | — | Password hashing | Better Auth uses Node.js native scrypt by default; no extra install needed |
| dotenv | latest | Environment variable loading in Prisma config | Required by `prisma.config.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Auth.js v5 (NextAuth) | Auth.js has unresolved peer dep conflict with Next.js 16; Better Auth is recommended by same maintainers |
| Better Auth | Clerk | Clerk is hosted SaaS (pricing at scale); Better Auth is self-hosted and open-source |
| Prisma 7 | Drizzle ORM | Drizzle is lighter but less batteries-included; Prisma 7 has official Better Auth adapter |
| Resend | Nodemailer / SMTP | Resend is HTTP-based, simpler setup, generous free tier; no SMTP server needed |
| shadcn/ui (Tailwind v4) | shadcn/ui (Tailwind v3) | v4 is now officially supported; new projects should start on v4 |
| Next.js 16 | Next.js 15 | Next.js 16 is stable latest; v15 still works but would require upgrade later |

**Installation:**
```bash
# Create project
npx create-next-app@latest scienceone --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Auth
npm install better-auth

# Database (Prisma 7 with PostgreSQL adapter)
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install --save-dev prisma tsx @types/pg

# Email
npm install resend @react-email/components

# Forms
npm install react-hook-form @hookform/resolvers zod

# shadcn/ui (after project creation)
npx shadcn@latest init
# Then add components as needed:
npx shadcn@latest add button input label form card toast badge avatar
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/                  # Route group: no shared layout with main site
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   ├── (main)/                  # Route group: uses main layout (header + footer)
│   │   ├── layout.tsx           # Main layout with Header + Footer
│   │   ├── page.tsx             # Landing page (logged-out) or dashboard (logged-in)
│   │   └── dashboard/
│   │       └── page.tsx         # Protected dashboard shell
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts     # Better Auth handler
│   ├── layout.tsx               # Root layout: fonts, providers
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui generated components
│   ├── auth/                    # Auth-specific components (SignInForm, SignUpForm)
│   ├── layout/                  # Header, Footer, Nav
│   └── dashboard/               # Dashboard shell, empty states
├── lib/
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth client config
│   ├── prisma.ts                # Prisma singleton client
│   └── validations/
│       └── auth.ts              # Zod schemas for sign-in/sign-up
├── emails/                      # React Email templates
│   ├── verification.tsx
│   └── welcome.tsx
└── types/
    └── index.ts                 # Shared TypeScript types
prisma/
├── schema.prisma
├── prisma.config.ts             # Prisma 7 config (datasource URL, migrations path)
├── migrations/
└── seed.ts
proxy.ts                         # Next.js 16 proxy (renamed from middleware.ts)
next.config.ts
```

### Pattern 1: Better Auth Server Configuration
**What:** Centralized auth config used by both API route handler and server components
**When to use:** Always — this is the only auth instance on the server
**Example:**
```typescript
// src/lib/auth.ts
// Source: https://www.better-auth.com/docs/adapters/prisma + https://www.better-auth.com/docs/authentication/email-password
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // send via Resend
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // send via Resend
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
```

### Pattern 2: Better Auth Client Configuration
**What:** Client-side auth hooks — used in Client Components only
**When to use:** `useSession()`, `signIn()`, `signOut()` in client components
**Example:**
```typescript
// src/lib/auth-client.ts
// Source: https://www.better-auth.com/docs/basic-usage
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
```

### Pattern 3: Next.js 16 Proxy (Route Protection)
**What:** Lightweight cookie-based session check at the proxy layer
**When to use:** Redirect unauthenticated users from protected routes before they reach the server
**Example:**
```typescript
// proxy.ts (root of project — NOT src/)
// Source: https://www.better-auth.com/docs/integrations/next
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Pattern 4: Server Component Session Check (Defense in Depth)
**What:** Verify session server-side in protected page components — never trust proxy alone
**When to use:** All protected pages; CVE-2025-29927 demonstrated middleware alone is insufficient
**Example:**
```typescript
// app/(main)/dashboard/page.tsx
// Source: https://www.better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  return <h1>Welcome, {session.user.name}</h1>;
}
```

### Pattern 5: Prisma 7 Singleton with Driver Adapter
**What:** Single PrismaClient instance with PostgreSQL driver adapter to prevent connection leaks
**When to use:** Always — this is the standard pattern for Next.js + Prisma 7
**Example:**
```typescript
// src/lib/prisma.ts
// Source: https://www.prisma.io/docs/guides/betterauth-nextjs
import { PrismaClient } from "@/generated/prisma"; // output path from schema
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

### Pattern 6: Prisma 7 Config File
**What:** Replaces datasource URL in schema.prisma; required in Prisma 7
**When to use:** Always with Prisma 7 — datasource URL is no longer in schema.prisma
**Example:**
```typescript
// prisma/prisma.config.ts
// Source: https://www.prisma.io/docs/guides/betterauth-nextjs
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Pattern 7: Sign-Up Server Action with Better Auth
**What:** Server-side form handling calling Better Auth sign-up
**When to use:** Sign-up form submission
**Example:**
```typescript
// src/app/(auth)/sign-up/actions.ts
"use server";
import { signUpSchema } from "@/lib/validations/auth";

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please check your input." };

  // Note: Better Auth sign-up is called from the client via authClient.signUp.email()
  // Server actions handle validation; actual auth call is client-side
}
```

### Pattern 8: Next.js 16 Font Setup (Academic)
**What:** Load Lora (serif headings) + Inter (sans-serif body) via next/font/google
**When to use:** Root layout — applied as CSS variables for use in Tailwind
**Example:**
```typescript
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Lora, Inter } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### Anti-Patterns to Avoid
- **Session check in proxy only:** CVE-2025-29927 proved middleware/proxy can be bypassed via `x-middleware-subrequest` header. Always validate sessions in Server Components too. Use next@>=15.2.3 or >=16.x (already patched).
- **Creating PrismaClient per request:** In Prisma 7 with Next.js, instantiating a new client per hot-reload destroys the connection pool. Use the globalThis singleton pattern.
- **Awaiting email sends in auth callbacks:** Creates timing attack vectors. Use `void sendEmail(...)` without await.
- **Importing `better-auth/react` in Server Components:** The client package uses browser APIs. Only import in `"use client"` components or Client Components.
- **Storing `DATABASE_URL` in `schema.prisma`:** Prisma 7 moved this to `prisma.config.ts`. Setting it in schema will cause validation errors.
- **Using `middleware.ts` + `export function middleware`:** Deprecated in Next.js 16. Rename to `proxy.ts` + `export function proxy`. Edge runtime is not supported in proxy; use Node.js.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt implementation | Better Auth built-in (scrypt) | scrypt is memory-hard; Better Auth handles salt, timing attacks, and upgrade paths automatically |
| Session management | Custom JWT or cookie logic | Better Auth sessions | Secure cookie attributes, CSRF protection, session rotation, device tracking |
| Email verification flow | Custom token generation + expiry | Better Auth `emailVerification` plugin | Token generation, expiry, link construction, re-send throttling handled |
| OAuth PKCE flow | Custom Google OAuth implementation | Better Auth `socialProviders.google` | PKCE, state parameter, token exchange — all handled; easy misconfiguration in custom code |
| Form validation | Manual field checking | Zod + react-hook-form + shadcn Form | Schema validation, error messages, field registration — all wired |
| Database migrations | Raw SQL | Prisma migrate | Prisma tracks migration history, handles rollbacks, enforces schema |
| Email sending | SMTP server | Resend SDK | No server to maintain; React Email templates; generous free tier; reliable delivery |
| Route protection | Custom session cookie parse | `getSessionCookie` from `better-auth/cookies` | Handles cookie naming, signing, expiry checks correctly |

**Key insight:** Authentication has dozens of subtle security requirements (timing attacks, session fixation, CSRF, token entropy). Every component of auth that you build yourself is a liability. Better Auth covers all of these by design.

---

## Common Pitfalls

### Pitfall 1: Next.js 16 Breaking Changes Bite New Projects
**What goes wrong:** Setting up Auth.js (NextAuth) v5 with Next.js 16 fails with peer dependency errors (`next@"^12.2.5 || ^13 || ^14 || ^15"` — v16 excluded).
**Why it happens:** Auth.js v5 peer deps haven't been updated to include Next.js 16. Workarounds (`--force`, `--legacy-peer-deps`, `overrides`) exist but are fragile.
**How to avoid:** Use Better Auth instead. The Auth.js team themselves recommend it for new projects.
**Warning signs:** `npm install next-auth` reports peer dependency conflict with `next@16.x`.

### Pitfall 2: `middleware.ts` vs `proxy.ts` in Next.js 16
**What goes wrong:** Route protection silently stops working; proxy file is ignored.
**Why it happens:** Next.js 16 renamed `middleware.ts` → `proxy.ts` and the export from `middleware` → `proxy`. Old filenames still work temporarily (deprecated) but will break.
**How to avoid:** Create `proxy.ts` at project root (not inside `src/`) with `export function proxy(request)`.
**Warning signs:** Protected routes accessible without session; no redirect happening.

### Pitfall 3: Prisma 7 Driver Adapter Required
**What goes wrong:** `new PrismaClient()` without an adapter fails or warns; connection issues in serverless.
**Why it happens:** Prisma 7 uses a TypeScript-based client that requires an explicit Driver Adapter to connect to the database.
**How to avoid:** Always instantiate with `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
**Warning signs:** `Error: PrismaClient is not configured with a database URL` or `Adapter is required`.

### Pitfall 4: Prisma Client Output Path
**What goes wrong:** `import { PrismaClient } from "@prisma/client"` fails or imports stale types.
**Why it happens:** Prisma 7 generates client to project source (e.g., `src/generated/prisma/`) not `node_modules`. Import path must match the `output` field in `schema.prisma`.
**How to avoid:** Set `output = "../src/generated/prisma"` in schema generator; import from that path.
**Warning signs:** TypeScript errors on model types; stale schema after `prisma generate`.

### Pitfall 5: Better Auth Client Used in Server Components
**What goes wrong:** Runtime error: "window is not defined" or React hooks error.
**Why it happens:** `better-auth/react` uses browser APIs and React hooks; cannot run on server.
**How to avoid:** Use `auth.api.getSession({ headers: await headers() })` in Server Components; use `useSession()` hook only in `"use client"` components.
**Warning signs:** Hydration errors, RSC console errors about browser APIs.

### Pitfall 6: Email Verification + Google OAuth Account Linking
**What goes wrong:** User who signs up via Google and later tries email+password login gets confused state. Or email verification required even for Google-verified emails.
**Why it happens:** Better Auth tracks email verification separately from OAuth; Google-authenticated users have `emailVerified: true` automatically; credential users need explicit verification.
**How to avoid:** Google OAuth users are auto-verified (Google guarantees email ownership). Credential-only users must verify. Better Auth handles this distinction automatically when both providers are configured.
**Warning signs:** Google users blocked by email verification gate.

### Pitfall 7: Async Request APIs in Next.js 16
**What goes wrong:** `cookies()` returns a Promise, not the cookie store — destructuring `{ get }` from it fails.
**Why it happens:** Next.js 16 fully removed synchronous access (Next.js 15 had deprecation warnings).
**How to avoid:** Always `await cookies()`, `await headers()`, `await params`.
**Warning signs:** TypeScript errors like "Property 'get' does not exist on type 'Promise'".

### Pitfall 8: Database Connection Leaks from Multiple PrismaClient Instances
**What goes wrong:** "Too many connections" errors in development after repeated hot reloads.
**Why it happens:** Each hot reload module re-evaluation creates a new PrismaClient; old connections hang.
**How to avoid:** Use the globalThis singleton pattern (`globalForPrisma.prisma`).
**Warning signs:** PostgreSQL error: `remaining connection slots are reserved for non-replication superuser connections`.

### Pitfall 9: shadcn/ui CLI Validation Fails with Tailwind v4
**What goes wrong:** `npx shadcn@latest init` reports Tailwind CSS is not installed/configured.
**Why it happens:** shadcn CLI checks for `tailwind.config.js` which doesn't exist in Tailwind v4 (config moved to CSS via `@theme`).
**How to avoid:** Use `npx shadcn@canary init` (canary CLI) for Tailwind v4 projects. The stable CLI targets v3.
**Warning signs:** `shadcn init` fails with "Could not find Tailwind CSS config".

---

## Code Examples

Verified patterns from official sources:

### Better Auth API Route Handler
```typescript
// src/app/api/auth/[...all]/route.ts
// Source: https://www.prisma.io/docs/guides/betterauth-nextjs
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Better Auth Sign-Up (Client Component)
```typescript
// Source: https://www.better-auth.com/docs/authentication/email-password
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signUp.email({
  name: "Jane Smith",
  email: "jane@example.com",
  password: "password1234",
  callbackURL: "/dashboard",
});
```

### Better Auth Sign-In (Client Component)
```typescript
// Source: https://www.better-auth.com/docs/authentication/email-password
const { data, error } = await authClient.signIn.email({
  email: "jane@example.com",
  password: "password1234",
  rememberMe: true,
});

// Error handling (for friendly messages)
if (error?.status === 401) {
  setError("That password doesn't look right. Try again or reset it.");
} else if (error?.status === 403) {
  setError("Please verify your email first. Check your inbox.");
}
```

### Better Auth Google OAuth Sign-In (Client Component)
```typescript
// Source: https://www.better-auth.com/docs/authentication/google
import { authClient } from "@/lib/auth-client";

await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});
```

### Resend + React Email Verification Email
```typescript
// src/emails/verification.tsx
// Source: https://resend.com/docs/send-with-nextjs
import { Html, Button, Text, Heading } from "@react-email/components";

export function VerificationEmail({ url, name }: { url: string; name: string }) {
  return (
    <Html>
      <Heading>Verify your ScienceOne account</Heading>
      <Text>Hi {name}, please verify your email address to get started.</Text>
      <Button href={url}>Verify Email Address</Button>
    </Html>
  );
}

// Usage in auth.ts emailVerification callback:
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

sendVerificationEmail: async ({ user, url }) => {
  void resend.emails.send({
    from: "ScienceOne <noreply@yourdomain.com>",
    to: user.email,
    subject: "Verify your ScienceOne account",
    react: VerificationEmail({ url, name: user.name ?? "there" }),
  });
},
```

### Prisma 7 Schema Structure (Better Auth tables + custom)
```prisma
// prisma/schema.prisma
// Better Auth tables generated by: npx @better-auth/cli generate
// Then add custom domain models below

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

// datasource block has NO url field in Prisma 7 — url is in prisma.config.ts
datasource db {
  provider = "postgresql"
}

// ---- Better Auth generated tables (via `npx @better-auth/cli generate`) ----
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  role          String    @default("user")   // "user" | "admin" — custom addition
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  purchases     Purchase[]

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  idToken               String?   @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   @db.Text  // hashed; for credential provider
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}

// ---- Custom domain tables ----
model Book {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  authorName  String
  authorBio   String?    @db.Text
  authorImage String?
  synopsis    String?    @db.Text
  coverImage  String?
  isbn        String?    @unique
  pageCount   Int?
  dimensions  String?
  printLink   String?
  isPublished Boolean    @default(false)
  isOpenAccess Boolean   @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  chapters    Chapter[]
  pricing     BookPrice?
  purchases   Purchase[]
  categories  BookCategory[]

  @@map("books")
}

model BookPrice {
  id        String   @id @default(cuid())
  bookId    String   @unique
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  amount    Decimal  @db.Decimal(10, 2)  // in USD
  currency  String   @default("USD")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("book_prices")
}

model Chapter {
  id          String   @id @default(cuid())
  bookId      String
  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  title       String
  slug        String
  position    Int
  content     String?  @db.Text  // pre-rendered HTML with KaTeX
  isFreePreview Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([bookId, slug])
  @@unique([bookId, position])
  @@map("chapters")
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  books BookCategory[]

  @@map("categories")
}

model BookCategory {
  bookId     String
  categoryId String
  book       Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([bookId, categoryId])
  @@map("book_categories")
}

model Purchase {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  bookId          String
  book            Book     @relation(fields: [bookId], references: [id], onDelete: Restrict)
  stripePaymentId String?  @unique
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  status          String   @default("completed")  // "pending" | "completed" | "refunded"
  createdAt       DateTime @default(now())

  @@unique([userId, bookId])  // one purchase per user per book
  @@map("purchases")
}

model Download {
  id          String   @id @default(cuid())
  userId      String
  bookId      String
  format      String   // "pdf" | "epub"
  downloadedAt DateTime @default(now())

  @@map("downloads")
}

model ReadingProgress {
  id           String   @id @default(cuid())
  userId       String
  bookId       String
  chapterId    String
  scrollPercent Int     @default(0)
  updatedAt    DateTime @updatedAt

  @@unique([userId, bookId])
  @@map("reading_progress")
}
```

### Next.js 16 Font Setup (Academic Aesthetic)
```typescript
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Lora, Inter } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body className="font-sans bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

### Tailwind v4 Theme Extension for Academic Colors
```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --color-primary: oklch(30% 0.15 250);     /* Navy/deep blue */
  --color-primary-foreground: oklch(98% 0 0);
  --font-serif: var(--font-serif);           /* from next/font CSS variable */
  --font-sans: var(--font-sans);
}
```

### shadcn Form Pattern (Sign-Up)
```typescript
// src/components/auth/SignUpForm.tsx
// Source: https://ui.shadcn.com/docs/forms/react-hook-form
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpValues) {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });
    if (error) {
      form.setError("root", { message: getReadableError(error) });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* email + password fields same pattern */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Open Questions

1. **Resend Domain Verification for Verification Emails**
   - What we know: Resend requires a verified domain for production sending; `onboarding@resend.dev` works for testing
   - What's unclear: Whether the project has a domain ready; development can proceed with Resend test mode
   - Recommendation: Use Resend test mode for Phase 1 development; note that production email requires domain verification in Resend dashboard

2. **PostgreSQL Host for Development**
   - What we know: Prisma 7 requires a PostgreSQL connection string; local Docker or cloud options both work
   - What's unclear: Whether to recommend local Docker or a hosted dev database (Neon, Supabase free tier)
   - Recommendation: Document both options in setup; `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16` for local, or Neon free tier for zero-setup

3. **Better Auth Schema Generation vs Manual**
   - What we know: `npx @better-auth/cli generate` creates the auth tables; manual editing is also supported
   - What's unclear: Whether the CLI correctly handles custom additions to the User model (e.g., `role` field)
   - Recommendation: Run CLI to generate base tables, then manually add custom fields (role, etc.) and custom models (Book, Chapter, etc.) to the same schema file before running `prisma migrate dev`

4. **shadcn/ui canary CLI vs stable for Tailwind v4**
   - What we know: Tailwind v4 requires `npx shadcn@canary init`; stable CLI fails validation for v4
   - What's unclear: Whether canary CLI is stable enough for production use
   - Recommendation: Use `npx shadcn@canary init` — this is the official path documented by shadcn; the canary label refers to the CLI release, not the components

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — Breaking changes: proxy rename, async APIs, Turbopack default
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) — App Router folder conventions, route groups, colocation
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — `next/font/google` API, CSS variables
- [Better Auth Prisma Adapter](https://www.better-auth.com/docs/adapters/prisma) — Schema generation, adapter config
- [Better Auth Email/Password](https://www.better-auth.com/docs/authentication/email-password) — Full auth config, sign-up/sign-in, email verification
- [Better Auth Google OAuth](https://www.better-auth.com/docs/authentication/google) — Provider config, env vars, client sign-in
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next) — Proxy pattern for Next.js 16, session handling
- [Auth.js joins Better Auth announcement](https://www.better-auth.com/blog/authjs-joins-better-auth) — Confirmed recommendation for new projects
- [Prisma Guide: Better Auth + Next.js](https://www.prisma.io/docs/guides/betterauth-nextjs) — Official Prisma + Better Auth integration guide
- [Prisma 7 Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Architecture changes, Driver Adapters, config file
- [Prisma Next.js Help](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help) — Singleton pattern
- [shadcn/ui Tailwind v4 Support](https://ui.shadcn.com/docs/tailwind-v4) — Official v4 status, canary CLI
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) — Init command, component adding
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs) — SDK usage, React Email integration
- [Auth.js Credentials Docs](https://authjs.dev/getting-started/authentication/credentials) — Credentials pattern (for reference only; not recommended for new projects)

### Secondary (MEDIUM confidence)
- [NextAuth Next.js 16 Compatibility Issue #13302](https://github.com/nextauthjs/next-auth/issues/13302) — Confirmed peer dep conflict, unresolved as of Oct 2025
- CVE-2025-29927 security advisory — Middleware bypass; fixed in >=15.2.3, all 16.x; defense-in-depth pattern confirmed
- Multiple community guides on Next.js 15/16 + shadcn/ui + Tailwind v4 setup (Medium, buildwithmatija.com)

### Tertiary (LOW confidence — for awareness only)
- Prisma 7 performance claims: Prisma official blog states 3x improvement; some community GitHub issues dispute this for specific workloads. **Not relevant to Phase 1 planning** — any performance difference is negligible at this scale.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs and current GitHub issues
- Architecture: HIGH — patterns taken directly from official Next.js and Better Auth documentation
- Pitfalls: HIGH — CVE-2025-29927 is documented security advisory; peer dep issue confirmed via GitHub; async API removal confirmed in Next.js 16 changelog
- Schema design: MEDIUM — Better Auth schema from CLI docs (HIGH); custom domain schema is design recommendation based on requirements (needs validation against future phase needs)

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days — stack is moving but core APIs are stable)
