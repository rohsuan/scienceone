import { Node } from "@tiptap/core";

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
});
