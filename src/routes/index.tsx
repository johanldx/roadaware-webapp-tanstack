import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "#/components/landing/landing-page";
import { ROOTAGE_HEAD_SCRIPTS } from "#/components/landing/rootage-embeds";
import { APP_NAME, APP_TAGLINE } from "#/config/app";

export const Route = createFileRoute("/")({
	head: () => ({
		scripts: [...ROOTAGE_HEAD_SCRIPTS],
		meta: [
			{
				title: `${APP_NAME} — ${APP_TAGLINE}`,
			},
			{
				name: "description",
				content:
					"Carte gratuite pour motards en IDF : sinuosité, météo, radars et historique d’accidents moto (densité acc./km, ratio TMJA sur les axes comptés). Analyse de zone, pas de GPS.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
			},
		],
	}),
	component: LandingPage,
});
