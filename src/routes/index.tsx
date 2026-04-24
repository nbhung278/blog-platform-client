import { createRootRoute, createRoute } from "@tanstack/react-router";
import App from "@/App";
import LandingPage from "./landing";
import LoginPage from "./login";
import RegisterPage from "./register";
import DashboardPage from "./dashboard";
import EditorPage from "./editor";
import BlogUserPage from "./blog.$username";
import BlogPostPage from "./blog.$username.$slug";

const rootRoute = createRootRoute({
	component: App,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: LandingPage,
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

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/dashboard",
	component: DashboardPage,
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

export const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	newPostRoute,
	editorRoute,
	blogUserRoute,
	blogPostRoute,
]);
