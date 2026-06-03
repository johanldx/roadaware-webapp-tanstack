import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SharePreviewPage } from "#/components/share/share-preview-page";
import { APP_NAME } from "#/config/app";
import { buildPageHead } from "#/config/seo";

const shareSearchSchema = z.object({
	s: z.string().optional(),
});

export const Route = createFileRoute("/share")({
	ssr: false,
	validateSearch: shareSearchSchema,
	head: () =>
		buildPageHead({
			path: "/share",
			title: `Aperçu partagé — ${APP_NAME}`,
			description:
				"Vue carte Roadaware partagée : météo motard, radars et zones à virages en Île-de-France. Ouvrez l’aperçu pour explorer la carte.",
			robots: "noindex, nofollow",
			ogImageAlt:
				"Aperçu d’une carte moto Roadaware partagée en Île-de-France",
		}),
	component: SharePage,
});

function SharePage() {
	const { s } = Route.useSearch();
	return <SharePreviewPage encoded={s} />;
}
