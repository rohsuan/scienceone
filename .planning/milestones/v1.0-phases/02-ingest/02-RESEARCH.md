# Phase 2: Ingest Pipeline - Research

**Researched:** 2026-02-18
**Domain:** Pandoc + KaTeX server-side rendering + Cloudflare R2 + TypeScript CLI
**Confidence:** HIGH (core stack verified; pitfalls verified against official sources and current community reports)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-01 | Publisher can ingest manuscripts in LaTeX, Word, and Markdown formats via automated pipeline (Pandoc) | Pandoc 3.x handles all three formats natively via `-f latex`, `-f docx`, `-f markdown`. Invoke via `child_process.spawn` from a TypeScript CLI script using `tsx`. |
| ADM-02 | Pipeline produces browser-readable HTML with pre-rendered KaTeX math, PDF, and EPUB artifacts | Pandoc converts to HTML; a post-processing step with `katex.renderToString()` replaces math spans. Pandoc with `--pdf-engine=xelatex` produces PDF; `pandoc -t epub3` produces EPUB. Both uploaded to Cloudflare R2 via `@aws-sdk/client-s3`. |
</phase_requirements>

---

## Summary

Phase 2 builds an automated manuscript ingest pipeline invoked from the command line by the founder. It must accept three input formats (LaTeX, Word, Markdown), convert each to HTML with pre-rendered KaTeX math, generate PDF and EPUB artifacts, upload them to Cloudflare R2, and write structured chapter records to PostgreSQL via Prisma.

The core toolchain is: **Pandoc** (document conversion) → **KaTeX** (math pre-rendering via Node.js post-processing) → **Cheerio** (HTML post-processing) → **Prisma** (database write) → **@aws-sdk/client-s3** (R2 upload). The CLI itself is a TypeScript script in `/scripts/` executed via `tsx` — the same runner already present in the project's devDependencies.

The single highest-risk decision is **KaTeX vs MathJax for math rendering**. KaTeX does not support `\label`/`\eqref`/`\ref` cross-references. If the manuscripts use equation cross-referencing heavily, KaTeX will produce broken output silently. The prior decision in the roadmap requires auditing manuscripts before committing. This research provides a clear decision framework: if any manuscript uses `\label`+`\eqref`, use MathJax 3 server-side; otherwise KaTeX is simpler and faster. Research defaults to KaTeX with the open question flagged explicitly.

**Primary recommendation:** Use Pandoc 3.x CLI (spawned via `child_process`) to convert all formats to HTML, then post-process the output with `katex` npm package (`renderToString`) + Cheerio to replace math spans with pre-rendered HTML. Split chapters by `<h1>` headings. Upload PDF/EPUB artifacts to R2 with `@aws-sdk/client-s3` v3, write chapter records to Prisma. Build the CLI with Commander.js and execute with the existing `tsx` devDependency.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pandoc (system) | 3.8+ | Document conversion: LaTeX/docx/md → HTML, PDF, EPUB | Only mature tool that handles all three input formats. 3.x is current stable release (3.8.3 Dec 2025). |
| katex | ^0.16 | Server-side math pre-rendering: LaTeX → HTML | Native Node.js support; `renderToString()` produces static HTML that requires no client JS. Fastest pre-render option. |
| cheerio | ^1.0 | HTML post-processing: parse Pandoc output, apply KaTeX, split chapters | jQuery-like API for server-side HTML manipulation; widely used, actively maintained. |
| @aws-sdk/client-s3 | ^3.x | Upload PDF/EPUB to Cloudflare R2 (S3-compatible) | Official AWS SDK v3 is the documented approach in Cloudflare R2 docs. |
| @aws-sdk/lib-storage | ^3.x | Multipart upload support for large files | Handles large PDF/EPUB files (>5MB) automatically. |
| commander | ^14 | CLI argument parsing: `ingest --input ./book.tex --book-id xxx` | Standard Node.js CLI library; TypeScript types included; supports subcommands and options. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @aws-sdk/s3-request-presigner | ^3.x | Generate presigned URLs for future secure downloads | Phase 6 will need this; install now so the R2 module is complete. |
| chalk | ^5 | CLI output coloring for health report display | Makes errors/warnings visible at a glance; ESM only in v5. |
| tsx (existing) | ^4.x | Execute TypeScript scripts without compilation | Already in devDependencies — use `#!/usr/bin/env -S npx tsx` shebang. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| katex (server-side post-process) | pandoc --katex flag | `--katex` flag generates client-side KaTeX that requires JavaScript in browser — not pre-rendered. Must post-process. |
| katex | MathJax 3 (server-side) | MathJax 3 supports `\label`/`\eqref` cross-references; KaTeX does not. Use MathJax if manuscripts use `\eqref`. MathJax Node API also supports `renderToString`. |
| cheerio | node-html-parser | Cheerio is more featureful and has jQuery-like selector API. Both work for post-processing. |
| @aws-sdk/client-s3 | @cloudflare/r2 workers SDK | AWS SDK is the documented recommendation in Cloudflare R2 docs for Node.js server-side code. Workers SDK is for edge workers only. |
| commander | yargs | Commander is simpler for this use case; yargs adds more complexity than needed for a single-command ingest CLI. |

