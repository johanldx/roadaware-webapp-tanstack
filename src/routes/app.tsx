import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { APP_NAME } from "#/config/app";
import { buildPageHead } from "#/config/seo";

const mapSearchSchema = z.object({
	/** État carte encodé (position, calques, météo, fond) */
	s: z.string().optional(),
	lat: z.coerce.number().optional(),
	lng: z.coerce.number().optional(),
	zoom: z.coerce.number().optional(),
	at: z.string().optional(),
});

export const Route = createFileRoute("/app")({
	validateSearch: mapSearchSchema,
	head: () =>
		buildPageHead({
			path: "/app",
			title: `Carte moto IDF — ${APP_NAME}`,
			description:
				"Carte interactive moto en Île-de-France : sinuosité, météo motard, radars fixes et historique d’accidents. Sans GPS, sans compte.",
		}),
});
