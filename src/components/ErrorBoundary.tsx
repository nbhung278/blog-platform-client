import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	// When set, the boundary renders a compact, inline fallback instead of the
	// full-screen one — useful for per-route boundaries inside a layout that
	// already provides chrome.
	scope?: "page" | "section";
	fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
	error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[ErrorBoundary]", error, info.componentStack);
	}

	private reset = () => this.setState({ error: null });

	render() {
		if (this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.reset);
			}
			const isSection = this.props.scope === "section";
			return (
				<div
					className={
						isSection
							? "flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center"
							: "flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center"
					}
				>
					<p className="text-sm text-gray-500">
						Something went wrong loading this section. Please try again.
					</p>
					<button
						onClick={this.reset}
						className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
