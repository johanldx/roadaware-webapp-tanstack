import { APP_NAME } from "#/config/app";
import { CREATOR } from "#/config/landing";

/** URL canonique de production (README, partages, sitemap). */
export const SITE_ORIGIN = "https://roadaware.gondawa.fr";

export const INSTRUMENT_SERIF_FONT =
	"https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export const SITE_BASE_LINKS = [
	{ rel: "manifest", href: "/manifest.json" },
	{ rel: "icon", href: "/favicon.ico", sizes: "any" },
	{ rel: "apple-touch-icon", href: "/logo192.png" },
	{
		rel: "stylesheet",
		href: INSTRUMENT_SERIF_FONT,
	},
] as const;

/** Pages indexables (hors /app et /share). */
export const INDEXABLE_PATHS = [
	"/",
	"/meteo-pour-motard",
	"/carte-radars-paris",
	"/virage-moto-idf",
	"/balade-moto-idf",
	"/sortie-moto-weekend-idf",
	"/securite-moto-pluie",
	"/legal",
] as const;

export type IndexablePath = (typeof INDEXABLE_PATHS)[number];

export interface PageHeadInput {
	/** Chemin absolu, ex. `/meteo-pour-motard` */
	path: string;
	/** Titre complet affiché dans `<title>` */
	title: string;
	description: string;
	robots?: string;
	ogType?: "website" | "article";
	ogImage?: string;
	jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function canonicalUrl(path: string): string {
	if (path === "/") return `${SITE_ORIGIN}/`;
	return `${SITE_ORIGIN}${path}`;
}

export function buildPageHead({
	path,
	title,
	description,
	robots,
	ogType = "website",
	ogImage = DEFAULT_OG_IMAGE,
	jsonLd,
}: PageHeadInput) {
	const url = canonicalUrl(path);

	const meta = [
		{ title },
		{ name: "description", content: description },
		...(robots ? [{ name: "robots" as const, content: robots }] : []),
		{ name: "author", content: CREATOR.name },
		{ property: "og:site_name", content: APP_NAME },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: ogType },
		{ property: "og:locale", content: "fr_FR" },
		{ property: "og:image", content: ogImage },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImage },
	];

	const links = [{ rel: "canonical" as const, href: url }];

	const scripts = jsonLd
		? [
				{
					type: "application/ld+json",
					children: JSON.stringify(jsonLd),
				},
			]
		: [];

	return { meta, links, scripts };
}

export interface GuideHeadInput {
	path: IndexablePath;
	/** Partie titre avant « — Roadaware » */
	title: string;
	description: string;
	/** Titre H1 de la page (pour JSON-LD Article) */
	articleTitle: string;
}

export function buildGuideHead({
	path,
	title,
	description,
	articleTitle,
}: GuideHeadInput) {
	const fullTitle = `${title} — ${APP_NAME}`;
	const url = canonicalUrl(path);

	return buildPageHead({
		path,
		title: fullTitle,
		description,
		ogType: "article",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "Article",
				headline: articleTitle,
				description,
				url,
				inLanguage: "fr-FR",
				author: {
					"@type": "Person",
					name: CREATOR.name,
					url: CREATOR.github,
				},
				publisher: {
					"@type": "Organization",
					name: APP_NAME,
					url: SITE_ORIGIN,
				},
				mainEntityOfPage: {
					"@type": "WebPage",
					"@id": url,
				},
			},
			{
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: "Accueil",
						item: `${SITE_ORIGIN}/`,
					},
					{
						"@type": "ListItem",
						position: 2,
						name: articleTitle,
						item: url,
					},
				],
			},
		],
	});
}

export function buildHomeJsonLd() {
	return [
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: APP_NAME,
			url: SITE_ORIGIN,
			inLanguage: "fr-FR",
			description:
				"Carte moto open data en Île-de-France : météo motard, radars, virages et historique d’accidents.",
			publisher: {
				"@type": "Organization",
				name: APP_NAME,
				url: SITE_ORIGIN,
			},
		},
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			name: APP_NAME,
			url: `${SITE_ORIGIN}/app`,
			applicationCategory: "MapsApplication",
			operatingSystem: "Web",
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "EUR",
			},
			description:
				"Exploration cartographique moto en IDF sans GPS : calques sinuosité, météo, radars et risque accident.",
			inLanguage: "fr-FR",
			areaServed: {
				"@type": "AdministrativeArea",
				name: "Île-de-France",
			},
		},
	];
}
