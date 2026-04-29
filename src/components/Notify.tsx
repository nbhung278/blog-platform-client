import { Toaster } from "sonner";

// Single mount point for app-wide toast notifications.
// Use the `notify` API in `@/lib/notify` to fire toasts from anywhere.
export default function Notify() {
	return <Toaster position="top-right" closeButton richColors duration={4000} />;
}