**Installation:**
```bash
npm install katex cheerio commander @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner chalk
npm install --save-dev @types/katex
```

**System dependencies (must be installed separately):**
```bash
# macOS
brew install pandoc
brew install --cask mactex  # or: brew install basictex (for pdflatex/xelatex)

# Verify
pandoc --version  # should show 3.x
xelatex --version # for PDF generation
```

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── ingest.ts              # CLI entry point (shebang: #!/usr/bin/env -S npx tsx)
└── lib/
    ├── pandoc.ts          # Pandoc invocation wrapper (child_process.spawn)
    ├── katex-render.ts    # KaTeX post-processing: replace math spans
    ├── chapter-split.ts   # Split HTML output into chapters by <h1>
    ├── health-report.ts   # Collect warnings, errors; halt on errors
    ├── r2-upload.ts       # Cloudflare R2 upload via @aws-sdk/client-s3
    └── db-write.ts        # Prisma writes: Book + Chapter records
src/
├── lib/
│   └── prisma.ts          # existing — reused by scripts/lib/db-write.ts
prisma/
└── schema.prisma          # may need new fields: pdfKey, epubKey on Book
```

### Pattern 1: Pandoc Invocation via child_process.spawn

**What:** Wrap Pandoc CLI calls in a typed async function that collects stdout/stderr and rejects on non-zero exit code.
**When to use:** All Pandoc invocations (HTML, PDF, EPUB). Never shell-inject user input directly.

```typescript
// Source: Node.js child_process docs + pandoc manual
import { spawn } from 'child_process';

