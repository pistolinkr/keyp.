import DOMPurify, { type Config } from "dompurify";

/**
 * TipTap / post body HTML: allow semantic tags; block script, on* handlers, javascript: URLs.
 * Client-only (DOMPurify); run at render time after building HTML from markdown or editor.
 */
const CONFIG: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "code",
    "pre",
    "img",
    "span",
    "div",
    "hr",
  ],
  ALLOWED_ATTR: ["href", "title", "alt", "src", "class", "target", "rel", "width", "height"],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
};

export function sanitizePostBodyHtml(dirty: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  return DOMPurify.sanitize(dirty, CONFIG);
}
