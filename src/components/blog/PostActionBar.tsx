import { useNavigate } from "@tanstack/react-router";
import { Bookmark, MessageSquare, Share2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useClap, usePostClapState } from "@/hooks/useClap";
import { useBookmarkState, useToggleBookmark } from "@/hooks/useBookmark";
import ClapButton from "./ClapButton";
import { formatCount } from "@/lib/formatCount";

interface Props {
	postId: string;
	commentCount: number;
	onOpenComments: () => void;
	onOpenShare: () => void;
}

// Medium-style horizontal action bar shown between the author/meta and the
// post body. Clap is debounced (each click bumps a counter; the request
// is sent after a short pause), so spam-clicking is smooth and cheap.
export default function PostActionBar({
	postId,
	commentCount,
	onOpenComments,
	onOpenShare,
}: Props) {
	const navigate = useNavigate();
	const me = useAuthStore((s) => s.user);
	const initialized = useAuthStore((s) => s.initialized);

	const clapQuery = usePostClapState(postId);
	const { clap } = useClap({ kind: "post", id: postId });

	const bookmarkQuery = useBookmarkState(postId, !!me && initialized);
	const toggleBookmark = useToggleBookmark(postId);

	const total = clapQuery.data?.total ?? 0;
	const myCount = clapQuery.data?.myCount ?? 0;
	const max = clapQuery.data?.max ?? 50;
	const saved = bookmarkQuery.data?.saved ?? false;

	const requireAuth = () => {
		if (!me) {
			navigate({ to: "/login" });
			return true;
		}
		return false;
	};

	const onSave = () => {
		if (requireAuth()) return;
		toggleBookmark.mutate(!saved);
	};

	return (
		<div className="flex items-center justify-between py-3">
			<div className="flex items-center gap-5">
				<ClapButton
					count={total}
					myCount={myCount}
					max={max}
					onClap={clap}
					requireAuth={requireAuth}
				/>

				<button
					type="button"
					onClick={onOpenComments}
					aria-label="Open comments"
					className="group dark:text-brand-mid flex items-center gap-2 text-gray-500 transition-colors hover:text-amber-500"
				>
					<MessageSquare className="h-5 w-5" />
					<span className="text-sm font-medium tabular-nums">{formatCount(commentCount)}</span>
				</button>
			</div>

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onOpenShare}
					aria-label="Share post"
					className="dark:text-brand-mid flex h-10 w-10 items-center justify-center text-gray-500 transition-colors hover:text-amber-500"
				>
					<Share2 className="h-5 w-5" />
				</button>

				<button
					type="button"
					onClick={onSave}
					aria-label={saved ? "Remove from saved" : "Save post"}
					aria-pressed={saved}
					className={`flex h-10 w-10 items-center justify-center transition-colors ${
						saved ? "text-amber-500" : "dark:text-brand-mid text-gray-500 hover:text-amber-500"
					}`}
				>
					<Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
				</button>
			</div>
		</div>
	);
}
