import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger";
}

export default function Button({
	variant = "primary",
	className = "",
	children,
	...props
}: ButtonProps) {
	const base = "rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";
	const variants = {
		primary: "bg-blue-600 text-white hover:bg-blue-700",
		secondary: "border border-gray-300 hover:bg-gray-50",
		danger: "border border-red-200 text-red-600 hover:bg-red-50",
	};

	return (
		<button className={`${base} ${variants[variant]} ${className}`} {...props}>
			{children}
		</button>
	);
}
