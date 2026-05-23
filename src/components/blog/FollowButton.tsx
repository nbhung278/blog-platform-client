import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellPlus, Check, ChevronDown } from "lucide-react";
import { useFollow, useFollowState, useUnfollow, useUpdateFollow } from "@/hooks/useFollows";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "@tanstack/react-router";

interface FollowButtonProps {
	username: string;
}

export default function FollowButton({ username }: FollowButtonProps) {
	const me = useAuthStore((s) => s.user);
	const initialized = useAuthStore((s) => s.initialized);
	const navigate = useNavigate();

	const isOwnProfile = me?.username === username;
	const enabled = !!me && !isOwnProfile && initialized;

	const stateQuery = useFollowState(username, enabled);
	const follow = useFollow(username);
	const unfollow = useUnfollow(username);
	const updateFollow = useUpdateFollow(username);

	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handle(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [open]);

	if (isOwnProfile) return null;
	if (!initialized) return null;

	if (!me) {
		return (
			<button
				onClick={() => navigate({ to: "/login" })}
				className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
			>
				Follow
			</button>
		);
	}

	const state = stateQuery.data;
	const isFollowing = state?.following ?? false;
	const emailOn = state?.emailEnabled ?? true;

	if (!isFollowing) {
		return (
			<button
				onClick={() => follow.mutate()}
				disabled={follow.isPending || stateQuery.isLoading}
				className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
			>
				{follow.isPending ? "Following…" : "Follow"}
			</button>
		);
	}

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				className="border-brand-border text-brand-dark hover:bg-brand-hero dark:bg-brand-surface flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-sm font-medium transition-colors"
			>
				<Check className="h-3.5 w-3.5" />
				Following
				<ChevronDown className="h-3.5 w-3.5" />
			</button>

			{open && (
				<div className="bg-brand-surface border-brand-border absolute top-full right-0 z-50 mt-2 min-w-[240px] overflow-hidden rounded-lg border shadow-xl">
					<MenuItem
						icon={<BellPlus className="h-4 w-4" />}
						label="Email notifications on"
						active={emailOn}
						onClick={() => {
							if (!emailOn) updateFollow.mutate(true);
							setOpen(false);
						}}
					/>
					<MenuItem
						icon={<Bell className="h-4 w-4" />}
						label="Email notifications off"
						active={!emailOn}
						onClick={() => {
							if (emailOn) updateFollow.mutate(false);
							setOpen(false);
						}}
					/>
					<button
						onClick={() => {
							unfollow.mutate(undefined);
							setOpen(false);
						}}
						className="border-brand-border dark:hover:bg-brand-hero flex w-full items-center gap-2.5 border-t px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
					>
						<BellOff className="h-4 w-4" />
						Unfollow
					</button>
				</div>
			)}
		</div>
	);
}

function MenuItem({
	icon,
	label,
	active,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className="text-brand-dark hover:bg-brand-hero flex w-full items-center justify-between gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
		>
			<span className="flex items-center gap-2.5">
				{icon}
				{label}
			</span>
			{active && <Check className="text-brand-dark h-4 w-4" />}
		</button>
	);
}
