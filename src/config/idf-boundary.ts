import { distanceToPolygonBoundaryM } from "#/lib/geo/distance-to-polygon";
import { pointInPolygon } from "#/lib/geo/point-in-polygon";
import boundaryCollection from "../data/idf-boundary.json";

export type LngLat = [number, number];

/** Marge hors contour pour collecte météo / exports (accidents, radars, OSM). */
export const IDF_BUFFER_M = 5000;

const feature = boundaryCollection.features[0];
if (!feature?.geometry) {
	throw new Error("idf-boundary.json invalide");
}

const { geometry } = feature;

function outerBoundaryRing(geom: typeof geometry): LngLat[] {
	if (geom.type === "Polygon") {
		const ring = geom.coordinates[0];
		if (!ring) throw new Error("idf-boundary.json : polygone sans anneau");
		return ring as LngLat[];
	}
	const ring = geom.coordinates[0]?.[0];
	if (!ring) throw new Error("idf-boundary.json : multipolygone invalide");
	return ring as LngLat[];
}

export const IDF_BOUNDARY_RING = outerBoundaryRing(geometry);

function bboxFromRing(ring: LngLat[]) {
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

function expandBounds(
	bounds: ReturnType<typeof bboxFromRing>,
	bufferM: number,
	lat = 48.6,
) {
	const dLat = bufferM / 111_320;
	const dLng = bufferM / (111_320 * Math.cos((lat * Math.PI) / 180));
	return {
		west: bounds.west - dLng,
		south: bounds.south - dLat,
		east: bounds.east + dLng,
		north: bounds.north + dLat,
	};
}

/** Contour strict (affichage carte). */
export const IDF_BOUNDS = bboxFromRing(IDF_BOUNDARY_RING);

/** Bbox élargie (~5 km) pour requêtes et grilles de calcul. */
export const IDF_WORK_BOUNDS = expandBounds(IDF_BOUNDS, IDF_BUFFER_M);

export const IDF_BOUNDARY_GEOJSON = boundaryCollection;

export function isInIdfRegion(lng: number, lat: number): boolean {
	if (
		lng < IDF_BOUNDS.west ||
		lng > IDF_BOUNDS.east ||
		lat < IDF_BOUNDS.south ||
		lat > IDF_BOUNDS.north
	) {
		return false;
	}
	return pointInPolygon(lng, lat, geometry.coordinates as [number, number][][]);
}

/** Zone de travail : IDF + marge autour du contour (données & calculs). */
export function isInIdfWorkArea(
	lng: number,
	lat: number,
	bufferM = IDF_BUFFER_M,
): boolean {
	if (
		lng < IDF_WORK_BOUNDS.west ||
		lng > IDF_WORK_BOUNDS.east ||
		lat < IDF_WORK_BOUNDS.south ||
		lat > IDF_WORK_BOUNDS.north
	) {
		return false;
	}
	if (isInIdfRegion(lng, lat)) return true;
	return distanceToPolygonBoundaryM(lng, lat, IDF_BOUNDARY_RING) <= bufferM;
}

/** Bbox MapLibre : [[ouest, sud], [est, nord]] */
export function idfFitBounds(): [[number, number], [number, number]] {
	const { west, south, east, north } = IDF_BOUNDS;
	return [
		[west, south],
		[east, north],
	];
}

/** Coins image MapLibre (sens horaire depuis le nord-ouest). */
export function idfImageCoordinates(
	bounds: typeof IDF_BOUNDS = IDF_BOUNDS,
): [[number, number], [number, number], [number, number], [number, number]] {
	const { west, south, east, north } = bounds;
	return [
		[west, north],
		[east, north],
		[east, south],
		[west, south],
	];
}
