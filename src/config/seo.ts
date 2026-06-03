import { APP_NAME } from "#/config/app";
import { CREATOR } from "#/config/landing";
import siteMeta from "#/config/site-meta.json";

/** URL canonique de production (README, partages, sitemap). */
export const SITE_ORIGIN = siteMeta.origin;

export const OG_IMAGE = {
	url: `${SITE_ORIGIN}${siteMeta.ogImage.path}`,
	width: siteMeta.ogImage.width,
	height: siteMeta.ogImage.height,
	type: siteMeta.ogImage.type,
	alt: siteMeta.ogImage.alt,
} as const;

export const DEFAULT_OG_IMAGE = OG_IMAGE.url;

export const SITE_LOGO_URL = `${SITE_ORIGIN}/favicon.png`;

export const INSTRUMENT_SERIF_FONT =
	"https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";

export const SITE_BASE_LINKS = [
	{ rel: "manifest", href: "/manifest.json" },
	{ rel: "icon", href: "/favicon.png", type: "image/png", sizes: "559x559" },
	{ rel: "apple-touch-icon", href: "/favicon.png" },
	{
		rel: "stylesheet",
		href: INSTRUMENT_SERIF_FONT,
	},
] as const;

/** Pages indexables (hors /app et /share). */
export const INDEXABLE_PATHS = siteMeta.sitemap.map((entry) => entry.path);

export type IndexablePath = (typeof siteMeta.sitemap)[number]["path"];

export const SITEMAP_ENTRIES = siteMeta.sitemap;

type HeadMeta = {
	title?: string;
	name?: string;
	property?: string;
	content?: string;
};

interface SocialMetaInput {
	title: string;
	description: string;
	url: string;
	ogType: "website" | "article";
	ogImage?: string;
	ogImageAlt?: string;
}

function buildSocialMeta({
	title,
	description,
	url,
	ogType,
	ogImage = DEFAULT_OG_IMAGE,
	ogImageAlt = OG_IMAGE.alt,
}: SocialMetaInput): HeadMeta[] {
	return [
		{ property: "og:site_name", content: APP_NAME },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: ogType },
		{ property: "og:locale", content: "fr_FR" },
		{ property: "og:image", content: ogImage },
		{ property: "og:image:secure_url", content: ogImage },
		{ property: "og:image:type", content: OG_IMAGE.type },
		{
			property: "og:image:width",
			content: String(OG_IMAGE.width),
		},
		{
			property: "og:image:height",
			content: String(OG_IMAGE.height),
		},
		{ property: "og:image:alt", content: ogImageAlt },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImage },
		{ name: "twitter:image:alt", content: ogImageAlt },
	];
}

function canonicalUrl(path: string): string {
	if (path === "/") return `${SITE_ORIGIN}/`;
	return `${SITE_ORIGIN}${path}`;
}

function hreflangLinks(url: string) {
	return [
		{ rel: "canonical" as const, href: url },
		{ rel: "alternate" as const, hrefLang: "fr", href: url },
		{ rel: "alternate" as const, hrefLang: "x-default", href: url },
	];
}

export interface PageHeadInput {
	/** Chemin absolu, ex. `/meteo-pour-motard` */
	path: string;
	/** Titre complet affiché dans `<title>` */
	title: string;
	description: string;
	robots?: string;
	ogType?: "website" | "article";
	ogImage?: string;
	ogImageAlt?: string;
	jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function buildPageHead({
	path,
	title,
	description,
	robots,
	ogType = "website",
	ogImage,
	ogImageAlt,
	jsonLd,
}: PageHeadInput) {
	const url = canonicalUrl(path);

	const meta: HeadMeta[] = [
		{ title },
		{ name: "description", content: description },
		...(robots ? [{ name: "robots" as const, content: robots }] : []),
		{ name: "author", content: CREATOR.name },
		...buildSocialMeta({
			title,
			description,
			url,
			ogType,
			ogImage,
			ogImageAlt,
		}),
	];

	const links = hreflangLinks(url);

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

const publisherOrganization = {
	"@type": "Organization" as const,
	name: APP_NAME,
	url: SITE_ORIGIN,
	logo: {
		"@type": "ImageObject" as const,
		url: SITE_LOGO_URL,
	},
};

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
				image: [DEFAULT_OG_IMAGE],
				inLanguage: "fr-FR",
				author: {
					"@type": "Person",
					name: CREATOR.name,
					url: CREATOR.github,
				},
				publisher: publisherOrganization,
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
			image: DEFAULT_OG_IMAGE,
			publisher: publisherOrganization,
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
			image: DEFAULT_OG_IMAGE,
			areaServed: {
				"@type": "AdministrativeArea",
				name: "Île-de-France",
			},
		},
	];
}
