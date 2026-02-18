---
phase: 02-ingest
plan: "02"
subsystem: infra
tags: [r2, s3, cloudflare, pandoc, katex, prisma, commander, cli, latex, markdown, docx]

# Dependency graph
requires:
  - phase: 02-ingest
    plan: "01"
    provides: pandoc wrapper, KaTeX renderer, chapter splitter, health reporter, Book pdfKey/epubKey schema fields
provides:
  - scripts/lib/r2-upload.ts — createR2Client and uploadToR2 for Cloudflare R2 via S3-compatible API
  - scripts/lib/db-write.ts — writeChapters (atomic transaction), updateBookArtifacts, getBookForIngest
  - scripts/ingest.ts — Commander CLI entry point orchestrating full 10-step ingest pipeline
  - scripts/test-fixtures/sample.tex — LaTeX manuscript with 3 math-heavy chapters for testing
  - scripts/test-fixtures/sample.md — Markdown manuscript with 3 math chapters for testing
  - scripts/test-fixtures/sample.docx — Word document generated from sample.md for docx format testing
affects: [03-catalog, 04-reader, 05-payments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - R2 S3Client must use requestChecksumCalculation and responseChecksumValidation both set to WHEN_REQUIRED — R2 does not support CRC32 checksums from AWS SDK default
    - Commander.js CLI with requiredOption for mandatory --input and --book-id args; optional flags for --dry-run/--skip-pdf/--skip-epub/--skip-r2
    - Re-ingest atomicity via prisma.$transaction with deleteMany then createMany — guarantees no partial state
    - stripMathDelimiters() pre-processing: Pandoc falls back to raw TeX with $$...$$ delimiters when it cannot parse LaTeX equation environments; stripping must happen before KaTeX renderToString

key-files:
  created:
    - scripts/lib/r2-upload.ts
    - scripts/lib/db-write.ts
    - scripts/ingest.ts
    - scripts/test-fixtures/sample.tex
    - scripts/test-fixtures/sample.md
    - scripts/test-fixtures/sample.docx
  modified:
    - scripts/lib/katex-render.ts

key-decisions:
  - "R2 client uses WHEN_REQUIRED for both requestChecksumCalculation and responseChecksumValidation — CRC32 checksums cause 400 errors from Cloudflare R2's S3-compatible API"
  - "CLI --dry-run flag skips both DB writes and R2 uploads — fully functional without any external credentials for local testing"
  - "writeChapters uses prisma.$transaction with deleteMany+createMany for atomic re-ingest — partial state on failure is impossible"
  - "getBookForIngest validates book existence before pipeline starts — fails fast with clear error rather than running full conversion then failing on DB write"
  - "stripMathDelimiters() added to katex-render.ts — Pandoc wraps fallback-rendered equation environments with $$...$$ which KaTeX rejects; stripping normalises all input before rendering"

patterns-established:
  - "Dry-run pattern: check !dryRun before every external side effect (DB write, R2 upload) — allows full pipeline verification without credentials"
  - "Non-fatal failures: PDF and EPUB generation catch errors and print warnings rather than halting — xelatex may not be installed on all systems"

requirements-completed: [ADM-01, ADM-02]

# Metrics
duration: 7min
completed: 2026-02-19
---

# Phase 2 Plan 02: Ingest CLI and Storage Layer Summary

**Commander.js ingest CLI orchestrating Pandoc conversion, KaTeX pre-rendering, R2 upload, and Prisma chapter persistence — verified end-to-end in dry-run mode for LaTeX, Markdown, and Word manuscripts**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T22:59:03Z
- **Completed:** 2026-02-18T23:06:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 7

## Accomplishments

- Full ingest pipeline CLI (`npx tsx scripts/ingest.ts`) with 7 options: `--input`, `--book-id`, `--format`, `--dry-run`, `--skip-pdf`, `--skip-epub`, `--skip-r2`
- R2 upload module with Cloudflare S3-compatible API using WHEN_REQUIRED checksum configuration (critical fix for R2 compatibility)
- DB write module with atomic chapter re-ingest transaction and book artifact key update
- Dry-run verified for all three formats (LaTeX, Markdown, docx) — each produces 3 chapters with 0 math errors
- Fixed KaTeX delimiter stripping bug: Pandoc wraps equation environments with `$$..$$` when it falls back to raw TeX rendering; the fix normalises these before KaTeX processing

## Task Commits

Each task was committed atomically:

1. **Task 1: Build R2 upload module, DB write module, and CLI entry point** — `37f7866` (feat)
2. **Task 2: Create test manuscripts and verify pipeline with dry run** — `e13d727` (feat)
3. **Task 3: Human verification checkpoint** — awaiting user verification

## Files Created/Modified

- `scripts/lib/r2-upload.ts` — createR2Client() with WHEN_REQUIRED checksum fix; uploadToR2() reads file and PutObjectCommand to R2
- `scripts/lib/db-write.ts` — writeChapters() with $transaction atomicity, updateBookArtifacts(), getBookForIngest()
- `scripts/ingest.ts` — 10-step pipeline CLI with Commander.js: validate, convert HTML, pre-render math, split chapters, health report, PDF, EPUB, R2 upload, DB write, summary
- `scripts/test-fixtures/sample.tex` — 3-chapter LaTeX manuscript with amsmath: Gaussian integral, rotation matrix, Basel problem sum
- `scripts/test-fixtures/sample.md` — 3-chapter Markdown manuscript with $..$ inline and $$..$$  display math
- `scripts/test-fixtures/sample.docx` — Generated Word document from sample.md via pandoc
- `scripts/lib/katex-render.ts` — Added stripMathDelimiters() to handle Pandoc's raw TeX fallback wrapping

## Decisions Made

- R2 S3Client uses `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'` — default CRC32 causes 400 errors from Cloudflare R2
- `--dry-run` flag gates every external side effect independently — pipeline runs fully locally without DB or R2 credentials
- `writeChapters` uses `prisma.$transaction` wrapping `deleteMany` + `createMany` — re-ingest is atomic, no partial chapter state on failure
- `getBookForIngest` runs at startup before any conversion work — early exit with clear error if book ID is invalid
- `stripMathDelimiters()` in `katex-render.ts` strips `$$..$$`, `$...$`, `\[..\]`, `\(..\)`, and `\begin{equation}..\end{equation}` wrappers Pandoc may embed in math span content

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed KaTeX failure on Pandoc raw-TeX fallback delimiter wrapping**
- **Found during:** Task 2 (dry-run verification)
- **Issue:** Pandoc outputs `<span class="math display">$$\begin{equation}...\end{equation}$$</span>` when it cannot parse LaTeX equation environments. KaTeX receives the `$$` delimiters as part of the math expression and fails with "Can't use function '$' in math mode". Similarly for inline math: `<span class="math inline">$\frac{d}{dx}...$</span>`
- **Fix:** Added `stripMathDelimiters(tex, display)` helper to `katex-render.ts` that strips `$$..$$` for display mode and `$...$` for inline mode, plus `\begin{equation}..\end{equation}` wrappers, before calling `katex.renderToString`
- **Files modified:** `scripts/lib/katex-render.ts`
- **Verification:** All three dry-run formats exit 0 with 0 math errors; Markdown output confirmed to contain 11 `class="katex"` spans and 0 unprocessed `class="math inline/display"` spans
- **Committed in:** `e13d727` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential fix — without it the pipeline would halt on every LaTeX manuscript using `\begin{equation}` environments (the standard LaTeX display math syntax). No scope creep.

## Issues Encountered

- KaTeX "strict mode warnings" printed to stderr during processing (Unrecognized Unicode character, No character metrics) — these are cosmetic warnings from Pandoc rendering `\vec{}` and `\mathbb{}` as Unicode before math span wrapping. They do not affect output correctness and do not cause math errors. Can be suppressed with `strict: 'ignore'` in KaTeX options if desired (deferred — not needed for functionality).

## User Setup Required

Required before Task 3 (human-verify checkpoint):

1. **PostgreSQL**: Run `npx prisma migrate deploy` to apply `20260218144600_add_book_artifact_keys` migration (created with --create-only in 02-01)
2. **Database seed**: Run `npx prisma db seed` to create sample books for testing
3. **R2 credentials**: Add to `.env`:
   - `R2_ACCOUNT_ID` — Cloudflare Dashboard -> R2 -> Account ID (right sidebar)
   - `R2_ACCESS_KEY_ID` — Cloudflare Dashboard -> R2 -> Manage R2 API Tokens -> Create token with Object Read & Write
   - `R2_SECRET_ACCESS_KEY` — Same token creation page
   - `R2_BUCKET_NAME` — Create bucket named `scienceone` at Cloudflare Dashboard -> R2 -> Create bucket
4. **Pandoc**: Confirm `pandoc --version` shows 3.x (already installed per 02-01)

## Next Phase Readiness

- Task 3 checkpoint awaits human verification of full end-to-end ingest with real DB and R2
- Once verified: Phase 2 (Ingest Pipeline) is complete — Phase 3 (Catalog / Book Pages) can begin
- All four pipeline modules from 02-01 plus CLI from 02-02 form the complete ingest system

---
*Phase: 02-ingest*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: scripts/lib/r2-upload.ts
- FOUND: scripts/lib/db-write.ts
- FOUND: scripts/ingest.ts
- FOUND: scripts/test-fixtures/sample.tex
- FOUND: scripts/test-fixtures/sample.md
- FOUND: scripts/test-fixtures/sample.docx
- FOUND: .planning/phases/02-ingest/02-02-SUMMARY.md
- FOUND commit: 37f7866 (Task 1)
- FOUND commit: e13d727 (Task 2)
