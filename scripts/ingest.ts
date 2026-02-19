#!/usr/bin/env -S npx tsx

import 'dotenv/config';
import { existsSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { GetObjectCommand } from '@aws-sdk/client-s3';

import { convertToHtml, convertToPdf, convertToEpub, detectFormat } from './lib/pandoc';
import { preRenderMath } from './lib/katex-render';
import { splitChapters } from './lib/chapter-split';
import { buildHealthReport, printHealthReport } from './lib/health-report';
import { uploadToR2 } from './lib/r2-upload';
import { writeChapters, updateBookArtifacts, getBookForIngest, updateIngestJob } from './lib/db-write';
import { createR2Client } from '../src/lib/r2';

const program = new Command();

program
  .name('ingest')
  .description('Ingest a manuscript into ScienceOne')
  .option('-i, --input <path>', 'Path to manuscript file (.tex, .docx, .md)')
  .requiredOption('-b, --book-id <id>', 'Existing Book ID in the database')
  .option('-f, --format <format>', 'Input format override (latex|docx|markdown); auto-detected from extension if omitted')
  .option('--dry-run', 'Convert and report without writing to DB or uploading to R2')
  .option('--skip-pdf', 'Skip PDF generation (useful when xelatex not installed)')
  .option('--skip-epub', 'Skip EPUB generation')
  .option('--skip-r2', 'Skip R2 upload (useful for local testing without R2 credentials)')
  .option('--r2-key <key>', 'R2 object key of a manuscript uploaded via the browser (alternative to --input)')
  .option('--job-id <id>', 'IngestJob ID for status reporting; enables progress updates to the database')
  .action(async (opts) => {
    try {
      await run(opts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // If a job-id was provided, record the failure so the browser UI sees it
      if (opts.jobId) {
        try {
          await updateIngestJob(opts.jobId, 'error', null, msg);
        } catch {
          // Swallow errors from status update to avoid masking the original error
        }
      }
      console.error(chalk.red(`\nError: ${msg}`));
      process.exit(1);
    }
  });

program.parse();

interface RunOptions {
  input?: string;
  bookId: string;
  format?: string;
  dryRun?: boolean;
  skipPdf?: boolean;
  skipEpub?: boolean;
  skipR2?: boolean;
  r2Key?: string;
  jobId?: string;
}

async function run(opts: RunOptions): Promise<void> {
  const { bookId, dryRun, skipPdf, skipEpub, skipR2, r2Key, jobId } = opts;

  // Validate: must have either --input or --r2-key
  if (!opts.input && !r2Key) {
    console.error(chalk.red('Either --input or --r2-key is required'));
    process.exit(1);
  }

  let inputFile = opts.input ?? '';
  let tempFilePath: string | null = null;

  // ── 1. If --r2-key provided, download manuscript from R2 to a temp file ──
  if (r2Key) {
    const ext = r2Key.split('.').pop() ?? 'bin';
    tempFilePath = join(tmpdir(), `ingest-${randomUUID()}.${ext}`);

    console.log(chalk.cyan(`\nDownloading manuscript from R2: ${r2Key}`));
    const r2Client = createR2Client();
    const { Body } = await r2Client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: r2Key,
      })
    );

    if (!Body) {
      throw new Error(`Empty response body when downloading R2 key: ${r2Key}`);
    }

    // Stream to buffer then write to temp file
    const chunks: Uint8Array[] = [];
    for await (const chunk of Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    await writeFile(tempFilePath, buffer);
    inputFile = tempFilePath;
    console.log(chalk.green(`Downloaded to temp file: ${tempFilePath}`));
  }

  try {
    await runPipeline({ ...opts, input: inputFile }, jobId ?? null);
  } finally {
    // Clean up temp file regardless of success or failure
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        unlinkSync(tempFilePath);
      } catch {
        // Non-fatal cleanup failure
      }
    }
  }
}

async function updateProgress(
  jobId: string | null,
  step: string,
  pct: number,
): Promise<void> {
  if (!jobId) return;
  try {
    await updateIngestJob(jobId, 'processing', JSON.stringify({ step, pct }));
  } catch {
    // Non-fatal: don't break the pipeline if status update fails
  }
}

