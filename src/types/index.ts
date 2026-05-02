export interface User {
	id: string;
	email: string;
	name: string;
	username: string;
	bio: string | null;
	avatarUrl: string | null;
	plan: string;
}

export type PostStatus = "draft" | "pending" | "published" | "rejected";

export interface CategorySummary {
	id: string;
	name: string;
	slug: string;
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
	status: PostStatus;
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
	user?: { id?: string; name: string; username: string; avatarUrl: string | null };
	categories?: { category: CategorySummary }[];
}

export interface PostInput {
	title: string;
	contentMd: string;
	contentHtml: string;
	excerpt?: string;
	coverUrl?: string | null;
	status?: PostStatus;
	tags?: string[];
	metaTitle?: string;
	metaDesc?: string;
	categoryIds: string[];
}

export interface PostsPage {
	data: Post[];
	total: number;
	page: number;
	limit: number;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	postCount: number;
}

export interface AuthResponse {
	user: Pick<User, "id" | "email" | "name" | "username" | "bio" | "avatarUrl">;
}

export interface AnalyticsStat {
	event: string;
	count: number;
}

export interface ChatUser {
	id: string;
	name: string;
	username: string;
	avatarUrl: string | null;
}

export interface DirectMessage {
	id: string;
	conversationId: string;
	senderId: string;
	content: string | null;
	imageUrl: string | null;
	createdAt: string;
	sender: ChatUser;
}

export interface Conversation {
	id: string;
	other: ChatUser | null;
	lastMessage: Omit<DirectMessage, "sender"> | null;
	unreadCount: number;
	updatedAt: string;
}

export interface UserSearchResult {
	id: string;
	name: string;
	username: string;
	avatarUrl: string | null;
	bio: string | null;
}
