---
phase: 02-ingest
plan: "01"
subsystem: infra
tags: [pandoc, katex, cheerio, latex, epub, pdf, prisma, aws-s3, r2]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema with Book model and database infrastructure
provides:
  - scripts/lib/pandoc.ts — async Pandoc CLI wrapper supporting LaTeX/docx/markdown to HTML, PDF, EPUB
  - scripts/lib/katex-render.ts — server-side KaTeX pre-rendering of inline and display math spans
  - scripts/lib/chapter-split.ts — HTML chapter splitter by h1 headings with slug and position
  - scripts/lib/health-report.ts — structured pipeline health report with chalk-colored output
  - prisma/schema.prisma Book.pdfKey and Book.epubKey fields for R2 storage references
  - Migration 20260218144600_add_book_artifact_keys
affects: [02-ingest, 03-catalog, 04-reader]

# Tech tracking
tech-stack:
  added: [pandoc 3.9, katex 0.16.28, cheerio 1.2.0, commander 14.0.3, "@aws-sdk/client-s3", "@aws-sdk/lib-storage", "@aws-sdk/s3-request-presigner", chalk 5.6.2, "@types/katex"]
  patterns:
    - Pandoc spawned via child_process.spawn with array args (never shell interpolation) and cwd set to file's directory for LaTeX relative import resolution
    - KaTeX renderToString with throwOnError:true captures errors into a mutable errors[] array while replacing broken spans with math-error fallbacks
    - Chapter splitting uses cheerio DOM traversal collecting h1+siblings until next h1
    - Health report halts pipeline (halted=true) when mathErrors.length > 0 or unsupportedCommands.length > 0

key-files:
  created:
    - scripts/lib/pandoc.ts
    - scripts/lib/katex-render.ts
    - scripts/lib/chapter-split.ts
    - scripts/lib/health-report.ts
    - prisma/migrations/20260218144600_add_book_artifact_keys/migration.sql
  modified:
    - prisma/schema.prisma
    - package.json
    - .env.example

key-decisions:
  - "Pandoc spawned via spawn() not exec() with shell:false — paths never interpolated into shell, prevents injection across all formats"
  - "KaTeX throwOnError:true with manual catch — errors collected in array, rendering continues with [MATH ERROR] placeholder rather than crashing pipeline"
  - "Chapter splitting uses cheerio rather than regex — handles nested HTML and malformed structure from Pandoc output safely"
  - "Health report halts on mathErrors OR unsupportedCommands — downstream chapter storage should not run on broken content"

patterns-established:
  - "Pipeline modules in scripts/lib/ use ES module import/export and are tsx-executable"
  - "Math error collection via mutable errors[] parameter passed by reference — callers own the error list"
  - "cwd set to file's directory for all Pandoc calls — LaTeX \\input/\\include relative paths resolve correctly"

requirements-completed: [ADM-01, ADM-02]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 2 Plan 01: Conversion Pipeline Modules Summary

**Four tsx-importable pipeline modules — Pandoc wrapper, KaTeX server-side math renderer, h1 chapter splitter, chalk health reporter — plus Book pdfKey/epubKey R2 fields and migration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T22:53:55Z
- **Completed:** 2026-02-19T00:00:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Four TypeScript modules in `scripts/lib/` provide the full conversion engine that transforms LaTeX, Word, and Markdown manuscripts into pre-rendered HTML chapters
- KaTeX server-side pre-rendering converts Pandoc math spans into static HTML with no client-side JavaScript required at read time
- Pandoc invocation wrapper uses `spawn()` with array args and `cwd` set to the manuscript directory, enabling LaTeX `\input`/`\include` to resolve relative paths
- Book model extended with `pdfKey` and `epubKey` String? fields for R2 artifact storage, migration applied

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and add artifact storage fields to Book model** — `8486aa7` (feat)
2. **Task 2: Build Pandoc wrapper, KaTeX renderer, chapter splitter, and health report modules** — `9ae5b13` (feat)

## Files Created/Modified

- `scripts/lib/pandoc.ts` — runPandoc/detectFormat/convertToHtml/convertToPdf/convertToEpub exports
- `scripts/lib/katex-render.ts` — preRenderMath with inline/display math processing and error collection
- `scripts/lib/chapter-split.ts` — splitChapters splits HTML by h1, slugify helper, position-indexed chapters
- `scripts/lib/health-report.ts` — buildHealthReport parses pandoc stderr, printHealthReport with chalk color output
- `prisma/schema.prisma` — Book model: added pdfKey String? and epubKey String? fields
- `prisma/migrations/20260218144600_add_book_artifact_keys/migration.sql` — ALTER TABLE books ADD COLUMN epubKey/pdfKey
- `package.json` — added katex, cheerio, commander, @aws-sdk/* packages, chalk, @types/katex
- `.env.example` — R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME documented

## Decisions Made

- Pandoc spawned via `spawn()` not `exec()` with `shell: false` — array args prevent shell injection across all format types
- KaTeX `throwOnError: true` with manual `try/catch` — errors collected in caller-owned `errors[]` array, pipeline renders a `[MATH ERROR]` placeholder and continues rather than crashing
- Chapter splitting uses cheerio DOM traversal rather than regex — handles nested HTML and Pandoc's varied output structure safely
- Health report `halted` flag set when `mathErrors.length > 0` OR `unsupportedCommands.length > 0` — downstream chapter storage should not process broken content

## Deviations from Plan

None - plan executed exactly as written. All four modules and schema changes were already present from a prior execution (Task 1 commit 8486aa7 predates this run). Task 2 scripts were untracked and committed in this run.

## Issues Encountered

None — all verifications passed on first run. Pandoc 3.9 confirmed installed on system (brew). Dependencies all present in node_modules.

## User Setup Required

None for this plan. Note existing blockers from Phase 1:
- PostgreSQL must be running to apply migration `20260218144600_add_book_artifact_keys` (was created with --create-only due to DB offline)
- R2 credentials required in `.env` before the ingest CLI script can upload artifacts

## Next Phase Readiness

- All four conversion engine modules ready for use by the ingest CLI script (02-02)
- `runPandoc`, `preRenderMath`, `splitChapters`, `buildHealthReport` are importable via tsx and fully typed
- Book model has pdfKey/epubKey fields ready to receive R2 keys after upload

---
*Phase: 02-ingest*
*Completed: 2026-02-19*
