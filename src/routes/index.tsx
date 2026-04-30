import { lazy } from "react";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import App from "@/App";

const HomePage = lazy(() => import("./home"));
const LoginPage = lazy(() => import("./login"));
const RegisterPage = lazy(() => import("./register"));
const EditorPage = lazy(() => import("./editor"));
const BlogUserPage = lazy(() => import("./blog.$username"));
const BlogPostPage = lazy(() => import("./blog.$username.$slug"));
const SearchPage = lazy(() => import("./search"));
const CategoryPage = lazy(() => import("./category.$name"));
const NotificationsPage = lazy(() => import("./notifications"));
const SavedPage = lazy(() => import("./saved"));
const SettingsProfilePage = lazy(() => import("./settings.profile"));

const rootRoute = createRootRoute({
	component: App,
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

const editorRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/editor/$postId",
	component: EditorPage,
});

const newPostRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/editor/new",
	component: EditorPage,
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
	validateSearch: (search: Record<string, unknown>) => ({
		q: String(search.q ?? ""),
	}),
});

const categoryRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/category/$name",
	component: CategoryPage,
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
	component: SettingsProfilePage,
});

export const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	newPostRoute,
	editorRoute,
	blogUserRoute,
	blogPostRoute,
	searchRoute,
	categoryRoute,
	notificationsRoute,
	savedRoute,
	settingsProfileRoute,
]);
