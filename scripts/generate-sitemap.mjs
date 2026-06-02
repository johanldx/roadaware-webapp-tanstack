import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE_ORIGIN = "https://roadaware.gondawa.fr";

const PAGES = [
	{ path: "/", changefreq: "weekly", priority: "1.0" },
	{ path: "/meteo-pour-motard", changefreq: "monthly", priority: "0.9" },
	{ path: "/carte-radars-paris", changefreq: "monthly", priority: "0.9" },
	{ path: "/virage-moto-idf", changefreq: "monthly", priority: "0.9" },
	{ path: "/balade-moto-idf", changefreq: "monthly", priority: "0.9" },
	{ path: "/sortie-moto-weekend-idf", changefreq: "monthly", priority: "0.9" },
	{ path: "/securite-moto-pluie", changefreq: "monthly", priority: "0.9" },
	{ path: "/legal", changefreq: "yearly", priority: "0.4" },
	{ path: "/app", changefreq: "weekly", priority: "0.8" },
];

const urls = PAGES.map(
	({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_ORIGIN}${path === "/" ? "/" : path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`Sitemap écrit : ${out}`);
