# Phase 11: Resource Admin - Research

**Researched:** 2026-02-22
**Domain:** Resource admin CRUD — Next.js Server Actions, R2 presigned uploads, React Hook Form, TanStack Table
**Confidence:** HIGH — all code examined directly; no external library research needed (stack is locked)

## Summary

Phase 11 is a verification and bug-fix phase, not greenfield. All the structural code exists: admin listing page, create dialog, edit form with tabs (details, content, publishing, simulation), file upload components, server actions for CRUD, and table columns with publish toggle and delete. TypeScript compiles cleanly with zero errors.

However, several concrete bugs were found that prevent the success criteria from being met. The most critical is the cover image upload path: `ResourceEditForm` passes `bookId={resource.id}` and `type="cover"` to `ImageUploadField`, which then POSTs to `/api/admin/upload-url` with those values — causing the API to store the image under `images/{id}/cover-{ts}.ext` instead of the correct `images/resources/{id}/cover-{ts}.ext`. A second critical issue is that `coverImage` stores the raw R2 key (e.g., `images/abc/cover-123.jpg`) but `ResourceCard` and `BookCoverImage` render it directly as an `<img src>` — which only works if the R2 bucket is public or a public base URL is prepended. No `NEXT_PUBLIC_R2_PUBLIC_URL` env var exists. Additionally, publish/unpublish and delete actions in the table fire server actions with no `useTransition`, no toast, and no error handling — meaning failures are silent.

**Primary recommendation:** Fix the four confirmed bugs (cover upload path, R2 public URL missing, silent failures in table actions, SubjectSelect create-subject UI should be removed since subjects are now fixed) and verify all five success criteria with Rodney. No new components need to be written from scratch.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RES-01 | Admin can create, edit, and delete resources with type, level, and subject metadata | `createResource`, `updateResource`, `deleteResource` server actions exist; `CreateResourceDialog`, `ResourceEditForm`, `ResourceTableColumns` components exist; Zod schema validates all fields |
| RES-02 | Admin can upload resource files and cover images to R2 | `FileUploadField` and `ImageUploadField` components exist; `/api/admin/upload-url` route handles `resource-cover` and `resource-file` types; BUG: `ResourceEditForm` sends wrong type/ID for cover image |
</phase_requirements>

## Standard Stack

All dependencies are already installed. No new packages needed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.71.1 | Form state management | Used throughout admin forms |
| @hookform/resolvers | 5.2.2 | Zod integration with RHF | Matches existing pattern |
| zod | 4.3.6 | Schema validation | Used in all admin schemas |
| @tanstack/react-table | 8.21.3 | Admin table with sorting | Used in BookTable, ResourceTable |
| sonner | 2.0.7 | Toast notifications | Used in `ResourceEditForm.onSubmit` |
| @aws-sdk/client-s3 + presigner | 3.992.x | R2 presigned URLs | Used in upload-url route |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `useTransition` (React built-in) | Non-blocking server action calls with pending state | All table action buttons (toggle publish, delete) |
| `revalidatePath` (Next.js) | Invalidate cached pages after mutations | Already used in all server actions |

## Architecture Patterns

### Existing Project Structure (what exists)
```
src/
├── app/(admin)/admin/resources/
│   ├── page.tsx                    # Listing page (server component) — COMPLETE
│   └── [resourceId]/page.tsx       # Edit page (server component) — COMPLETE
├── components/admin/
│   ├── ResourceTable.tsx           # TanStack table wrapper — COMPLETE
│   ├── ResourceTableColumns.tsx    # Column defs + actions — BUG: no error handling
│   ├── ResourceEditForm.tsx        # tabbed edit form — BUG: wrong upload type
│   ├── CreateResourceDialog.tsx    # Create dialog — COMPLETE
│   ├── FileUploadField.tsx         # File upload with XHR progress — COMPLETE
│   ├── ImageUploadField.tsx        # Image upload with preview — INCOMPLETE (no resourceId prop)
│   └── SubjectSelect.tsx           # Subject multi-select — OVER-ENGINEERED (has create UI)
├── lib/
│   ├── resource-admin-queries.ts   # getAllResourcesAdmin, getResourceAdmin, getAllSubjects — COMPLETE
│   ├── resource-admin-actions.ts   # createResource, updateResource, deleteResource, togglePublishResource — MOSTLY COMPLETE
│   ├── resource-admin-schemas.ts   # resourceUpdateSchema (Zod 4) — COMPLETE
│   └── simulation-registry.ts     # SIMULATION_KEYS, SIMULATION_REGISTRY (React.lazy) — SERVER ISSUE
└── simulations/
    ├── ProjectileMotion.tsx        # "use client" canvas simulation
    ├── WaveInterference.tsx
    └── SpringMass.tsx
```

