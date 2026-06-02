import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SharePreviewPage } from "#/components/share/share-preview-page";

const shareSearchSchema = z.object({
	s: z.string().optional(),
});

export const Route = createFileRoute("/share")({
	validateSearch: shareSearchSchema,
	head: () => ({
		links: [
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
			},
		],
	}),
	component: SharePage,
});

function SharePage() {
	const { s } = Route.useSearch();
	return <SharePreviewPage encoded={s} />;
}
