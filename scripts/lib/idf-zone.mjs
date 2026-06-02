/**
 * Zone IDF + marge (partagé par les scripts d’export).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { distanceMeters, pointToSegmentMeters } from "./geo-distance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BOUNDARY_PATH = join(ROOT, "src/data/idf-boundary.json");

export const IDF_BUFFER_M = 5000;
export const IDF_DEPS = new Set([
	"75",
	"77",
	"78",
	"91",
	"92",
	"93",
	"94",
	"95",
]);

const collection = JSON.parse(readFileSync(BOUNDARY_PATH, "utf-8"));
const geometry = collection.features[0].geometry;
const RING = geometry.coordinates[0];

function bboxFromRing(ring) {
	let west = Infinity;
	let south = Infinity;
	let east = -Infinity;
	let north = -Infinity;
	for (const [lng, lat] of ring) {
		if (lng < west) west = lng;
		if (lng > east) east = lng;
		if (lat < south) south = lat;
		if (lat > north) north = lat;
	}
	return { west, south, east, north };
}

function expandBounds(bounds, bufferM, lat = 48.6) {
	const dLat = bufferM / 111_320;
	const dLng = bufferM / (111_320 * Math.cos((lat * Math.PI) / 180));
	return {
		west: bounds.west - dLng,
		south: bounds.south - dLat,
		east: bounds.east + dLng,
		north: bounds.north + dLat,
	};
}

function pointInRing(lng, lat, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		const intersect =
			yi > lat !== yj > lat &&
			lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

function distanceToBoundaryM(lng, lat, ring) {
	let min = Infinity;
	for (let i = 0; i < ring.length - 1; i++) {
		const d = pointToSegmentMeters([lng, lat], ring[i], ring[i + 1]);
		if (d < min) min = d;
	}
	return min;
}

export const IDF_BOUNDARY_RING = RING;
export const IDF_BOUNDS = bboxFromRing(RING);
export const IDF_WORK_BOUNDS = expandBounds(IDF_BOUNDS, IDF_BUFFER_M);

export function isInIdfRegion(lng, lat) {
	if (
		lng < IDF_BOUNDS.west ||
		lng > IDF_BOUNDS.east ||
		lat < IDF_BOUNDS.south ||
		lat > IDF_BOUNDS.north
	) {
		return false;
	}
	return pointInRing(lng, lat, RING);
}

/** Région administrative + marge (ex. 5 km hors contour). */
export function isInIdfWorkArea(lng, lat, bufferM = IDF_BUFFER_M) {
	if (
		lng < IDF_WORK_BOUNDS.west ||
		lng > IDF_WORK_BOUNDS.east ||
		lat < IDF_WORK_BOUNDS.south ||
		lat > IDF_WORK_BOUNDS.north
	) {
		return false;
	}
	if (isInIdfRegion(lng, lat)) return true;
	return distanceToBoundaryM(lng, lat, RING) <= bufferM;
}

/** Filtre rapide bbox avant test polygone. */
export function inWorkBbox(lat, lng) {
	return (
		lat >= IDF_WORK_BOUNDS.south &&
		lat <= IDF_WORK_BOUNDS.north &&
		lng >= IDF_WORK_BOUNDS.west &&
		lng <= IDF_WORK_BOUNDS.east
	);
}