### Pattern 1: Server Action with useTransition + toast
**What:** Client component calls a "use server" action inside `startTransition` for non-blocking pending state, wraps in try/catch, shows toast on success/error.
**When to use:** Any action button that must give user feedback (publish, delete, save).
**Example (from ResourceEditForm — the correct pattern):**
```typescript
// Source: /src/components/admin/ResourceEditForm.tsx (existing)
const [isPending, startTransition] = useTransition();

function onSubmit(data: ResourceUpdateData) {
  startTransition(async () => {
    try {
      await updateResource(resource.id, data);
      toast.success("Resource saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save resource");
    }
  });
}
```

**What to apply this to:** `ResourceTableColumns` — the `togglePublishResource` and `deleteResource` calls currently lack this pattern (fire-and-forget).

### Pattern 2: Presigned Upload Flow
**What:** Client gets a presigned PUT URL from `/api/admin/upload-url`, uploads directly to R2 via XHR (for progress), then stores the returned `r2Key` in form state.
**Example (from FileUploadField — working correctly):**
```typescript
// Source: /src/components/admin/FileUploadField.tsx (existing)
const res = await fetch("/api/admin/upload-url", {
  method: "POST",
  body: JSON.stringify({ resourceId, fileName: file.name, type: "resource-file" }),
});
const { uploadUrl, r2Key } = await res.json();
// XHR PUT to uploadUrl ...
onUpload(r2Key, file.name);
```

**Bug in ResourceEditForm:** It passes `bookId={resource.id}` and `type="cover"` to `ImageUploadField`. Fix: `ImageUploadField` needs a `resourceId` prop and `type="resource-cover"` variant, OR create a dedicated `ResourceImageUploadField` wrapper.

### Pattern 3: Simulation Registry — Keys vs Registry
**What:** `SIMULATION_KEYS` (array of strings) is safe to import in server components. `SIMULATION_REGISTRY` (React.lazy map) must only be used in `"use client"` components.
**Issue:** The STATE.md CRITICAL note about React.lazy causing server errors refers to rendering simulations on public pages (Phase 13), NOT to importing `SIMULATION_KEYS` in server components. Importing `SIMULATION_KEYS` in the admin edit server component is safe — it only reads `Object.keys()`, no rendering occurs.
**Fix for admin phase:** No change needed for `SIMULATION_KEYS` import. The simulation public page fix is deferred to Phase 13.

### Anti-Patterns to Avoid
- **Fire-and-forget server actions:** `onClick={() => serverAction()}` with no error handling — silent failures when DB or auth errors occur
- **Using `bookId` prop for resources in `ImageUploadField`:** Causes wrong R2 key path (`images/{id}/...` instead of `images/resources/{id}/...`)
- **Storing R2 keys as image src:** `coverImage` field must store a full public URL, not a bare R2 key, for `<img src>` to work
- **Allowing new subject creation:** Subjects are fixed at 4 (Phase 10-01 decision) — the "Add subject" UI in `SubjectSelect` should be removed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload progress | Custom progress tracker | Existing `FileUploadField` XHR pattern | Already implemented |
| Form validation | Manual field validation | Existing Zod + RHF pattern | Already wired |
| Table sorting | Custom sort logic | TanStack `getSortedRowModel()` | Already in `ResourceTable` |
| Auth checks | Manual session parsing | `requireAdmin()` in server actions | Already exists in actions |

## Common Pitfalls

### Pitfall 1: Cover Image Upload — Wrong Upload Type
**What goes wrong:** `ResourceEditForm` passes `type="cover"` to `ImageUploadField`, so the upload-url API generates an R2 key of `images/{resourceId}/cover-{ts}.ext` instead of `images/resources/{resourceId}/cover-{ts}.ext`. The resource-cover path is already supported by the API — it's just not being used.
**Why it happens:** `ImageUploadField` was originally built for books (`bookId` + `type="cover"`). It was reused for resources without updating the props.
**How to avoid:** `ImageUploadField` needs to accept a `resourceId` prop and pass `type="resource-cover"` to the API. Options:
  - A) Add `resourceId?: string` prop and `uploadType` prop to `ImageUploadField`, use whichever is set
  - B) Create a thin wrapper `ResourceImageUploadField` that passes the right props
**Warning signs:** Cover image stored under `images/{uuid}/cover-*.jpg` (not `images/resources/{uuid}/...`)

