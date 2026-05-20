import { lazy, type ComponentType, type ReactElement } from "react";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import App from "@/App";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginPage from "./login";
import RegisterPage from "./register";
import ForgotPasswordPage from "./forgot-password";
import ResetPasswordPage from "./reset-password";
import GoogleSuccessPage from "./auth.google-success";
import NotFoundPage from "./not-found";

// Wrap a route component in its own ErrorBoundary. Without per-route
// boundaries, a runtime error in /chat/$id would unmount everything up to the
// root boundary — including the realtime bridge and notification panel — so a
// rare bug in one feature would knock out the whole app. Each major route gets
// an "isolation cell" instead.
//
// Return a typed function component (not a generic ComponentType) so
// TanStack Router's `RouteComponent` constraint accepts it.
function withBoundary(Component: ComponentType): () => ReactElement {
	return function Boundaried() {
		return (
			<ErrorBoundary scope="section">
				<Component />
			</ErrorBoundary>
		);
	};
}

const HomePage = lazy(() => import("./home"));
const EditorPage = lazy(() => import("./editor"));
const BlogUserPage = lazy(() => import("./blog.$username"));
const BlogPostPage = lazy(() => import("./blog.$username.$slug"));
const SearchPage = lazy(() => import("./search"));
const CategoryPage = lazy(() => import("./category.$name"));
const NotificationsPage = lazy(() => import("./notifications"));
const SavedPage = lazy(() => import("./saved"));
const SettingsProfilePage = lazy(() => import("./settings.profile"));
const ChatPage = lazy(() => import("./chat"));
const ChatConversationPage = lazy(() => import("./chat.$conversationId"));
const AboutPage = lazy(() => import("./about"));
const ContactPage = lazy(() => import("./contact"));
const PrivacyPage = lazy(() => import("./privacy"));

const rootRoute = createRootRoute({
	component: App,
	// Without this, unmatched paths render an empty Outlet and the user sees a
	// blank page — looks like a crashed app rather than "we don't have that
	// page". Define here so it covers every unmatched child route too.
	notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: LoginPage,
});

const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/register",
	component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/forgot-password",
	component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/reset-password",
	component: ResetPasswordPage,
	validateSearch: (
		search: Record<string, unknown>,
	): { token: string; email: string; dev?: string } => ({
		token: String(search.token ?? ""),
		email: String(search.email ?? ""),
		...(search.dev ? { dev: String(search.dev) } : {}),
	}),
});

const googleSuccessRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/auth/google-success",
	component: GoogleSuccessPage,
});

const editorRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/editor/$postId",
	component: withBoundary(EditorPage),
});

const blogUserRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/blog/$username",
	component: BlogUserPage,
});

const blogPostRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/blog/$username/$slug",
	component: BlogPostPage,
});

const searchRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/search",
	component: SearchPage,
	validateSearch: (search: Record<string, unknown>): { q: string; page?: number } => ({
		q: String(search.q ?? ""),
		page: search.page !== undefined ? Math.max(Number(search.page) || 1, 1) : undefined,
	}),
});

const categoryRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/category/$name",
	component: CategoryPage,
	validateSearch: (search: Record<string, unknown>): { page?: number } => ({
		page: search.page !== undefined ? Math.max(Number(search.page) || 1, 1) : undefined,
	}),
});

const notificationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/notifications",
	component: NotificationsPage,
});

const savedRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/saved",
	component: SavedPage,
});

const settingsProfileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/profile",
	component: withBoundary(SettingsProfilePage),
});

const chatRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/chat",
	component: withBoundary(ChatPage),
});

const chatConversationRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/chat/$conversationId",
	component: withBoundary(ChatConversationPage),
});

const aboutRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/about",
	component: AboutPage,
});

const contactRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/contact",
	component: ContactPage,
});

const privacyRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/privacy",
	component: PrivacyPage,
});

export const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	forgotPasswordRoute,
	resetPasswordRoute,
	googleSuccessRoute,
	editorRoute,
	blogUserRoute,
	blogPostRoute,
	searchRoute,
	categoryRoute,
	notificationsRoute,
	savedRoute,
	settingsProfileRoute,
	chatRoute,
	chatConversationRoute,
	aboutRoute,
	contactRoute,
	privacyRoute,
]);
