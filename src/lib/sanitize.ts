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

// Returns the URL only if it parses to http(s). Rejects javascript:, data:,
// file: etc. Use this before binding user-controlled URLs to `<img src>` or
// `<a href>` so a tampered avatar field can't run scripts.
export function safeImageUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url, window.location.origin);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		return parsed.toString();
	} catch {
		return null;
	}
}
