import { useEffect, useState } from "react";
import { Check, Copy, Link as LinkIcon, X } from "lucide-react";

interface Props {
	open: boolean;
	onClose: () => void;
	url: string;
	title: string;
	// Backend share-preview URL. Social crawlers can't execute the SPA's JS,
	// so they fetch this URL instead — the backend serves a tiny HTML page
	// with the right OG tags and redirects humans to the SPA. When omitted,
	// social shares fall back to the canonical SPA URL (no rich preview).
	shareUrl?: string;
}

const ShareIcon = {
	Facebook: () => (
		<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
		</svg>
	),
	X: () => (
		<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	),
	LinkedIn: () => (
		<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	),
	Threads: () => (
		<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.066-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89-.029 0-.057 0-.085 0-.846 0-1.991.232-2.721 1.32L7.34 8.073c.98-1.452 2.568-2.25 4.565-2.25h.137c3.341.02 5.331 2.07 5.53 5.643.114.048.226.097.336.149 1.523.715 2.638 1.799 3.222 3.135.811 1.851.886 4.873-1.565 7.272C18.046 22.85 16.024 23.967 12.186 24Z" />
		</svg>
	),
};

export default function ShareModal({ open, onClose, url, title, shareUrl }: Props) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onClose]);

	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

	if (!open) return null;

	// Social shares hit the backend share route so crawlers see real OG tags.
	// Copy-link still uses the canonical SPA URL — humans pasting it want a
	// link that goes straight to the page, not the redirect proxy.
	const targetUrl = shareUrl ?? url;
	const encodedUrl = encodeURIComponent(targetUrl);
	const encodedTitle = encodeURIComponent(title);

	const shareTargets: {
		key: string;
		label: string;
		href: string;
		brand: string;
		Icon: () => React.ReactElement;
	}[] = [
		{
			key: "facebook",
			label: "Share on Facebook",
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			brand: "hover:text-[#1877f2]",
			Icon: ShareIcon.Facebook,
		},
		{
			key: "x",
			label: "Share on X",
			href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
			brand: "hover:text-black",
			Icon: ShareIcon.X,
		},
		{
			key: "linkedin",
			label: "Share on LinkedIn",
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			brand: "hover:text-[#0a66c2]",
			Icon: ShareIcon.LinkedIn,
		},
		{
			key: "threads",
			label: "Share on Threads",
			href: `https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
			brand: "hover:text-black",
			Icon: ShareIcon.Threads,
		},
	];

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			// Clipboard write can fail on insecure origins or when the user
			// denies permission — silent failure; the inline "Copied" badge
			// just won't appear, which is signal enough that nothing happened.
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="share-modal-title"
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 id="share-modal-title" className="text-brand-dark font-serif text-xl font-bold">
						Share this post
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="text-brand-mid hover:text-brand-dark rounded-full p-1 transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<button
					type="button"
					onClick={copyLink}
					className="border-brand-border hover:bg-brand-hero flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left text-sm transition-colors"
				>
					{copied ? (
						<Check className="text-brand h-5 w-5 shrink-0" />
					) : (
						<LinkIcon className="text-brand-mid h-5 w-5 shrink-0" />
					)}
					<span className="text-brand-dark flex-1 truncate">{url}</span>
					<span
						className={`flex shrink-0 items-center gap-1 text-xs font-medium ${
							copied ? "text-brand" : "text-brand-mid"
						}`}
					>
						<Copy className="h-3.5 w-3.5" />
						{copied ? "Copied" : "Copy"}
					</span>
				</button>

				<div className="mt-5">
					<p className="text-brand-mid mb-3 text-xs font-semibold tracking-widest uppercase">
						Share to
					</p>
					<div className="grid grid-cols-4 gap-2">
						{shareTargets.map(({ key, label, href, brand, Icon }) => (
							<a
								key={key}
								href={href}
								target="_blank"
								rel="noreferrer noopener"
								aria-label={label}
								className={`border-brand-border hover:border-brand-mid flex flex-col items-center gap-1.5 rounded-lg border bg-white px-2 py-3 text-gray-600 transition-colors ${brand}`}
							>
								<Icon />
							</a>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
