import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "#/components/legal/legal-page";
import { APP_NAME } from "#/config/app";
import { buildPageHead } from "#/config/seo";

export const Route = createFileRoute("/legal")({
	head: () =>
		buildPageHead({
			path: "/legal",
			title: `Mentions légales & CGU — ${APP_NAME}`,
			description:
				"Mentions légales et conditions d’utilisation de Roadaware, carte moto open data en Île-de-France.",
		}),
	component: LegalPage,
});
