/**
 * Grille d’altitudes IDF via Open-Meteo (cache disque).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { IDF_WORK_BOUNDS } from "./idf-zone.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE_PATH = join(ROOT, "public/data/.elevation-grid-idf.json");
const STEP = 0.045;
const BATCH = 90;
const BATCH_DELAY_MS = 1200;
const MAX_RETRIES = 4;

function buildGridPoints() {
	const { west, south, east, north } = IDF_WORK_BOUNDS;
	const points = [];
	for (let lat = south; lat <= north + 1e-9; lat += STEP) {
		for (let lng = west; lng <= east + 1e-9; lng += STEP) {
			points.push({
				lat: Math.round(lat * 1e5) / 1e5,
				lng: Math.round(lng * 1e5) / 1e5,
			});
		}
	}
	return points;
}

async function fetchElevationsBatch(points, attempt = 0) {
	const locations = points.map((p) => `${p.lat},${p.lng}`).join("|");
	const url = `https://api.opentopodata.org/v1/aster30m?locations=${locations}`;
	const res = await fetch(url);
	if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
		const wait = BATCH_DELAY_MS * (attempt + 2);
		process.stdout.write(`\n  Pause ${wait} ms (${res.status})…`);
		await sleep(wait);
		return fetchElevationsBatch(points, attempt + 1);
	}
	if (!res.ok) throw new Error(`OpenTopoData HTTP ${res.status}`);
	const json = await res.json();
	const results = json.results;
	if (!Array.isArray(results) || results.length !== points.length) {
		throw new Error("OpenTopoData: réponse invalide");
	}
	return results.map((r) => r.elevation ?? 0);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns {{ step: number, points: { lat: number, lng: number, elev: number }[] }}
 */
export async function loadElevationGrid({ force = false } = {}) {
	if (!force && existsSync(CACHE_PATH)) {
		return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
	}

	const points = buildGridPoints();
	const withElev = [];

	for (let i = 0; i < points.length; i += BATCH) {
		const batch = points.slice(i, i + BATCH);
		const elevations = await fetchElevationsBatch(batch);
		for (let j = 0; j < batch.length; j++) {
			const p = batch[j];
			const elev = elevations[j];
			if (p && elev != null && Number.isFinite(elev)) {
				withElev.push({ lat: p.lat, lng: p.lng, elev });
			}
		}
		process.stdout.write(
			`\r  Altitudes ${Math.min(i + BATCH, points.length)}/${points.length}`,
		);
		if (i + BATCH < points.length) await sleep(BATCH_DELAY_MS);
	}
	process.stdout.write("\n");

	const grid = { step: STEP, points: withElev };
	writeFileSync(CACHE_PATH, JSON.stringify(grid));
	return grid;
}

/** Altitude (m) au point le plus proche de la grille. */
export function elevationAt(grid, lat, lng) {
	const step = grid.step;
	const latKey = Math.round(lat / step) * step;
	const lngKey = Math.round(lng / step) * step;
	let best = null;
	let bestD = Infinity;
	for (const p of grid.points) {
		const d = (p.lat - latKey) ** 2 + (p.lng - lngKey) ** 2;
		if (d < bestD) {
			bestD = d;
			best = p.elev;
		}
	}
	return best ?? 0;
}
