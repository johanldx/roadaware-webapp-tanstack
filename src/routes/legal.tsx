import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "#/components/legal/legal-page";
import { APP_NAME } from "#/config/app";

export const Route = createFileRoute("/legal")({
	head: () => ({
		meta: [
			{
				title: `Mentions légales & CGU — ${APP_NAME}`,
			},
			{
				name: "description",
				content:
					"Mentions légales et conditions d’utilisation de Roadaware, carte moto open data en Île-de-France.",
			},
			{ name: "robots", content: "index, follow" },
		],
		links: [
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
			},
		],
	}),
	component: LegalPage,
});
