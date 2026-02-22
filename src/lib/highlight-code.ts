import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light"],
      langs: ["python", "javascript", "bash", "json", "text"],
    });
  }
  return highlighterPromise;
}

/** Decode HTML entities that TipTap encodes inside code blocks. */
function decodeEntities(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

const CODE_BLOCK_RE =
  /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;

/**
 * Replace raw `<pre><code>` blocks with Shiki-highlighted HTML.
 * Designed for Server Components — zero client JS.
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html) return html;

  // Quick check: skip expensive regex if there are no code blocks
  if (!html.includes("<pre><code")) return html;

  const highlighter = await getHighlighter();
  const loadedLangs = highlighter.getLoadedLanguages();

  return html.replace(CODE_BLOCK_RE, (_match, lang: string | undefined, code: string) => {
    const language = lang && loadedLangs.includes(lang) ? lang : "text";
    const decoded = decodeEntities(code);

    const highlighted = highlighter.codeToHtml(decoded, {
      lang: language,
      theme: "github-light",
    });

    return `<div class="code-block-wrapper relative group not-prose">${highlighted}</div>`;
  });
}
