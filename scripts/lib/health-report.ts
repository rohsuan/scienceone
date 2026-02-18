import chalk from 'chalk';

export interface HealthReport {
  inputFile: string;
  format: string;
  pandocWarnings: string[];
  mathErrors: string[];
  unsupportedCommands: string[];
  chapterCount: number;
  halted: boolean;
}

/**
 * Build a structured health report from pipeline outputs.
 *
 * Parses pandocStderr line-by-line:
 * - Lines containing [WARNING] or non-empty lines → pandocWarnings
 * - Lines containing "unknown" or "not supported" (case-insensitive) → unsupportedCommands
 *
 * halted = true when mathErrors.length > 0 OR unsupportedCommands.length > 0
 */
export function buildHealthReport(
  inputFile: string,
  format: string,
  pandocStderr: string,
  mathErrors: string[],
  chapterCount: number,
): HealthReport {
  const pandocWarnings: string[] = [];
  const unsupportedCommands: string[] = [];

  const lines = pandocStderr.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.includes('[WARNING]')) {
      pandocWarnings.push(trimmed);
    } else {
      pandocWarnings.push(trimmed);
    }

    const lc = trimmed.toLowerCase();
    if (lc.includes('unknown') || lc.includes('not supported')) {
      unsupportedCommands.push(trimmed);
    }
  }

  const halted = mathErrors.length > 0 || unsupportedCommands.length > 0;

  return {
    inputFile,
    format,
    pandocWarnings,
    mathErrors,
    unsupportedCommands,
    chapterCount,
    halted,
  };
}

/**
 * Print a colorized health report to stdout using chalk.
 */
export function printHealthReport(report: HealthReport): void {
  console.log(chalk.bold('=== Ingest Health Report ==='));
  console.log(`Input file : ${report.inputFile}`);
  console.log(`Format     : ${report.format}`);
  console.log(`Chapters   : ${report.chapterCount}`);

  if (report.pandocWarnings.length > 0) {
    console.log(chalk.yellow('\nPandoc Warnings:'));
    for (const w of report.pandocWarnings) {
      console.log(chalk.yellow(`  ${w}`));
    }
  }

  if (report.mathErrors.length > 0) {
    console.log(chalk.red('\nMath Errors:'));
    for (const e of report.mathErrors) {
      console.log(chalk.red(`  ${e}`));
    }
  }

  if (report.unsupportedCommands.length > 0) {
    console.log(chalk.red('\nUnsupported Commands:'));
    for (const c of report.unsupportedCommands) {
      console.log(chalk.red(`  ${c}`));
    }
  }

  if (report.halted) {
    console.log(
      chalk.bold.red('\nHALTED: Pipeline stopped due to errors above'),
    );
  } else if (
    report.pandocWarnings.length === 0 &&
    report.mathErrors.length === 0 &&
    report.unsupportedCommands.length === 0
  ) {
    console.log(chalk.green('\nOK: No issues detected'));
  } else {
    console.log(chalk.yellow('\nPASSED WITH WARNINGS'));
  }
}