async function runPipeline(opts: RunOptions & { input: string }, jobId: string | null): Promise<void> {
  const { input: inputFile, bookId, dryRun, skipPdf, skipEpub, skipR2 } = opts;

  // ── 2. Validate inputs ───────────────────────────────────────────────────

  if (!existsSync(inputFile)) {
    console.error(chalk.red(`File not found: ${inputFile}`));
    process.exit(1);
  }

  const format: string = opts.format ?? detectFormat(inputFile);

  let bookSlug = 'dry-run';
  let bookTitle = 'Dry Run';

  if (!dryRun) {
    const book = await getBookForIngest(bookId);
    if (!book) {
      console.error(chalk.red(`Book not found: ${bookId}`));
      process.exit(1);
    }
    bookSlug = book.slug;
    bookTitle = book.title;
  }

  console.log(chalk.bold(`Ingesting ${format} manuscript: ${inputFile}`));
  if (!dryRun) {
    console.log(`Book: ${bookTitle} (${bookId})`);
  }

  // ── 3. Convert to HTML ───────────────────────────────────────────────────

  console.log(chalk.cyan('\n[1/6] Converting to HTML...'));
  const { html, stderr: pandocStderr } = await convertToHtml(inputFile, format);
  console.log(chalk.green(`Converted to HTML (${html.length} chars)`));
  await updateProgress(jobId, 'html_convert', 10);

  // ── 4. Pre-render math ───────────────────────────────────────────────────

  console.log(chalk.cyan('\n[2/6] Pre-rendering math...'));
  const mathErrors: string[] = [];
  const processedHtml = preRenderMath(html, mathErrors);
  if (mathErrors.length === 0) {
    console.log(chalk.green(`Pre-rendered math (0 errors)`));
  } else {
    console.log(chalk.yellow(`Pre-rendered math (${mathErrors.length} errors)`));
  }
  await updateProgress(jobId, 'math_render', 25);

  // ── 5. Split chapters ────────────────────────────────────────────────────

  console.log(chalk.cyan('\n[3/6] Splitting chapters...'));
  const chapters = splitChapters(processedHtml);
  console.log(chalk.green(`Split into ${chapters.length} chapters`));
  await updateProgress(jobId, 'chapter_split', 40);

  // ── 6. Build health report ───────────────────────────────────────────────

  console.log(chalk.cyan('\n[4/6] Health report...'));
  const report = buildHealthReport(inputFile, format, pandocStderr, mathErrors, chapters.length);
  printHealthReport(report);
  await updateProgress(jobId, 'health_report', 50);

  if (report.halted) {
    const healthJson = JSON.stringify(report);
    if (jobId) {
      await updateIngestJob(jobId, 'error', null, `Pipeline halted by health report. ${healthJson}`);
    }
    console.error(chalk.red('\nPipeline halted — fix errors above before ingesting.'));
    process.exit(1);
  }

  // ── 7. Generate PDF ──────────────────────────────────────────────────────

  let pdfPath: string | null = null;

  if (!skipPdf && !dryRun) {
    console.log(chalk.cyan('\n[5/6] Generating PDF...'));
    try {
      const { outputPath } = await convertToPdf(inputFile);
      pdfPath = outputPath;
      console.log(chalk.green(`Generated PDF: ${outputPath}`));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.yellow(`PDF generation skipped (non-fatal): ${msg}`));
    }
  } else if (skipPdf || dryRun) {
    console.log(chalk.gray('\n[5/6] PDF generation skipped'));
  }
  await updateProgress(jobId, 'pdf_generate', 70);

  // ── 8. Generate EPUB ─────────────────────────────────────────────────────

  let epubPath: string | null = null;

  if (!skipEpub && !dryRun) {
    console.log(chalk.cyan('\n[6/6] Generating EPUB...'));
    try {
      const { outputPath } = await convertToEpub(inputFile);
      epubPath = outputPath;
      console.log(chalk.green(`Generated EPUB: ${outputPath}`));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.yellow(`EPUB generation skipped (non-fatal): ${msg}`));
    }
  } else if (skipEpub || dryRun) {
    console.log(chalk.gray('\n[6/6] EPUB generation skipped'));
  }
  await updateProgress(jobId, 'epub_generate', 85);

  // ── 9. Upload to R2 ──────────────────────────────────────────────────────

  let pdfKey: string | null = null;
  let epubKey: string | null = null;

  if (!skipR2 && !dryRun) {
    console.log(chalk.cyan('\nUploading to R2...'));

    if (pdfPath) {
      const key = `books/${bookSlug}/${bookSlug}.pdf`;
      pdfKey = await uploadToR2(pdfPath, key, 'application/pdf');
      console.log(chalk.green(`Uploaded to R2: ${pdfKey}`));
    }

    if (epubPath) {
      const key = `books/${bookSlug}/${bookSlug}.epub`;
      epubKey = await uploadToR2(epubPath, key, 'application/epub+zip');
      console.log(chalk.green(`Uploaded to R2: ${epubKey}`));
    }
  } else if (skipR2 || dryRun) {
    console.log(chalk.gray('\nR2 upload skipped'));
  }
  await updateProgress(jobId, 'r2_upload', 95);

  // ── 10. Write to database ─────────────────────────────────────────────────

  if (!dryRun) {
    console.log(chalk.cyan('\nWriting to database...'));

    const count = await writeChapters(bookId, chapters);
    console.log(chalk.green(`Wrote ${count} chapters to database`));

    await updateBookArtifacts(bookId, pdfKey, epubKey);
    console.log(chalk.green('Updated Book with artifact keys'));
  }
  await updateProgress(jobId, 'db_write', 100);

  // On success — update job to "success"
  if (jobId) {
    await updateIngestJob(jobId, 'success', JSON.stringify({ step: 'complete', pct: 100 }));
  }

  // ── 11. Summary ───────────────────────────────────────────────────────────

  console.log(chalk.bold('\n=== Ingest Summary ==='));
  if (!dryRun) {
    console.log(`Book       : ${bookTitle}`);
  }
  console.log(`Format     : ${format}`);
  console.log(`Chapters   : ${chapters.length}`);
  console.log(`PDF key    : ${pdfKey ?? (skipPdf ? 'skipped' : dryRun ? 'dry-run' : 'not generated')}`);
  console.log(`EPUB key   : ${epubKey ?? (skipEpub ? 'skipped' : dryRun ? 'dry-run' : 'not generated')}`);

  if (dryRun) {
    console.log(chalk.yellow('\nDRY RUN — no changes written to DB or R2'));
  } else {
    console.log(chalk.green('\nIngest complete!'));
  }
}
