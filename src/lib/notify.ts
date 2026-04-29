import { toast } from "sonner";

// Thin wrapper over `sonner`'s toast API so we have a single import point in
// the rest of the app. If we ever swap the toast engine, we change this file
// only. Default options also live here (close button, position) so individual
// callers don't drift.
type ToastId = string | number;
interface NotifyOptions {
	id?: ToastId;
	description?: string;
	duration?: number;
}

export const notify = {
	success(message: string, opts?: NotifyOptions) {
		return toast.success(message, opts);
	},
	error(message: string, opts?: NotifyOptions) {
		return toast.error(message, opts);
	},
	info(message: string, opts?: NotifyOptions) {
		return toast.info(message, opts);
	},
	loading(message: string, opts?: NotifyOptions) {
		return toast.loading(message, opts);
	},
	dismiss(id?: ToastId) {
		toast.dismiss(id);
	},
};

export type { ToastId };
