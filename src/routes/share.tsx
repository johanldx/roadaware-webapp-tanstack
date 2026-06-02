import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SharePreviewPage } from "#/components/share/share-preview-page";
import { APP_NAME } from "#/config/app";
import { buildPageHead } from "#/config/seo";

const shareSearchSchema = z.object({
	s: z.string().optional(),
});

export const Route = createFileRoute("/share")({
	validateSearch: shareSearchSchema,
	head: () =>
		buildPageHead({
			path: "/share",
			title: `Aperçu partagé — ${APP_NAME}`,
			description:
				"Aperçu d’une vue carte Roadaware partagée. Outil d’information moto en Île-de-France.",
			robots: "noindex, nofollow",
		}),
	component: SharePage,
});

function SharePage() {
	const { s } = Route.useSearch();
	return <SharePreviewPage encoded={s} />;
}
