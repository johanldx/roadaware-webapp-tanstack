#!/usr/bin/env node
/**
 * Contour administratif Île-de-France (source france-geojson / OSM).
 * Sortie : public/data/idf-boundary.geojson
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/data/idf-boundary.json");
const SOURCE_URL =
	"https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions/ile-de-france/region-ile-de-france.geojson";

function simplifyRing(ring, tolerance = 0.0065) {
	function perpDist(p, a, b) {
		const [px, py] = p;
		const [ax, ay] = a;
		const [bx, by] = b;
		const dx = bx - ax;
		const dy = by - ay;
		if (!dx && !dy) return Math.hypot(px - ax, py - ay);
		const t = Math.max(
			0,
			Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
		);
		return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
	}

	function dp(points, eps) {
		if (points.length <= 2) return points;
		let maxD = 0;
		let idx = 0;
		const end = points.length - 1;
		for (let i = 1; i < end; i++) {
			const d = perpDist(points[i], points[0], points[end]);
			if (d > maxD) {
				maxD = d;
				idx = i;
			}
		}
		if (maxD > eps) {
			const left = dp(points.slice(0, idx + 1), eps);
			const right = dp(points.slice(idx), eps);
			return [...left.slice(0, -1), ...right];
		}
		return [points[0], points[end]];
	}

	const closed =
		ring[0][0] === ring[ring.length - 1][0] &&
		ring[0][1] === ring[ring.length - 1][1];
	const open = closed ? ring.slice(0, -1) : ring;
	const simplified = dp(open, tolerance);
	simplified.push(simplified[0]);
	return simplified;
}

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`HTTP ${res.status} — ${SOURCE_URL}`);
const raw = await res.json();
const ring = raw.geometry.coordinates[0];
const simplified = simplifyRing(ring);

const collection = {
	type: "FeatureCollection",
	metadata: {
		source: "gregoiredavid/france-geojson (contour région)",
		simplified: true,
		vertices: simplified.length,
		exportedAt: new Date().toISOString(),
	},
	features: [
		{
			type: "Feature",
			properties: { name: "Île-de-France", code: "11" },
			geometry: { type: "Polygon", coordinates: [simplified] },
		},
	],
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(collection));
console.log(`✓ ${simplified.length} sommets → ${OUT}`);
