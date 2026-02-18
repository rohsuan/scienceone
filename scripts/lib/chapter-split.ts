import * as cheerio from 'cheerio';

export interface Chapter {
  title: string;
  slug: string;
  content: string;
  position: number;
}

/**
 * Generate a URL-safe slug from a heading text.
 * Lowercase, replace non-alphanumeric chars with hyphens,
 * collapse consecutive hyphens, trim leading/trailing hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Split full-document HTML into Chapter objects by h1 headings.
 *
 * Each chapter's `content` includes:
 * - The h1 element itself
 * - All following sibling elements until the next h1
 *
 * If no h1 elements are found, a single chapter "Chapter 1" is returned
 * containing the entire HTML as content.
 *
 * @param html - Full or partial HTML string (Pandoc output)
 * @returns    - Array of Chapter objects, position starting at 0
 */
export function splitChapters(html: string): Chapter[] {
  const $ = cheerio.load(html);
  const h1Elements = $('h1');

  if (h1Elements.length === 0) {
    return [
      {
        title: 'Chapter 1',
        slug: 'chapter-1',
        content: html,
        position: 0,
      },
    ];
  }

  const chapters: Chapter[] = [];

  h1Elements.each((i, h1El) => {
    const $h1 = $(h1El);
    const title = $h1.text().trim();
    const slug = slugify(title) || `chapter-${i + 1}`;

    // Collect h1 HTML + following siblings until next h1
    let content = $.html(h1El);
    let next = $h1.next();

    while (next.length > 0 && !next.is('h1')) {
      content += $.html(next);
      next = next.next();
    }

    chapters.push({
      title,
      slug,
      content,
      position: i,
    });
  });

  return chapters;
}