### Pitfall 2: R2 Key Stored Instead of Public URL
**What goes wrong:** `ResourceEditForm` calls `setValue("coverImage", r2Key)` where `r2Key = "images/resources/abc/cover-123.jpg"`. `ResourceCard` renders `<img src={resource.coverImage} />`. A bare R2 key is NOT a valid URL — browsers will fail to load the image.
**Why it happens:** The presigned upload architecture is correct (upload PUT → store key), but the display side needs a base public URL. No `NEXT_PUBLIC_R2_PUBLIC_URL` env var exists.
**How to avoid:**
  - Cloudflare R2 buckets can have a public URL (the `r2.dev` subdomain or a custom domain). The admin upload flow should store the full public URL: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${r2Key}`.
  - OR: the upload-url route should return `publicUrl` in addition to `r2Key`, and forms should store `publicUrl`.
  - Verify this with existing book cover images — if books currently display covers correctly, the same mechanism applies to resources.
**Warning signs:** Images not loading after upload; browser console showing 404 on img src containing just a path fragment.

### Pitfall 3: Silent Action Failures in Table
**What goes wrong:** `ResourceTableColumns` calls `togglePublishResource(id, publish)` and `deleteResource(id)` inside `onClick` handlers with no `await`, no `startTransition`, no try/catch, and no toast. If the server action throws (DB error, auth error), the UI shows no feedback.
**Why it happens:** The table column cell render function can't use hooks directly (it's not a component function). The fix requires extracting the row actions into a separate `"use client"` component that CAN use hooks.
**How to avoid:** Extract the actions cell into `ResourceRowActions` component that uses `useTransition` + `toast`.
**Warning signs:** Publish toggle appears to do nothing (spinner never shows, table doesn't refresh, no error shown)

### Pitfall 4: SubjectSelect Create-Subject UI vs Fixed Subjects
**What goes wrong:** `SubjectSelect` allows admins to create new subjects inline. Phase 10-01 fixed subjects to exactly 4 (Physics, Mathematics, Chemistry, Computer Science). Allowing creation defeats the curation goal.
**Why it happens:** The SubjectSelect was designed generically before the decision to fix subjects.
**How to avoid:** Remove the `newSubjectName` input and "Add" button from `SubjectSelect`. Only show the existing badge-based multi-select.
**Warning signs:** Admin creates a 5th subject named "physics" (lowercase), causing duplicate-subject confusion

### Pitfall 5: isPublished Not in Edit Form
**What goes wrong:** `resourceUpdateSchema` does NOT include `isPublished`. The only way to publish/unpublish is via the table dropdown — there is no publish toggle on the edit form itself. The success criterion says "Admin can toggle publish/unpublish and see status change reflected immediately in the table" — this is achievable via the table dropdown alone, but requires feedback (see Pitfall 3).
**Note:** This matches the existing book edit form pattern — books also publish/unpublish only from the table, not the edit form. So this is intentional design, not a bug. No change needed.

## Code Examples

Verified patterns from existing codebase:

### Correct Server Action Pattern with Error Handling
```typescript
// Source: /src/components/admin/ResourceEditForm.tsx (existing — correct pattern to replicate)
"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { togglePublishResource } from "@/lib/resource-admin-actions";

// In a component (not inside ColumnDef cell render):
export function ResourceRowActions({ resource }: { resource: ResourceAdminRow }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      try {
        await togglePublishResource(resource.id, !resource.isPublished);
        toast.success(resource.isPublished ? "Resource unpublished" : "Resource published");
      } catch {
        toast.error("Failed to update publish status");
      }
    });
  }
  // ... render DropdownMenuItem with onClick={handleTogglePublish} disabled={isPending}
}
```

### Fixed ImageUploadField Props for Resource Cover
```typescript
// Source: /src/components/admin/ResourceEditForm.tsx (what it SHOULD be)
<ImageUploadField
  label="Cover Image"
  currentUrl={field.value ?? null}
  resourceId={resource.id}       // was: bookId={resource.id}
  type="resource-cover"          // was: type="cover"
  onUpload={(url) => setValue("coverImage", url, { shouldDirty: true })}
