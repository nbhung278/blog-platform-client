export interface User {
	id: string;
	email: string;
	name: string;
	username: string;
	bio: string | null;
	avatarUrl: string | null;
	plan: string;
}

export interface Post {
	id: string;
	userId: string;
	title: string;
	slug: string;
	contentMd: string;
	contentHtml: string;
	excerpt: string | null;
	coverUrl: string | null;
	ogImageUrl: string | null;
	status: "draft" | "pending" | "published" | "rejected";
	publishedAt: string | null;
	readingTime: number;
	viewCount: number;
	likeCount: number;
	tags: string[];
	metaTitle: string | null;
	metaDesc: string | null;
	version: number;
	createdAt: string;
	updatedAt: string;
	user?: Pick<User, "name" | "username" | "avatarUrl">;
}

export interface AuthResponse {
	token: string;
	user: Pick<User, "id" | "email" | "name" | "username">;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
}

export interface AnalyticsStat {
	event: string;
	count: number;
}
