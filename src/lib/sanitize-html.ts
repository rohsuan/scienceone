import sanitizeHtmlLib from "sanitize-html";

/**
 * Shared HTML sanitizer for all user-generated content rendered with
 * dangerouslySetInnerHTML. Strips XSS vectors (script, iframe, on* events)
 * while preserving safe formatting tags, KaTeX/MathML, code blocks, and images.
 *
 * This is the single source of truth for allowed HTML — used in public pages
 * (blog, resources, simulations) and admin content saving (admin-actions.ts).
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  return sanitizeHtmlLib(html, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      // Extended formatting
      "pre",
      "code",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "figure",
      "figcaption",
      // KaTeX / MathML
      "span",
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "mfrac",
      "mover",
      "munder",
      "msqrt",
      "mroot",
      "mtable",
      "mtr",
      "mtd",
      "annotation",
      "mspace",
      "mtext",
      "menclose",
      "mpadded",
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      // Global attributes safe for all elements
      "*": ["class", "style", "aria-hidden", "role"],
      // Links
      a: [
        ...(sanitizeHtmlLib.defaults.allowedAttributes.a ?? []),
        "target",
        "rel",
      ],
      // Images
      img: ["src", "alt", "width", "height", "loading"],
      // Code blocks (for syntax highlighting class names)
      code: ["class"],
      // MathML attributes
      math: ["xmlns"],
      annotation: ["encoding"],
      mo: ["mathvariant", "stretchy", "fence", "separator"],
      mi: ["mathvariant"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Explicitly disallowed — belt-and-suspenders on top of the allowlist
    disallowedTagsMode: "discard",
  });
}
