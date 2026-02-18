#!/usr/bin/env -S npx tsx

import 'dotenv/config';
import { existsSync } from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';

import { convertToHtml, convertToPdf, convertToEpub, detectFormat } from './lib/pandoc';
import { preRenderMath } from './lib/katex-render';
import { splitChapters } from './lib/chapter-split';
import { buildHealthReport, printHealthReport } from './lib/health-report';
import { uploadToR2 } from './lib/r2-upload';
import { writeChapters, updateBookArtifacts, getBookForIngest } from './lib/db-write';

const program = new Command();

program
  .name('ingest')
  .description('Ingest a manuscript into ScienceOne')
  .requiredOption('-i, --input <path>', 'Path to manuscript file (.tex, .docx, .md)')
  .requiredOption('-b, --book-id <id>', 'Existing Book ID in the database')
  .option('-f, --format <format>', 'Input format override (latex|docx|markdown); auto-detected from extension if omitted')
  .option('--dry-run', 'Convert and report without writing to DB or uploading to R2')
  .option('--skip-pdf', 'Skip PDF generation (useful when xelatex not installed)')
  .option('--skip-epub', 'Skip EPUB generation')
  .option('--skip-r2', 'Skip R2 upload (useful for local testing without R2 credentials)')
  .action(async (opts) => {
    try {
      await run(opts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\nError: ${msg}`));
      process.exit(1);
    }
  });

program.parse();

interface RunOptions {
  input: string;
  bookId: string;
  format?: string;
  dryRun?: boolean;
  skipPdf?: boolean;
  skipEpub?: boolean;
  skipR2?: boolean;
}

async function run(opts: RunOptions): Promise<void> {
  const { input: inputFile, bookId, dryRun, skipPdf, skipEpub, skipR2 } = opts;

  // ── 1. Validate inputs ───────────────────────────────────────────────────

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

  // ── 2. Convert to HTML ───────────────────────────────────────────────────

  console.log(chalk.cyan('\n[1/6] Converting to HTML...'));
  const { html, stderr: pandocStderr } = await convertToHtml(inputFile, format);
  console.log(chalk.green(`Converted to HTML (${html.length} chars)`));

  // ── 3. Pre-render math ───────────────────────────────────────────────────

  console.log(chalk.cyan('\n[2/6] Pre-rendering math...'));
  const mathErrors: string[] = [];
  const processedHtml = preRenderMath(html, mathErrors);
  if (mathErrors.length === 0) {
    console.log(chalk.green(`Pre-rendered math (0 errors)`));
  } else {
    console.log(chalk.yellow(`Pre-rendered math (${mathErrors.length} errors)`));
  }

  // ── 4. Split chapters ────────────────────────────────────────────────────

  console.log(chalk.cyan('\n[3/6] Splitting chapters...'));
  const chapters = splitChapters(processedHtml);
  console.log(chalk.green(`Split into ${chapters.length} chapters`));

  // ── 5. Build health report ───────────────────────────────────────────────

  console.log(chalk.cyan('\n[4/6] Health report...'));
  const report = buildHealthReport(inputFile, format, pandocStderr, mathErrors, chapters.length);
  printHealthReport(report);

  if (report.halted) {
    console.error(chalk.red('\nPipeline halted — fix errors above before ingesting.'));
    process.exit(1);
  }

  // ── 6. Generate PDF ──────────────────────────────────────────────────────

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

  // ── 7. Generate EPUB ─────────────────────────────────────────────────────

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

  // ── 8. Upload to R2 ──────────────────────────────────────────────────────

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

  // ── 9. Write to database ─────────────────────────────────────────────────

  if (!dryRun) {
    console.log(chalk.cyan('\nWriting to database...'));

    const count = await writeChapters(bookId, chapters);
    console.log(chalk.green(`Wrote ${count} chapters to database`));

    await updateBookArtifacts(bookId, pdfKey, epubKey);
    console.log(chalk.green('Updated Book with artifact keys'));
  }

  // ── 10. Summary ───────────────────────────────────────────────────────────

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
