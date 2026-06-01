import { cn } from "#/lib/utils";

type BetaBadgeVariant = "glass" | "nav" | "map";

interface BetaBadgeProps {
	className?: string;
	/** `glass` hero landing · `nav` barre · `map` menu flottant */
	variant?: BetaBadgeVariant;
}

export function BetaBadge({ className, variant = "map" }: BetaBadgeProps) {
	return (
		<span
			className={cn("beta-badge", `beta-badge--${variant}`, className)}
			title="Version bêta"
		>
			BETA
		</span>
	);
}
