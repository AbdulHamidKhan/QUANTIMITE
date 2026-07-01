import sanitizeHtml from "sanitize-html";

const ARTICLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "u",
    "a", "blockquote", "code", "pre", "img", "br", "hr", "table", "thead",
    "tbody", "tr", "td", "th", "span", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class", "id"],
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
  },
};

export function sanitizeArticleHtml(input: string): string {
  return sanitizeHtml(input, ARTICLE_OPTIONS);
}

export function plainExcerpt(html: string, max = 180): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}