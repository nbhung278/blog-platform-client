interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
	return <div className={`bg-brand-border/40 animate-pulse ${className}`} />;
}
