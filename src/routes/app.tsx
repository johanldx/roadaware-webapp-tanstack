import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const mapSearchSchema = z.object({
	lat: z.coerce.number().optional(),
	lng: z.coerce.number().optional(),
	zoom: z.coerce.number().optional(),
	at: z.string().optional(),
});

export const Route = createFileRoute("/app")({
	validateSearch: mapSearchSchema,
	head: () => ({
		links: [
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
			},
		],
	}),
});