/>
```

### Safe SIMULATION_KEYS Import Pattern
```typescript
// Source: /src/app/(admin)/admin/resources/[resourceId]/page.tsx (existing — already correct)
// SIMULATION_KEYS is just Object.keys(SIMULATION_REGISTRY) — safe in server components
import { SIMULATION_KEYS } from "@/lib/simulation-registry";
// ...
<ResourceEditForm simulationKeys={SIMULATION_KEYS} />
// This is fine because we never render any lazy component server-side here
```

### Simulation Upsert in updateResource
```typescript
// Source: /src/lib/resource-admin-actions.ts (existing — correct pattern)
// When type === "SIMULATION" && componentKey is set:
await prisma.simulation.upsert({
  where: { resourceId },
  create: { resourceId, componentKey, teacherGuide, parameterDocs },
  update: { componentKey, teacherGuide, parameterDocs },
});
// When type changes away from SIMULATION:
await prisma.simulation.deleteMany({ where: { resourceId } });
```

## Bugs Found (Ordered by Impact)

These are confirmed bugs discovered by reading the actual code:

| # | Bug | File | Severity | Fix |
|---|-----|------|----------|-----|
| 1 | `ImageUploadField` receives `bookId` + `type="cover"` instead of `resourceId` + `type="resource-cover"` | `ResourceEditForm.tsx:209` | HIGH — cover images upload to wrong R2 path | Add `resourceId` prop to `ImageUploadField` or create wrapper |
| 2 | `coverImage` stores R2 key but `<img src>` needs full public URL | `ResourceEditForm.tsx:211`, `ResourceCard.tsx:54` | HIGH — images won't display after upload (unless bucket has known public URL) | Store full URL: prepend `NEXT_PUBLIC_R2_PUBLIC_URL` to r2Key |
| 3 | `togglePublishResource` and `deleteResource` called fire-and-forget in table — no error handling | `ResourceTableColumns.tsx:145,169` | HIGH — silent failures violate phase goal | Extract to `ResourceRowActions` component with `useTransition` + toast |
| 4 | `SubjectSelect` has create-subject UI but subjects are fixed at 4 | `SubjectSelect.tsx` | MEDIUM — UX mismatch with Phase 10-01 decision | Remove create-subject input/button from SubjectSelect |
| 5 | `updateResource` has duplicate `revalidatePath("/admin/resources")` call | `resource-admin-actions.ts:107-108` | LOW — harmless but sloppy | Remove one duplicate |

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Client-side `fetch` for mutations | Next.js Server Actions with `"use server"` | Server actions already used throughout — maintain consistency |
| Global Zod object schema | Zod 4 with `z.union` for NaN-to-null coercion (v1.0 decision) | `resourceUpdateSchema` already uses this pattern for `price` field |

## Open Questions

1. **R2 Public URL for cover images**
   - What we know: `coverImage` field receives r2Key from upload; `ResourceCard` renders `src={coverImage}`; no `NEXT_PUBLIC_R2_PUBLIC_URL` env var exists; book cover images use same pattern
   - What's unclear: How do existing book cover images display correctly? Is the R2 bucket `scienceone` configured with public access and a custom domain/r2.dev URL that the developer knows and uses manually?
   - Recommendation: Before fixing, verify how books currently display cover images. If it works (dev has private knowledge of the public URL), add `NEXT_PUBLIC_R2_PUBLIC_URL` to `.env.example` and update the upload flow to prepend it. If books also don't work, this is a known deferred issue.

2. **React.lazy in simulation-registry.ts and server components**
   - What we know: `SIMULATION_KEYS` import in admin server component is safe (only reads `Object.keys`, no rendering). STATE.md CRITICAL note refers to simulation *rendering* on public pages, not this import.
   - What's unclear: Whether any admin page accidentally imports and *renders* `SIMULATION_REGISTRY` entries server-side.
   - Recommendation: No action needed in Phase 11 for admin. The simulation registry render fix is Phase 13 scope.

## Sources

### Primary (HIGH confidence)
All findings are from direct code inspection of the repository. No external library research needed — the stack is stable and entirely the same as v1.0.

- `/src/components/admin/ResourceEditForm.tsx` — bug at line 209 (bookId/type), correct pattern for onSubmit
- `/src/components/admin/ResourceTableColumns.tsx` — bug at line 145,169 (fire-and-forget)
- `/src/app/api/admin/upload-url/route.ts` — confirms `resource-cover` type is supported
- `/src/lib/resource-admin-actions.ts` — all CRUD actions confirmed complete
- `/src/lib/resource-admin-schemas.ts` — Zod 4 schema confirmed, `isPublished` not included (intentional)
- `/src/lib/simulation-registry.ts` — confirms React.lazy at module level, SIMULATION_KEYS safe to export
- `/prisma/schema.prisma` — Resource, Simulation, Subject, ResourcePrice models confirmed
- `/Users/roh/GClaude/.planning/STATE.md` — CRITICAL blockers noted

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH — read actual code, not speculation
- Fix patterns: HIGH — copy from working patterns in same codebase (BookEditForm, ResourceEditForm.onSubmit)
- R2 public URL question: LOW — unclear without runtime verification (deferred as open question)
- Simulation registry safety: MEDIUM — React.lazy module-level import behavior in Node.js server is nuanced; erring on side of caution

**Research date:** 2026-02-22
**Valid until:** Until code changes — all findings based on current file state
