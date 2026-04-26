import DOMPurify from "isomorphic-dompurify";

// Sanitize HTML produced by the Tiptap editor before rendering with
// dangerouslySetInnerHTML. Allowlist is intentionally narrow — extend only
// when the editor gains new node types.
const ALLOWED_TAGS = [
	"p",
	"br",
	"hr",
	"h1",
	"h2",
	"h3",
	"h4",
	"strong",
	"em",
	"u",
	"s",
	"code",
	"pre",
	"blockquote",
	"ul",
	"ol",
	"li",
	"a",
	"img",
	"figure",
	"figcaption",
	"span",
	"div",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class"];

export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		// Force external links to be safe.
		ADD_ATTR: ["target", "rel"],
	});
}
