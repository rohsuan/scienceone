import katex from 'katex';
import * as cheerio from 'cheerio';

/**
 * Strip Pandoc-emitted math delimiters from span text content.
 *
 * When Pandoc cannot parse a LaTeX equation environment it falls back to
 * rendering the raw TeX wrapped in dollar-sign delimiters:
 *   display math → "$$\begin{equation}...\end{equation}$$"
 *   inline math  → "$\frac{d}{dx}...$"
 *
 * KaTeX does not accept delimiters inside math mode, so we strip them here
 * before passing the content to KaTeX.
 *
 * Also strips \begin{equation}/\end{equation} wrappers since KaTeX handles
 * the math content directly in display mode.
 */
function stripMathDelimiters(tex: string, display: boolean): string {
  let s = tex.trim();

  if (display) {
    // Strip outer $$ ... $$ or \[ ... \]
    if (s.startsWith('$$') && s.endsWith('$$')) {
      s = s.slice(2, -2).trim();
    } else if (s.startsWith('\\[') && s.endsWith('\\]')) {
      s = s.slice(2, -2).trim();
    }
    // Strip \begin{equation}/\end{equation} wrappers
    s = s
      .replace(/^\\begin\{equation\*?\}/, '')
      .replace(/\\end\{equation\*?\}$/, '')
      .trim();
  } else {
    // Strip outer $ ... $ (but not $$)
    if (s.startsWith('$') && s.endsWith('$') && !s.startsWith('$$')) {
      s = s.slice(1, -1).trim();
    } else if (s.startsWith('\\(') && s.endsWith('\\)')) {
      s = s.slice(2, -2).trim();
    }
  }

  return s;
}

/**
 * Post-process Pandoc HTML to replace math spans with pre-rendered KaTeX HTML.
 * Pandoc emits:
 *   <span class="math inline">...</span>  for inline math
 *   <span class="math display">...</span> for display math
 *
 * When Pandoc cannot parse LaTeX equation environments it falls back to raw
 * TeX rendering with delimiter wrappers ($$...$$, $...$). This function
 * normalises those cases before passing content to KaTeX.
 *
 * This function replaces those spans with static KaTeX HTML that requires
 * NO client-side JavaScript at read time.
 *
 * @param html   - Full or partial HTML string from Pandoc
 * @param errors - Mutable array; KaTeX errors are appended here
 * @returns      - Processed HTML string
 */
export function preRenderMath(html: string, errors: string[]): string {
  const $ = cheerio.load(html, { xmlMode: false });

  // Process inline math: <span class="math inline">...</span>
  $('span.math.inline').each((_i, el) => {
    const raw = $(el).text();
    const tex = stripMathDelimiters(raw, false);
    try {
      const rendered = katex.renderToString(tex, {
        displayMode: false,
        throwOnError: true,
        output: 'html',
      });
      $(el).replaceWith(rendered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Inline math error: ${msg} — LaTeX: ${tex}`);
      $(el).replaceWith(
        `<span class="math-error" data-latex="${escapeAttr(tex)}">[MATH ERROR]</span>`,
      );
    }
  });

  // Process display math: <span class="math display">...</span>
  $('span.math.display').each((_i, el) => {
    const raw = $(el).text();
    const tex = stripMathDelimiters(raw, true);
    try {
      const rendered = katex.renderToString(tex, {
        displayMode: true,
        throwOnError: true,
        output: 'html',
      });
      $(el).replaceWith(rendered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Display math error: ${msg} — LaTeX: ${tex}`);
      $(el).replaceWith(
        `<div class="math-error" data-latex="${escapeAttr(tex)}">[MATH ERROR]</div>`,
      );
    }
  });

  return $.html();
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
