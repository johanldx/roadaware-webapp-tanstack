#!/usr/bin/env node
/**
 * Exporte la sinuosité des routes IDF (OSM → GeoJSON).
 *
 * Usage :
 *   node scripts/export-sinuosity-geojson.mjs           # 1 requête Overpass (défaut, rapide)
 *   node scripts/export-sinuosity-geojson.mjs --merge-only  # fusion cache uniquement
 *   node scripts/export-sinuosity-geojson.mjs --tiled     # 4 tuiles en parallèle (secours)
 *   node scripts/export-sinuosity-geojson.mjs --force     # ignore le cache
 *
 * Sortie : public/data/sinuosity-idf.geojson
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { IDF_WORK_BOUNDS, isInIdfWorkArea } from "./lib/idf-zone.mjs";
import { fetchOverpass, highwaysQuery } from "./lib/overpass-fetch.mjs";
import { DISPLAY_MIN, segmentizeAndScore } from "./lib/sinuosity-metrics.mjs";

const MERGE_ONLY = process.argv.includes("--merge-only");
const TILED = process.argv.includes("--tiled");
const FORCE = process.argv.includes("--force");
const TILE_CONCURRENCY = 2;
const TILE_ROWS = 2;
const TILE_COLS = 2;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/data/sinuosity-idf.geojson");
const CACHE_DIR = join(ROOT, "public/data/.sinuosity-tiles");
const BBOX_CACHE = join(CACHE_DIR, "idf-work-bbox.json");

function simplifyCoords(coords, maxPts = 10) {
	if (coords.length <= maxPts) return coords;
	const out = [coords[0]];
	const step = (coords.length - 1) / (maxPts - 1);
	for (let i = 1; i < maxPts - 1; i++) {
		out.push(coords[Math.round(i * step)]);
	}
	out.push(coords[coords.length - 1]);
	return out;
}

function waysToFeatures(elements) {
	const features = [];
	for (const el of elements) {
		if (el.type !== "way" || !el.geometry?.length) continue;
		const coords = el.geometry.map((p) => [p.lon, p.lat]);
		const highway = el.tags?.highway ?? "";
		const segments = segmentizeAndScore(coords, highway);
		for (const seg of segments) {
			const mid =
				seg.coords[Math.floor(seg.coords.length / 2)] ?? seg.coords[0];
			if (!mid || !isInIdfWorkArea(mid[0], mid[1])) continue;
			features.push({
				type: "Feature",
				properties: {
					sinuosity: seg.score,
					highway: el.tags?.highway ?? "",
				},
				geometry: {
					type: "LineString",
					coordinates: simplifyCoords(seg.coords),
				},
			});
		}
	}
	return features;
}

function buildTiles() {
	const { west, south, east, north } = IDF_WORK_BOUNDS;
	const dLat = (north - south) / TILE_ROWS;
	const dLng = (east - west) / TILE_COLS;
	const tiles = [];
	for (let row = 0; row < TILE_ROWS; row++) {
		for (let col = 0; col < TILE_COLS; col++) {
			tiles.push({
				south: south + row * dLat,
				north: south + (row + 1) * dLat,
				west: west + col * dLng,
				east: west + (col + 1) * dLng,
				id: `r${row}c${col}`,
			});
		}
	}
	return tiles;
}

function tileCachePath(tileId) {
	return join(CACHE_DIR, `${tileId}.json`);
}

async function loadBboxCache() {
	if (!FORCE && existsSync(BBOX_CACHE)) {
		console.log("  (cache bbox IDF)");
		return JSON.parse(readFileSync(BBOX_CACHE, "utf-8"));
	}
	console.log("  requête Overpass (bbox IDF + 5 km)…");
	const data = await fetchOverpass(highwaysQuery(IDF_WORK_BOUNDS, 300));
	mkdirSync(CACHE_DIR, { recursive: true });
	writeFileSync(BBOX_CACHE, JSON.stringify(data));
	return data;
}

async function loadTileCache(tile) {
	const path = tileCachePath(tile.id);
	if (!FORCE && existsSync(path)) {
		console.log(`  ${tile.id} (cache)`);
		return JSON.parse(readFileSync(path, "utf-8"));
	}
	console.log(`  ${tile.id} fetch…`);
	const data = await fetchOverpass(highwaysQuery(tile, 180));
	mkdirSync(CACHE_DIR, { recursive: true });
	writeFileSync(path, JSON.stringify(data));
	return data;
}

async function fetchTiledParallel() {
	const tiles = buildTiles();
	console.log(
		`Tuiles Overpass : ${tiles.length} (×${TILE_CONCURRENCY} parallèle)`,
	);
	const elements = [];

	for (let i = 0; i < tiles.length; i += TILE_CONCURRENCY) {
		const batch = tiles.slice(i, i + TILE_CONCURRENCY);
		const results = await Promise.all(
			batch.map(async (tile) => {
				const data = await loadTileCache(tile);
				return data.elements ?? [];
			}),
		);
		for (const part of results) elements.push(...part);
	}

	return elements;
}

function loadTiledFromCacheOnly() {
	const elements = [];
	const tiles = buildTiles();
	for (const tile of tiles) {
		const path = tileCachePath(tile.id);
		if (!existsSync(path)) {
			console.warn(`  tuile ${tile.id} absente`);
			continue;
		}
		elements.push(...(JSON.parse(readFileSync(path, "utf-8")).elements ?? []));
	}
	return elements;
}

function loadBboxFromCacheOnly() {
	if (existsSync(BBOX_CACHE)) {
		return JSON.parse(readFileSync(BBOX_CACHE, "utf-8")).elements ?? [];
	}
	const legacy = readdirSync(CACHE_DIR).filter((f) =>
		/^r\d+c\d+\.json$/.test(f),
	);
	if (legacy.length > 0) {
		console.log(`  cache bbox absent — fusion ${legacy.length} tuiles legacy`);
		return loadTiledFromCacheOnly();
	}
	throw new Error(
		"Aucun cache Overpass. Lancez sans --merge-only ou supprimez --merge-only.",
	);
}

async function loadElements() {
	if (MERGE_ONLY) {
		console.log("Fusion cache…");
		return loadBboxFromCacheOnly();
	}

	if (TILED) {
		return fetchTiledParallel();
	}

	console.log("Mode rapide : 1 requête bbox");
	const data = await loadBboxCache();
	return data.elements ?? [];
}

mkdirSync(dirname(OUT), { recursive: true });

const elements = await loadElements();
const allFeatures = waysToFeatures(elements);

const collection = {
	type: "FeatureCollection",
	metadata: {
		source: "OpenStreetMap via Overpass",
		region: "Île-de-France (+ 5 km)",
		algorithm: "curvature-v4",
		displayMin: DISPLAY_MIN,
		segments: allFeatures.length,
		mode: MERGE_ONLY ? "merge-only" : TILED ? "tiled" : "bbox",
		exportedAt: new Date().toISOString(),
	},
	features: allFeatures,
};

writeFileSync(OUT, JSON.stringify(collection));
const mb = (Buffer.byteLength(JSON.stringify(collection)) / 1e6).toFixed(2);
console.log(`✓ ${allFeatures.length} segments → ${OUT} (${mb} Mo)`);
