import { Node } from "@tiptap/core";
import katex from "katex";

/** Parse rawHTML into a DOM element, falling back to an empty span. */
function buildDom(rawHTML: string | null, fallbackClass: string): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.innerHTML = rawHTML ?? "";
  return (wrapper.firstElementChild as HTMLElement) ?? (() => {
    const el = document.createElement("span");
    el.className = fallbackClass;
    return el;
  })();
}

/**
 * Extract the original LaTeX source from KaTeX's rendered HTML.
 * KaTeX embeds it inside `<annotation encoding="application/x-tex">`.
 */
function extractLatex(rawHTML: string): string {
  const match = rawHTML.match(
    /<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/,
  );
  return match ? match[1] : "";
}

/**
 * Inline KaTeX atom — preserves <span class="katex"> blocks as opaque nodes.
 */
export const KatexInline = Node.create({
  name: "katexInline",
  group: "inline",
  inline: true,
  atom: true,

  parseHTML() {
    return [
      {
        tag: "span.katex",
        getAttrs(node) {
          const el = node as HTMLElement;
          if (el.closest(".katex-display")) return false;
          return null;
        },
      },
    ];
  },

  addAttributes() {
    return {
      rawHTML: {
        default: null,
        parseHTML(element) {
          return (element as HTMLElement).outerHTML;
        },
        renderHTML() {
          // rawHTML is only used by addNodeView, not serialized as an attribute
          return {};
        },
      },
    };
  },

  renderHTML({ node }) {
    return buildDom(node.attrs.rawHTML, "katex");
  },

  addNodeView() {
    return ({ node }) => ({
      dom: buildDom(node.attrs.rawHTML, "katex"),
    });
  },

  markdownTokenizer: {
    name: "katexInline",
    level: "inline" as const,
    start: (src: string) => {
      const idx = src.indexOf("$");
      // Skip $$ (handled by block tokenizer)
      if (idx >= 0 && src[idx + 1] === "$") return -1;
      return idx;
    },
    tokenize(src: string) {
      // Match $...$ but not $$
      const match = src.match(/^\$([^\$]+?)\$/);
      if (!match) return;
      return {
        type: "katexInline",
        raw: match[0],
        text: match[1],
      };
    },
  },

  parseMarkdown(token) {
    const latex = token.text ?? "";
    const rendered = katex.renderToString(latex, {
      displayMode: false,
      throwOnError: false,
    });
    return {
      type: "katexInline",
      attrs: { rawHTML: rendered },
    };
  },

  renderMarkdown(node) {
    const latex = extractLatex(node.attrs?.rawHTML || "");
    return `$${latex}$`;
  },
});

/**
 * Block KaTeX atom — preserves <span class="katex-display"> blocks as opaque nodes.
 */
export const KatexBlock = Node.create({
  name: "katexBlock",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: "span.katex-display" }];
  },

  addAttributes() {
    return {
      rawHTML: {
        default: null,
        parseHTML(element) {
          return (element as HTMLElement).outerHTML;
        },
        renderHTML() {
          return {};
        },
      },
    };
  },

  renderHTML({ node }) {
    return buildDom(node.attrs.rawHTML, "katex-display");
  },

  addNodeView() {
    return ({ node }) => ({
      dom: buildDom(node.attrs.rawHTML, "katex-display"),
    });
  },

  markdownTokenizer: {
    name: "katexBlock",
    level: "block" as const,
    start: (src: string) => src.indexOf("$$"),
    tokenize(src: string) {
      const match = src.match(/^\$\$([\s\S]+?)\$\$/);
      if (!match) return;
      return {
        type: "katexBlock",
        raw: match[0],
        text: match[1].trim(),
      };
    },
  },

  parseMarkdown(token) {
    const latex = token.text ?? "";
    const rendered = katex.renderToString(latex, {
      displayMode: true,
      throwOnError: false,
    });
    const rawHTML = `<span class="katex-display">${rendered}</span>`;
    return {
      type: "katexBlock",
      attrs: { rawHTML },
    };
  },

  renderMarkdown(node) {
    const latex = extractLatex(node.attrs?.rawHTML || "");
    return `$$${latex}$$\n\n`;
  },
});
