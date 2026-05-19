interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description?: string;
	confirmLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	loading?: boolean;
}

export default function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Delete",
	onConfirm,
	onCancel,
	loading = false,
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onCancel();
			}}
		>
			<div className="border-brand-border bg-brand-cream w-full max-w-sm rounded-2xl border p-6 shadow-xl">
				<h3 className="text-brand-dark font-serif text-base font-semibold">{title}</h3>
				{description && <p className="text-brand-mid mt-1.5 text-sm">{description}</p>}
				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="text-brand-mid hover:text-brand-dark hover:bg-brand-hero rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
					>
						{loading ? "Deleting…" : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
