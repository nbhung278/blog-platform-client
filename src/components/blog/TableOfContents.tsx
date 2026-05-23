interface TableOfContentsProps {
	content: string;
}

interface TocItem {
	level: number;
	text: string;
	id: string;
}

const HEADING_RE = /^(#{1,3})\s+(.+)/;

export default function TableOfContents({ content }: TableOfContentsProps) {
	const headings: TocItem[] = [];
	const lines = content.split("\n");

	for (const line of lines) {
		const match = line.match(HEADING_RE);
		if (match) {
			const level = match[1].length;
			const text = match[2];
			const id = text
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-");
			headings.push({ level, text, id });
		}
	}

	if (headings.length === 0) return null;

	return (
		<nav className="dark:border-brand-border dark:bg-brand-surface mb-8 rounded-lg border bg-gray-50 p-4">
			<h3 className="dark:text-brand-dark mb-2 font-semibold">Table of Contents</h3>
			<ul className="space-y-1 text-sm">
				{headings.map((h, i) => (
					<li key={i} style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
						<a href={`#${h.id}`} className="text-blue-600 hover:underline">
							{h.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
