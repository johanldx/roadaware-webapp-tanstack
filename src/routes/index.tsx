import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "#/components/landing/landing-page";
import { ROOTAGE_HEAD_SCRIPTS } from "#/components/landing/rootage-embeds";
import { APP_NAME, APP_TAGLINE } from "#/config/app";
import { buildHomeJsonLd, buildPageHead } from "#/config/seo";

export const Route = createFileRoute("/")({
	head: () => {
		const title = `${APP_NAME} — ${APP_TAGLINE}`;
		const description =
			"Météo pour motard, carte radars Paris et virage moto IDF : Roadaware aide à choisir la bonne zone et le bon créneau en Île-de-France avec des calques open data.";

		return {
			...buildPageHead({
				path: "/",
				title,
				description,
				jsonLd: buildHomeJsonLd(),
			}),
			scripts: [...ROOTAGE_HEAD_SCRIPTS],
		};
	},
	component: LandingPage,
});
