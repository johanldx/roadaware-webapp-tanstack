import { describe, expect, it } from "vitest";

import siteMeta from "#/config/site-meta.json";
import {
	buildGuideHead,
	buildPageHead,
	DEFAULT_OG_IMAGE,
	INDEXABLE_PATHS,
	OG_IMAGE,
	SITEMAP_ENTRIES,
} from "#/config/seo";

describe("buildPageHead", () => {
	it("inclut les balises Open Graph et Twitter pour le partage social", () => {
		const { meta } = buildPageHead({
			path: "/",
			title: "Roadaware — test",
			description: "Description de test pour les réseaux.",
		});

		const byProperty = (key: string) =>
			meta.find((m) => m.property === key)?.content;
		const byName = (key: string) => meta.find((m) => m.name === key)?.content;

		expect(byProperty("og:image")).toBe(DEFAULT_OG_IMAGE);
		expect(byProperty("og:image:width")).toBe(String(OG_IMAGE.width));
		expect(byProperty("og:image:height")).toBe(String(OG_IMAGE.height));
		expect(byProperty("og:image:alt")).toBe(OG_IMAGE.alt);
		expect(byName("twitter:card")).toBe("summary_large_image");
		expect(byName("twitter:image:alt")).toBe(OG_IMAGE.alt);
	});

	it("ajoute canonical et hreflang", () => {
		const { links } = buildPageHead({
			path: "/meteo-pour-motard",
			title: "Météo — Roadaware",
			description: "Guide météo motard.",
		});

		expect(links).toEqual(
			expect.arrayContaining([
				{
					rel: "canonical",
					href: "https://roadaware.gondawa.fr/meteo-pour-motard",
				},
				{
					rel: "alternate",
					hrefLang: "fr",
					href: "https://roadaware.gondawa.fr/meteo-pour-motard",
				},
			]),
		);
	});
});

describe("buildGuideHead", () => {
	it("expose un JSON-LD Article avec image", () => {
		const { scripts } = buildGuideHead({
			path: "/virage-moto-idf",
			title: "Virages moto",
			description: "Repérer les virages en IDF.",
			articleTitle: "Virage moto en Île-de-France",
		});

		const json = JSON.parse(scripts[0]?.children as string);
		const article = json.find((entry: { "@type": string }) => entry["@type"] === "Article");
		expect(article.image).toContain(DEFAULT_OG_IMAGE);
	});
});

describe("site-meta.json", () => {
	it("reste aligné avec INDEXABLE_PATHS et le script sitemap", () => {
		const sitemapPaths = SITEMAP_ENTRIES.map((entry) => entry.path);
		expect([...INDEXABLE_PATHS]).toEqual(sitemapPaths);
		expect(siteMeta.sitemap).toEqual(SITEMAP_ENTRIES);
		expect(sitemapPaths).not.toContain("/app");
		expect(sitemapPaths).not.toContain("/share");
	});
});
