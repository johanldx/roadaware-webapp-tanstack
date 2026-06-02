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
			<a
				href="https://github.com/johanldx/roadaware-webapp-tanstack"
				target="_blank"
				rel="noreferrer"
				className="landing__github-badge"
			>
				<span className="sr-only">
					Voir le repository GitHub roadaware-webapp-tanstack
				</span>
				<svg
					className="landing__github-badge-icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<path
						fill="currentColor"
						d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-.88-.01-1.72-2.78.62-3.36-1.37-3.36-1.37-.46-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.08 1.56 1.08 1.56 1.08.9 1.6 2.37 1.13 2.95.86.09-.67.35-1.13.64-1.39-2.22-.26-4.55-1.15-4.55-5.12 0-1.13.39-2.06 1.04-2.79-.11-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.06A9.3 9.3 0 0 1 12 7.02c.82 0 1.65.11 2.42.33 1.91-1.33 2.75-1.06 2.75-1.06.55 1.42.21 2.47.1 2.73.65.73 1.04 1.66 1.04 2.79 0 3.99-2.33 4.86-4.56 5.11.36.32.68.96.68 1.94 0 1.4-.01 2.53-.01 2.88 0 .28.18.61.69.5A10.27 10.27 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
					/>
				</svg>
			</a>
		</div>
	);
}
