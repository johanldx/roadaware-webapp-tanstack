/**
 * Index de tronçons routiers OSM pour snap d’accidents BAAC.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
	distanceMeters,
	pathLengthMeters,
	pointToPolylineMeters,
} from "./geo-distance.mjs";

const GRID_DEG = 0.012;
const DEFAULT_MAX_SEG_M = 280;
const MIN_SEG_M = 60;

export function splitWayToSegments(coords, maxSegM = DEFAULT_MAX_SEG_M) {
	if (coords.length < 2) return [];

	const out = [];
	let start = 0;
	let acc = 0;

	for (let i = 1; i < coords.length; i++) {
		acc += distanceMeters(coords[i - 1], coords[i]);
		const isLast = i === coords.length - 1;
		if (acc >= maxSegM || isLast) {
			const seg = coords.slice(start, i + 1);
			const len = pathLengthMeters(seg);
			if (len >= MIN_SEG_M) {
				out.push(seg);
			}
			start = i;
			acc = 0;
		}
	}

	return out;
}

function bboxOfCoords(coords) {
	let minLng = Infinity;
	let minLat = Infinity;
	let maxLng = -Infinity;
	let maxLat = -Infinity;
	for (const [lng, lat] of coords) {
		if (lng < minLng) minLng = lng;
		if (lat < minLat) minLat = lat;
		if (lng > maxLng) maxLng = lng;
		if (lat > maxLat) maxLat = lat;
	}
	return { minLng, minLat, maxLng, maxLat };
}

function gridKeysForBbox(bbox, pad = 1) {
	const keys = new Set();
	const i0 = Math.floor(bbox.minLat / GRID_DEG) - pad;
	const i1 = Math.floor(bbox.maxLat / GRID_DEG) + pad;
	const j0 = Math.floor(bbox.minLng / GRID_DEG) - pad;
	const j1 = Math.floor(bbox.maxLng / GRID_DEG) + pad;
	for (let i = i0; i <= i1; i++) {
		for (let j = j0; j <= j1; j++) {
			keys.add(`${i}:${j}`);
		}
	}
	return keys;
}

/**
 * @param {Array<{ id: string, coords: [number,number][], highway: string, name?: string }>} segments
 */
export function buildSegmentIndex(segments) {
	const byId = new Map();
	const grid = new Map();

	for (const seg of segments) {
		byId.set(seg.id, seg);
		const bbox = bboxOfCoords(seg.coords);
		seg.bbox = bbox;
		seg.lengthM = Math.round(pathLengthMeters(seg.coords));
		for (const key of gridKeysForBbox(bbox, 0)) {
			let list = grid.get(key);
			if (!list) {
				list = [];
				grid.set(key, list);
			}
			list.push(seg.id);
		}
	}

	return { byId, grid, segmentCount: segments.length };
}

function neighborKeys(lat, lng) {
	const i = Math.floor(lat / GRID_DEG);
	const j = Math.floor(lng / GRID_DEG);
	const keys = [];
	for (let di = -1; di <= 1; di++) {
		for (let dj = -1; dj <= 1; dj++) {
			keys.push(`${i + di}:${j + dj}`);
		}
	}
	return keys;
}

export function snapPointToSegment(index, lat, lng, maxDistM) {
	const candidates = new Set();
	for (const key of neighborKeys(lat, lng)) {
		const ids = index.grid.get(key);
		if (!ids) continue;
		for (const id of ids) candidates.add(id);
	}

	let bestId = null;
	let bestDist = maxDistM;

	for (const id of candidates) {
		const seg = index.byId.get(id);
		if (!seg) continue;
		const { minLat, maxLat, minLng, maxLng } = seg.bbox;
		const pad = (maxDistM / 111_320) * 1.5;
		if (
			lat < minLat - pad ||
			lat > maxLat + pad ||
			lng < minLng - pad ||
			lng > maxLng + pad
		) {
			continue;
		}
		const d = pointToPolylineMeters([lng, lat], seg.coords);
		if (d < bestDist) {
			bestDist = d;
			bestId = id;
		}
	}

	return bestId;
}

export function segmentsFromOverpassElements(elements) {
	const segments = [];

	for (const el of elements) {
		if (el.type !== "way" || !el.geometry?.length) continue;
		const coords = el.geometry.map((p) => [p.lon, p.lat]);
		const highway = el.tags?.highway ?? "";
		const name = el.tags?.name ?? "";
		const chunks = splitWayToSegments(coords);

		for (let i = 0; i < chunks.length; i++) {
			segments.push({
				id: `${el.id}:${i}`,
				coords: chunks[i],
				highway,
				name,
			});
		}
	}

	return segments;
}

export function loadSegmentsFromTileDir(tileDir) {
	if (!existsSync(tileDir)) return null;

	const bboxCache = join(tileDir, "idf-work-bbox.json");
	if (existsSync(bboxCache)) {
		const data = JSON.parse(readFileSync(bboxCache, "utf-8"));
		return segmentsFromOverpassElements(data.elements ?? []);
	}

	const files = readdirSync(tileDir).filter((f) => /^r\d+c\d+\.json$/.test(f));
	if (files.length === 0) return null;

	const all = [];
	for (const file of files) {
		const data = JSON.parse(readFileSync(join(tileDir, file), "utf-8"));
		all.push(...segmentsFromOverpassElements(data.elements ?? []));
	}
	return all;
}

export function loadSegmentsFromGeoJson(path) {
	const raw = JSON.parse(readFileSync(path, "utf-8"));
	const segments = [];

	for (const f of raw.features ?? []) {
		if (f.geometry?.type !== "LineString") continue;
		const coords = f.geometry.coordinates;
		segments.push({
			id: f.properties?.segmentId ?? f.id ?? `seg-${segments.length}`,
			coords,
			highway: f.properties?.highway ?? "",
			name: f.properties?.name ?? "",
		});
	}

	return segments;
}
