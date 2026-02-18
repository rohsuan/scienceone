import { spawn } from 'child_process';
import path from 'path';

/**
 * Spawn pandoc with the given args array.
 * cwd is set so that LaTeX \input/\include can resolve relative paths.
 * Returns { stdout, stderr } on success (exit code 0).
 * Throws an Error containing stderr on non-zero exit code.
 */
export function runPandoc(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pandoc', args, {
      cwd: cwd ?? process.cwd(),
      // Do NOT use shell: true — paths must never be shell-interpolated
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn pandoc: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `pandoc exited with code ${code}`));
      }
    });
  });
}

/**
 * Map a file extension to a Pandoc input format.
 * Throws for unsupported extensions.
 */
export function detectFormat(filePath: string): 'latex' | 'docx' | 'markdown' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.tex') return 'latex';
  if (ext === '.docx') return 'docx';
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  throw new Error(`Unsupported file extension: ${ext} (${filePath})`);
}

/**
 * Convert an input file to an HTML fragment.
 * Sets cwd to the file's directory so relative \input/\include calls resolve correctly.
 * Does NOT use -s (standalone) — returns an HTML fragment, not a full document.
 */
export async function convertToHtml(
  inputFile: string,
  format: string,
): Promise<{ html: string; stderr: string }> {
  const absPath = path.resolve(inputFile);
  const cwd = path.dirname(absPath);
  const base = path.basename(absPath);

  let args: string[];
  switch (format) {
    case 'latex':
      args = ['-f', 'latex+raw_tex', '-t', 'html5', '--no-highlight', base];
      break;
    case 'docx':
      args = ['-f', 'docx', '-t', 'html5', '--extract-media', './media', base];
      break;
    case 'markdown':
      args = ['-f', 'markdown', '-t', 'html5', base];
      break;
    default:
      throw new Error(`Unknown format: ${format}`);
  }

  const { stdout: html, stderr } = await runPandoc(args, cwd);
  return { html, stderr };
}

/**
 * Convert an input file to PDF using xelatex.
 * Returns the output file path and any stderr warnings.
 */
export async function convertToPdf(
  inputFile: string,
): Promise<{ outputPath: string; stderr: string }> {
  const absPath = path.resolve(inputFile);
  const cwd = path.dirname(absPath);
  const base = path.basename(absPath, path.extname(absPath));
  const outputPath = path.join(cwd, `${base}.pdf`);
  const format = detectFormat(inputFile);

  const args = [
    '-f',
    format,
    '--pdf-engine=xelatex',
    '--pdf-engine-opt=-halt-on-error',
    path.basename(absPath),
    '-o',
    outputPath,
  ];

  const { stderr } = await runPandoc(args, cwd);
  return { outputPath, stderr };
}

/**
 * Convert an input file to EPUB3 with a table of contents.
 * Returns the output file path and any stderr warnings.
 */
export async function convertToEpub(
  inputFile: string,
): Promise<{ outputPath: string; stderr: string }> {
  const absPath = path.resolve(inputFile);
  const cwd = path.dirname(absPath);
  const base = path.basename(absPath, path.extname(absPath));
  const outputPath = path.join(cwd, `${base}.epub`);
  const format = detectFormat(inputFile);

  const args = [
    '-f',
    format,
    '-t',
    'epub3',
    '--toc',
    '--toc-depth=2',
    path.basename(absPath),
    '-o',
    outputPath,
  ];

  const { stderr } = await runPandoc(args, cwd);
  return { outputPath, stderr };
}
