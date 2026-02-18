import katex from 'katex';
import * as cheerio from 'cheerio';

/**
 * Post-process Pandoc HTML to replace math spans with pre-rendered KaTeX HTML.
 * Pandoc emits:
 *   <span class="math inline">...</span>  for inline math
 *   <span class="math display">...</span> for display math
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
    const tex = $(el).text();
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
    const tex = $(el).text();
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
