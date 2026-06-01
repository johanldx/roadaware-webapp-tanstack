const STACK_SCRIPT = "https://embed.rtge.fr/stack/v1/rtge-stack.min.js";
const BADGE_SCRIPT = "https://embed.rtge.fr/badge/v1/rtge-badge.min.js";

export const ROOTAGE_HEAD_SCRIPTS = [
	{ src: STACK_SCRIPT, defer: true },
	{ src: BADGE_SCRIPT, defer: true },
] as const;

export function RootageEmbeds() {
	return (
		<div className="landing__rootage">
			<rootage-stack
				label="Stack utilisée"
				theme="light"
				shape="rounded"
				stack="typescript,react"
			/>
			<rootage-badge
				label="Crafted by"
				theme="light"
				shape="rounded"
				href="https://rootage.fr"
			/>
		</div>
	);
}
