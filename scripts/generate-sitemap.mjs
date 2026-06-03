import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { origin, sitemap } = JSON.parse(
	readFileSync(join(root, "src/config/site-meta.json"), "utf8"),
);

const urls = sitemap
	.map(
		({ path, changefreq, priority }) => `  <url>
    <loc>${origin}${path === "/" ? "/" : path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
	)
	.join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = join(root, "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`Sitemap écrit : ${out}`);
