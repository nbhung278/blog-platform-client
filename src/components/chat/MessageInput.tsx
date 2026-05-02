import { useState, useRef, type KeyboardEvent } from "react";
import { uploadsApi } from "@/lib/uploadsApi";
import { notify } from "@/lib/notify";

interface Props {
	onSend: (data: { content?: string; imageUrl?: string }) => void;
	disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
	const [text, setText] = useState("");
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	function handleSend() {
		const content = text.trim();
		if (!content || disabled) return;
		onSend({ content });
		setText("");
	}

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
			e.preventDefault();
			handleSend();
		}
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			notify.error("Only image files are supported");
			return;
		}
		setUploading(true);
		try {
			const { url } = await uploadsApi.uploadImage(file);
			onSend({ imageUrl: url });
		} catch {
			notify.error("Failed to upload image");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	}

	return (
		<div className="border-brand-border bg-brand-cream flex items-end gap-2 border-t px-4 py-3">
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>

			<button
				type="button"
				onClick={() => fileRef.current?.click()}
				disabled={uploading || disabled}
				className="text-brand-mid hover:text-brand mb-1 shrink-0 transition-colors disabled:opacity-40"
				aria-label="Attach image"
			>
				{uploading ? (
					<svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
					</svg>
				) : (
					<svg
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
						/>
					</svg>
				)}
			</button>

			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type a message… (Enter to send)"
				rows={1}
				disabled={disabled}
				className="text-brand-dark placeholder:text-brand-mid flex-1 resize-none bg-transparent text-sm outline-none"
				style={{ maxHeight: "6rem", overflowY: "auto" }}
				onInput={(e) => {
					const el = e.currentTarget;
					el.style.height = "auto";
					el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
				}}
			/>

			<button
				type="button"
				onClick={handleSend}
				disabled={!text.trim() || disabled}
				className="bg-brand hover:bg-brand-dark mb-1 shrink-0 rounded-full p-1.5 text-white transition-colors disabled:opacity-40"
				aria-label="Send message"
			>
				<svg
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	);
}