async function runPandoc(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pandoc', args, { encoding: 'utf8' });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`Pandoc failed (exit ${code}): ${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

// LaTeX → HTML (fragment, no standalone wrapper)
const { stdout: html, stderr: warnings } = await runPandoc([
  '-f', 'latex+raw_tex',
  '-t', 'html5',
  '--no-highlight',
  inputFile,
]);

// LaTeX → PDF
await runPandoc([
  '-f', 'latex',
  '--pdf-engine=xelatex',
  inputFile,
  '-o', outputPdf,
]);

// LaTeX → EPUB3
await runPandoc([
  '-f', 'latex',
  '-t', 'epub3',
  '--toc',
  inputFile,
  '-o', outputEpub,
]);
```

### Pattern 2: KaTeX Post-Processing

**What:** After Pandoc produces HTML, parse the output with Cheerio and replace `.math.inline` / `.math.display` spans with pre-rendered KaTeX HTML.
**When to use:** After every Pandoc HTML conversion. Pandoc places math inside `<span class="math inline">...</span>` and `<span class="math display">...</span>` when outputting to HTML without `--katex`.

```typescript
// Source: katex.org/docs/node + katex.org/docs/options + cheerio docs
import katex from 'katex';
import * as cheerio from 'cheerio';

function preRenderMath(html: string, errors: string[]): string {
  const $ = cheerio.load(html, { xmlMode: false });

  $('span.math.inline').each((_, el) => {
    const tex = $(el).text();
    try {
      const rendered = katex.renderToString(tex, {
        displayMode: false,
        throwOnError: true,
        output: 'html',
      });
      $(el).replaceWith(rendered);
    } catch (err) {
      errors.push(`Broken inline math: ${tex} — ${err.message}`);
      $(el).replaceWith(`<span class="math-error" data-latex="${tex}">[MATH ERROR]</span>`);
    }
  });

  $('span.math.display').each((_, el) => {
    const tex = $(el).text();
    try {
      const rendered = katex.renderToString(tex, {
        displayMode: true,
        throwOnError: true,
        output: 'html',
      });
      $(el).replaceWith(rendered);
    } catch (err) {
      errors.push(`Broken display math: ${tex} — ${err.message}`);
      $(el).replaceWith(`<div class="math-error" data-latex="${tex}">[MATH ERROR]</div>`);
    }
  });

  return $.html();
}
```

**CSS requirement:** Chapters stored as HTML in the database need KaTeX CSS served alongside them. In Phase 4, include KaTeX CSS in the reader layout — no KaTeX JS required (pre-rendered HTML only).

### Pattern 3: Chapter Splitting

**What:** Split the full-document HTML output from Pandoc by `<h1>` headings to create individual chapter records.
**When to use:** After math pre-rendering. Each `<h1>` becomes a chapter with position index.

```typescript
// Source: cheerio docs
function splitChapters(html: string): Array<{ title: string; content: string; position: number }> {
  const $ = cheerio.load(html);
  const chapters: Array<{ title: string; content: string; position: number }> = [];
  let position = 0;

  $('h1').each((_, heading) => {
    const title = $(heading).text().trim();
    const content: string[] = [$.html(heading) as string];
    let next = $(heading).next();
    while (next.length && !next.is('h1')) {
      content.push($.html(next) as string);
      next = next.next();
    }
    chapters.push({ title, content: content.join('\n'), position: position++ });
  });

  return chapters;
}
```

### Pattern 4: Cloudflare R2 Upload

**What:** Upload PDF and EPUB artifacts to R2 using the S3-compatible API.
**When to use:** After PDF/EPUB generation, before Prisma writes.

```typescript
// Source: developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Fix for @aws-sdk/client-s3 >= 3.729.0 checksum compatibility issue with R2:
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

async function uploadToR2(localPath: string, key: string, contentType: string): Promise<string> {
  const body = await readFile(localPath);
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key; // storage key recorded in DB
}

// Usage
const pdfKey = `books/${bookSlug}/${bookSlug}.pdf`;
const epubKey = `books/${bookSlug}/${bookSlug}.epub`;
await uploadToR2(generatedPdfPath, pdfKey, 'application/pdf');
await uploadToR2(generatedEpubPath, epubKey, 'application/epub+zip');
```

### Pattern 5: Health Report and Error Halting

**What:** Collect Pandoc stderr warnings, math rendering errors, and unsupported command errors into a structured report. Halt (throw) if any errors exist; warn-only if only warnings.
**When to use:** After each pipeline stage. Print summary at end regardless.

```typescript
interface HealthReport {
  pandocWarnings: string[];
  mathErrors: string[];      // broken equations
  unsupportedCommands: string[];
  halted: boolean;
}

function buildHealthReport(
  pandocStderr: string,
  mathErrors: string[],
): HealthReport {
  const pandocWarnings = pandocStderr
    .split('\n')
    .filter(l => l.toLowerCase().includes('[warning]') || l.trim().length > 0);

  const unsupportedCommands = pandocStderr
    .split('\n')
    .filter(l => l.toLowerCase().includes('unknown') || l.toLowerCase().includes('not supported'));

  const halted = mathErrors.length > 0 || unsupportedCommands.length > 0;
  return { pandocWarnings, mathErrors, unsupportedCommands, halted };
}
```

### Pattern 6: Prisma Schema Additions Needed

The existing `Book` and `Chapter` models need additions to support the ingest pipeline:

```prisma
// prisma/schema.prisma additions needed for Phase 2:

model Book {
  // ... existing fields ...
  pdfKey    String?  // R2 storage key: "books/slug/slug.pdf"
  epubKey   String?  // R2 storage key: "books/slug/slug.epub"
}

model Chapter {
  // content field already exists as String? @db.Text
  // No changes needed if content stores pre-rendered HTML
}
```

A `prisma migrate dev --name add_book_artifact_keys` migration is required.

### Pattern 7: CLI Entry Point with Commander.js

```typescript
#!/usr/bin/env -S npx tsx
// scripts/ingest.ts

import { Command } from 'commander';

const program = new Command();

program
  .name('ingest')
  .description('Ingest a manuscript into ScienceOne')
  .requiredOption('-i, --input <path>', 'Path to manuscript file (.tex, .docx, .md)')
  .requiredOption('-b, --book-id <id>', 'Existing Book ID in the database')
  .option('-f, --format <format>', 'Input format: latex|docx|markdown (auto-detected from extension if omitted)')
  .option('--dry-run', 'Convert without writing to DB or R2')
  .action(async (options) => {
    // pipeline logic
  });

program.parse();
```

**Usage:**
```bash
npx tsx scripts/ingest.ts --input ./manuscript.tex --book-id clxxx123
# or, after chmod +x:
./scripts/ingest.ts --input ./manuscript.tex --book-id clxxx123
```

### Anti-Patterns to Avoid

- **Don't use `pandoc --katex` flag:** This inserts client-side KaTeX JavaScript references, not pre-rendered HTML. The `--katex` flag produces the opposite of what is needed.
- **Don't shell-interpolate user paths:** Always pass file paths as array arguments to `spawn`, never via template strings to `exec`. Prevents command injection.
- **Don't write to Prisma before PDF/EPUB upload:** If upload fails, the DB record would reference non-existent R2 keys. Upload first, then write to DB.
- **Don't use pandoc `-s` (standalone) for chapter HTML:** Standalone wraps output in `<html><head>...` which complicates chapter extraction. Convert to fragment, split chapters, then store fragments.
- **Don't use `@aws-sdk/client-s3` ≥ 3.729.0 without the checksum fix:** Versions ≥ 3.729.0 enable CRC32 checksums by default; R2 does not support CRC32. Use `requestChecksumCalculation: 'WHEN_REQUIRED'` on the S3Client.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Document format conversion | Custom LaTeX parser | Pandoc | Pandoc handles thousands of edge cases in LaTeX, docx, and markdown. A custom parser will miss `\input`, `\include`, table syntax, figure environments, footnotes, etc. |
| Math rendering to HTML | Custom LaTeX→HTML math converter | katex npm package | KaTeX is maintained by Khan Academy with extensive test coverage of LaTeX math edge cases. |
| HTML manipulation | Custom regex-based HTML rewriting | cheerio | Regex on HTML is brittle and breaks on nested elements, attributes, encoded entities. Cheerio parses properly. |
| S3-compatible file uploads | Custom HTTP multipart upload | @aws-sdk/lib-storage | Multipart upload protocol has retry logic, part ordering, and completion steps that are subtle to implement correctly. |
| CLI argument parsing | Custom `process.argv` slicing | commander | Commander handles `--help`, type coercion, required options, subcommands correctly out of the box. |
| TikZ/PGFPlots → SVG | Client-side renderer | Pre-compiled SVGs via dvisvgm Lua filter | TikZ requires a LaTeX installation to render. Client-side TikZ renderers (TikZJax) are large and slow. Pre-compile to SVG during ingest. |

**Key insight:** The document conversion domain has enormous surface area. Every "simple" format has dozens of edge cases that took Pandoc years to handle. The only sensible approach is to use Pandoc as the conversion core and focus engineering effort on the integration layer (error handling, splitting, pre-rendering, uploading).

---

## Common Pitfalls

### Pitfall 1: KaTeX \label and \eqref Cross-References Silently Fail

**What goes wrong:** KaTeX does not implement `\label`, `\eqref`, or `\ref`. If a manuscript uses equation cross-referencing (e.g., `As shown in Equation \eqref{eq:main}...`), KaTeX will either throw an error or silently omit the reference. The rendered output will have `[MATH ERROR]` or empty spans where equation numbers should appear.

**Why it happens:** KaTeX is designed as a lightweight math renderer, not a full LaTeX system. Equation numbering requires a two-pass compilation model (compile, number, re-reference) that KaTeX doesn't support.

**How to avoid:** Before committing to KaTeX, audit all manuscripts for `\eqref`, `\label`, and `\ref` usage inside math environments. If found, switch to MathJax 3 server-side rendering instead. MathJax 3 supports these commands and can run server-side via Node.js.

**Warning signs:** Pandoc stderr contains `Unknown command: \eqref` or KaTeX errors mentioning `\label`. Chapter HTML contains `[MATH ERROR]` spans.

### Pitfall 2: Pandoc amsthm Theorem Environments Lost in HTML

**What goes wrong:** Pandoc does not natively support LaTeX `amsthm` theorem/proof environments (Theorem, Lemma, Proof, Definition, etc.) when converting to HTML. These environments are silently stripped or output as plain paragraphs with no styling or numbering.

**Why it happens:** Pandoc has an open issue (#1608) for amsthm support that has been open since 2014.

**How to avoid:** Decide early how theorems will be handled:
- **Option A (recommended):** Use the `pandoc-amsthm` filter or `pandoc-math` filter which adds basic theorem/proof support. Requires Python 3.7+.
- **Option B:** Accept that theorem environments output as styled `<div>` blocks with a custom CSS class, and style them in Phase 4.
- **Option C:** Pre-process the LaTeX source to replace `\begin{theorem}` with a custom environment Pandoc understands before conversion.

**Warning signs:** HTML output shows theorem content without "Theorem 1.1" headings; proof environments appear as plain paragraphs.

### Pitfall 3: TikZ and PGFPlots Produce Empty Output in HTML

**What goes wrong:** TikZ and PGFPlots figures are LaTeX-only constructs that Pandoc cannot convert to HTML. They are silently dropped or produce raw LaTeX code blocks in the output.

**Why it happens:** TikZ requires a LaTeX engine (pdflatex/lualatex) to render. It is not a math formula — it is a full drawing system with no HTML equivalent.

**How to avoid:** Handle TikZ figures in one of these ways (choose one during planning):
- **Pre-compile to SVG:** Add a pre-processing step before Pandoc that extracts TikZ environments, compiles each with `lualatex`, converts to SVG with `dvisvgm`, and replaces the `\begin{tikzpicture}` block with an `\includegraphics{figure.svg}` reference.
- **Use the Imagify Lua filter:** `pandoc --lua-filter=imagify.lua` handles TikZ-to-image conversion during the Pandoc pass. Requires LaTeX + dvisvgm installed.
- **Accept images only:** Require that manuscript submissions include pre-compiled figures as PNG/SVG instead of TikZ source.

**Warning signs:** HTML output has code blocks containing `\begin{tikzpicture}` text; figures are absent from rendered chapters.

### Pitfall 4: AWS SDK v3 Checksum Incompatibility with R2

**What goes wrong:** `@aws-sdk/client-s3` version 3.729.0+ enables CRC32 checksums by default on `PutObject` and `UploadPart`. Cloudflare R2 does not support CRC32, causing uploads to fail with `Header 'x-amz-checksum-algorithm' with value 'CRC32' not implemented`.

**Why it happens:** AWS updated SDK defaults in late 2024 to enable integrity checking. R2 has not yet implemented CRC32 support.

**How to avoid:** Always configure `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'` on the `S3Client` instance. This opts out of the new default.

**Warning signs:** Upload fails with HTTP 501 or a header-related error mentioning checksum algorithm.

### Pitfall 5: Pandoc Working Directory for \input and \include

**What goes wrong:** LaTeX manuscripts commonly use `\input{chapter1}` or `\include{chapter1}` to compose a multi-file document. If Pandoc is invoked from the wrong directory, it cannot find the included files and fails silently or with an error.

**Why it happens:** Pandoc resolves relative file paths from the current working directory, not from the input file's location.

**How to avoid:** When spawning Pandoc, set `cwd` option in `child_process.spawn` to the directory containing the main `.tex` file:

```typescript
const proc = spawn('pandoc', args, {
  cwd: path.dirname(path.resolve(inputFile)), // set CWD to manuscript dir
});
```

**Warning signs:** Pandoc stderr contains "Could not find" or "file not found" messages; output HTML is missing large sections of content.

### Pitfall 6: Storing Raw LaTeX Instead of Pre-Rendered HTML

**What goes wrong:** Storing the original LaTeX in `chapters.content` and rendering KaTeX client-side in Phase 4 defeats the purpose of this phase. The success criteria explicitly require "no client-side math rendering."

**Why it happens:** It's tempting to skip math pre-rendering and defer it to the reader. But Phase 4's catalog and reading experience will work correctly only if math is already pre-rendered.

**How to avoid:** The `chapters.content` field MUST store complete pre-rendered HTML (including KaTeX-rendered math spans). Never store raw LaTeX as chapter content.

### Pitfall 7: R2 Key Naming Collisions

**What goes wrong:** If the same book is ingested twice (re-ingest scenario), new PDF/EPUB uploads overwrite old R2 objects with the same key. This is usually desirable for re-ingest but must be explicit and confirmed — not accidental.

**How to avoid:** Use deterministic key paths based on book slug: `books/{slug}/book.pdf`. Document this policy. On re-ingest, delete old chapter records before writing new ones (or upsert by position).

---

## Code Examples

Verified patterns from official sources:

### Pandoc HTML Conversion (LaTeX fragment)

```typescript
// Source: pandoc.org/MANUAL.html
const { stdout: rawHtml, stderr } = await runPandoc([
  '-f', 'latex+raw_tex',  // +raw_tex preserves unknown LaTeX as raw passthrough
  '-t', 'html5',
  '--no-highlight',        // disable code syntax highlighting (not needed)
  path.resolve(inputFile),
]);
```

### Pandoc EPUB Conversion

```typescript
// Source: pandoc.org/epub.html
await runPandoc([
  '-f', 'latex',
  '-t', 'epub3',
  '--toc',
  '--toc-depth=2',
  // EPUB3 renders math as MathML by default — acceptable for EPUB readers
  path.resolve(inputFile),
  '-o', epubOutputPath,
]);
```

### Pandoc PDF Conversion

```typescript
// Source: pandoc.org/MANUAL.html#creating-a-pdf
await runPandoc([
  '-f', 'latex',
  '--pdf-engine=xelatex',   // xelatex handles Unicode and most math packages
  '--pdf-engine-opt=-halt-on-error',
  path.resolve(inputFile),
  '-o', pdfOutputPath,
]);
```

### Word (.docx) Conversion

```typescript
// Source: pandoc.org/MANUAL.html
const { stdout: rawHtml, stderr } = await runPandoc([
  '-f', 'docx',
  '-t', 'html5',
  '--extract-media', tmpMediaDir,  // extract embedded images
  path.resolve(inputFile),
]);
```

### Markdown Conversion

```typescript
// Source: pandoc.org/MANUAL.html
const { stdout: rawHtml, stderr } = await runPandoc([
  '-f', 'markdown',
  '-t', 'html5',
  path.resolve(inputFile),
]);
```

### KaTeX renderToString (server-side pre-render)

```typescript
// Source: katex.org/docs/options, katex.org/docs/node
import katex from 'katex';

const renderedInline = katex.renderToString('x^2 + y^2 = z^2', {
  displayMode: false,
  throwOnError: true,    // throw so we can catch and log to health report
  output: 'html',        // HTML only, no MathML (smaller output)
  strict: 'error',       // strict LaTeX compliance
  macros: {},
});

const renderedDisplay = katex.renderToString('\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', {
  displayMode: true,
  throwOnError: true,
  output: 'html',
});
```

### R2 Upload with Checksum Fix

```typescript
// Source: developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
// + Cloudflare community fix for checksum issue (verified Feb 2025)
import { S3Client } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',   // CRITICAL: fix for R2 compatibility
  responseChecksumValidation: 'WHEN_REQUIRED',   // CRITICAL: fix for R2 compatibility
});
```

### tsx Shebang for CLI Script

```typescript
#!/usr/bin/env -S npx tsx
// Source: tsx.is/shell-scripts
// File: scripts/ingest.ts
// Make executable: chmod +x scripts/ingest.ts

import { Command } from 'commander';
// ... rest of CLI
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MathJax 2 (client-side only) | MathJax 3 (full Node.js server-side) | 2020 | MathJax 3 can pre-render server-side; same API as KaTeX server-side |
| pandoc 2.x | pandoc 3.x | Jan 2023 | 3.x has new Lua filter API, chunked HTML output, improved LaTeX handling |
| @aws-sdk v2 | @aws-sdk v3 (modular) | 2020 | v3 is tree-shakeable, TypeScript-native; v2 is deprecated |
| ts-node for scripts | tsx for scripts | 2022+ | tsx is faster (uses esbuild), supports latest TypeScript features, simpler config |
| node-pandoc npm wrapper | Direct child_process.spawn | ongoing | node-pandoc is abandoned/unmaintained; spawn gives full control over stderr |

**Deprecated/outdated:**
- `node-pandoc` npm package: Last published 2019, depends on ancient callback patterns. Do not use — call `child_process.spawn('pandoc', ...)` directly.
- `pandoc --katex` flag for "pre-rendering": This flag sets up client-side KaTeX, not server-side pre-rendering. It will fail the success criteria.
- `@aws-sdk/client-s3` < 3.729.0: Pinning to old versions is not recommended. Use current version with the checksum fix config instead.

---

## Open Questions

1. **KaTeX vs MathJax decision (MUST resolve before Phase 2 planning)**
   - What we know: KaTeX does not support `\label`/`\eqref`/`\ref` equation cross-references. MathJax 3 does, and supports server-side pre-rendering via Node.js.
   - What's unclear: Whether the actual manuscripts use `\eqref` cross-referencing.
   - Recommendation: Audit one representative manuscript before starting Phase 2. Search for `\eqref`, `\ref{eq:`, `\label{eq:`. If found in more than ~5 places, switch to MathJax 3. If absent or rare, proceed with KaTeX.

2. **TikZ/PGFPlots handling strategy (MUST decide before plan 02-01)**
   - What we know: TikZ cannot be converted to HTML natively by Pandoc. The roadmap lists TikZ in the LaTeX package allowlist.
   - What's unclear: Whether the actual manuscripts contain TikZ figures, and how many.
   - Recommendation: If TikZ is present, the simplest approach for Phase 2 is to require pre-compiled SVG images in manuscripts (not raw TikZ code). Add a health report check that warns if `\begin{tikzpicture}` is detected and halts if TikZ figures would be lost. Full TikZ pre-compilation pipeline (dvisvgm) can be a follow-on.

3. **amsthm theorem environment handling**
   - What we know: Pandoc silently strips or misformats amsthm environments. The `pandoc-math` and `pandoc-amsthm` filters exist but require Python.
   - What's unclear: How important theorem/proof formatting is for Phase 2 vs. Phase 4 visual polish.
   - Recommendation: For Phase 2, accept that theorems render as plain `<p>` or `<div>` blocks with a `[Theorem]` prefix class. Add a health report warning when amsthm environments are detected. Phase 4 can add CSS to style them.

4. **Ingest UI vs CLI only**
   - What we know: Phase 2 success criteria say "Founder can run the ingest CLI." Phase 7 adds a browser-based upload UI.
   - What's unclear: Nothing — CLI-only is correct for Phase 2.
   - Recommendation: Build a robust CLI. The core pipeline code will be reused in Phase 7's API route.

5. **Book record pre-existence assumption**
   - What we know: The ingest CLI receives a `--book-id` that references an existing `Book` record in the database.
   - What's unclear: Who creates the `Book` record before ingest? Either a seed script, a separate CLI command, or manual DB insertion.
   - Recommendation: Add a `create-book` subcommand to the CLI (or a separate script) that creates a Book record with basic metadata. Ingest then fills in the chapters. This avoids requiring the founder to use Prisma Studio or raw SQL for every new book.

---

## Sources

### Primary (HIGH confidence)

- KaTeX official docs (katex.org/docs/node, katex.org/docs/options, katex.org/docs/supported) — Node.js API, options, supported commands
- Pandoc official manual (pandoc.org/MANUAL.html) — conversion flags, PDF engines, EPUB output, math rendering options
- Cloudflare R2 official docs (developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) — S3Client configuration, upload patterns
- tsx official docs (tsx.is/shell-scripts) — shebang pattern for TypeScript scripts
- Existing project codebase: prisma/schema.prisma (Book, Chapter models verified), package.json (tsx already installed)

### Secondary (MEDIUM confidence)

- Cloudflare Community forum: @aws-sdk/client-s3 v3.729.0 checksum issue and fix (Feb 2025, verified resolved) — `requestChecksumCalculation: 'WHEN_REQUIRED'` workaround
- GitHub: KaTeX issues #2003 and #2798 — confirmed `\label`/`\eqref`/`\ref` not implemented in KaTeX (open issues, no resolution)
- GitHub: pandoc issue #1608 — confirmed amsthm not natively supported in Pandoc HTML output (open since 2014)
- GitHub: pandoc-math (gavinmcwhinnie) — Python filter for amsmath/amsthm support; requires Python 3.7+
- WebSearch: pandoc 3.8.3 release (Dec 2025) — current stable version confirmed

### Tertiary (LOW confidence — flag for validation)

- pandoc-katex (Rust-based filter): Reported to pre-render KaTeX server-side as a Pandoc filter. Not verified against current version. Post-processing with katex npm package is more straightforward for this stack.
- MathJax 3 Node.js server-side rendering: Reported to support `\label`/`\eqref`. Not fully verified — if KaTeX is ruled out, validate MathJax 3 Node.js API before committing to it.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pandoc, katex, cheerio, @aws-sdk/client-s3 all have official docs; tsx shebang verified
- Architecture: HIGH — patterns derived directly from official docs and verified code examples
- Pitfalls: HIGH for R2 checksum issue (community-verified, Feb 2025 resolution) and KaTeX \label limitation (open GitHub issues); MEDIUM for TikZ and amsthm (well-documented limitations, mitigation strategies verified)
- Open questions: These are genuinely unknown until manuscripts are examined — correctly flagged rather than assumed

**Research date:** 2026-02-18
**Valid until:** 2026-05-18 (90 days — stack is stable; R2 checksum issue resolved; KaTeX limitations are longstanding)
