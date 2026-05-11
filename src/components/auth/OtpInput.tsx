import { useEffect, useRef } from "react";

type Props = {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	autoFocus?: boolean;
	length?: number;
};

// 6-digit OTP input that splits one logical value across N boxes.
// Backspace on an empty box jumps to the previous box; paste of a multi-digit
// string fills boxes left-to-right and focuses the next empty one.
// Submission is explicit — parent owns the button. Auto-submit on length match
// was tried first; we abandoned it because users wanted a chance to verify the
// pasted code before sending.
export default function OtpInput({ value, onChange, disabled, autoFocus, length = 6 }: Props) {
	const refs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (autoFocus) refs.current[0]?.focus();
	}, [autoFocus]);

	const setDigit = (index: number, digit: string) => {
		const sanitized = digit.replace(/\D/g, "").slice(0, 1);
		const arr = value.padEnd(length, " ").split("");
		arr[index] = sanitized || " ";
		// Trim only trailing spaces — preserve gaps in the middle so we don't
		// reorder digits unexpectedly when the user edits a non-final box.
		const next = arr.join("").replace(/ +$/, "");
		onChange(next);
		if (sanitized && index < length - 1) {
			refs.current[index + 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
		const text = e.clipboardData.getData("text").replace(/\D/g, "");
		if (!text) return;
		e.preventDefault();
		const arr = value.padEnd(length, " ").split("");
		for (let i = 0; i < text.length && index + i < length; i++) {
			arr[index + i] = text[i];
		}
		const next = arr.join("").replace(/ +$/, "");
		onChange(next);
		const focusIdx = Math.min(index + text.length, length - 1);
		refs.current[focusIdx]?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === "Backspace" && !value[index] && index > 0) {
			refs.current[index - 1]?.focus();
		} else if (e.key === "ArrowLeft" && index > 0) {
			refs.current[index - 1]?.focus();
		} else if (e.key === "ArrowRight" && index < length - 1) {
			refs.current[index + 1]?.focus();
		}
	};

	return (
		<div className="flex items-center justify-center gap-2" role="group" aria-label="One-time code">
			{Array.from({ length }).map((_, i) => (
				<input
					key={i}
					ref={(el) => {
						refs.current[i] = el;
					}}
					type="text"
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={1}
					value={value[i] ?? ""}
					onChange={(e) => setDigit(i, e.target.value)}
					onPaste={(e) => handlePaste(e, i)}
					onKeyDown={(e) => handleKeyDown(e, i)}
					onFocus={(e) => e.target.select()}
					disabled={disabled}
					aria-label={`Digit ${i + 1}`}
					className="border-brand-border text-brand-dark focus:border-brand focus:ring-brand/20 h-12 w-10 rounded-xl border bg-white text-center text-lg font-medium outline-none focus:ring-2 disabled:opacity-60 sm:h-14 sm:w-12 sm:text-xl"
				/>
			))}
		</div>
	);
}
