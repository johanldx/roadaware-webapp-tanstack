#!/usr/bin/env node
/**
 * Réseau routier IDF (tronçons OSM) pour snap accidents BAAC.
 * Source : cache Overpass sinuosité (pnpm data:sinuosity).
 *
 * Usage : node scripts/export-road-network.mjs
 * Sortie : data/processed/roads-idf.geojson (intermédiaire pipeline, non servi au front)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSegmentsFromTileDir } from "./lib/road-segment-index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TILE_DIR = join(ROOT, "public/data/.sinuosity-tiles");
const OUT = join(ROOT, "data/processed/roads-idf.geojson");

function simplifyCoords(coords, maxPts = 12) {
	if (coords.length <= maxPts) return coords;
	const out = [coords[0]];
	const step = (coords.length - 1) / (maxPts - 1);
	for (let i = 1; i < maxPts - 1; i++) {
		out.push(coords[Math.round(i * step)]);
	}
	out.push(coords[coords.length - 1]);
	return out;
}

const segments = loadSegmentsFromTileDir(TILE_DIR);
if (!segments?.length) {
	console.error(
		"Aucune tuile Overpass trouvée. Lancez d’abord : pnpm data:sinuosity",
	);
	process.exit(1);
}

const features = segments.map((s) => ({
	type: "Feature",
	id: s.id,
	properties: {
		segmentId: s.id,
		highway: s.highway,
		name: s.name || undefined,
	},
	geometry: {
		type: "LineString",
		coordinates: simplifyCoords(s.coords),
	},
}));

const collection = {
	type: "FeatureCollection",
	metadata: {
		source: "OpenStreetMap via Overpass (tuiles sinuosité)",
		region: "Île-de-France",
		highways: "motorway → tertiary",
		segments: features.length,
		exportedAt: new Date().toISOString(),
	},
	features,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(collection));
const mb = (Buffer.byteLength(JSON.stringify(collection)) / 1e6).toFixed(2);
console.log(`✓ ${features.length} tronçons → ${OUT} (${mb} Mo)`);
