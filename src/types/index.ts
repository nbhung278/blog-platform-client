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
	thumbnailUrl?: string | null;
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
	thumbnailUrl?: string | null;
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

export interface PaginatedPosts {
	items: Post[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CategorySection {
	category: { id: string; name: string; slug: string };
	posts: Post[];
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	postCount: number;
}

export interface AuthResponse {
	user: Pick<User, "id" | "email" | "name" | "username" | "bio" | "avatarUrl"> & {
		hasPassword?: boolean;
		googleLinked?: boolean;
	};
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

export type ReactionEmoji = "love" | "like" | "haha" | "sad" | "angry";

export interface MessageReaction {
	emoji: ReactionEmoji;
	count: number;
	reactedByMe: boolean;
}

export interface DirectMessage {
	id: string;
	conversationId: string;
	senderId: string;
	content: string | null;
	imageUrl: string | null;
	createdAt: string;
	editedAt: string | null;
	sender: ChatUser;
	replyTo: { id: string; content: string | null; imageUrl: string | null; sender: ChatUser } | null;
	reactions: MessageReaction[];
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
