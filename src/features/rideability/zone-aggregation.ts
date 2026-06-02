import type { Feature, FeatureCollection, Point } from "geojson";

import { isInIdfWorkArea } from "#/config/idf-boundary";
import { IDF_DISPLAY_GRID, IDF_WORK_BOUNDS } from "#/config/region";

import { IDF_DISPLAY_CELLS } from "./grid";
import type { RideabilityGridCache } from "./grid-cache";
import { interpolateZoneRideability } from "./interpolate";
import type { RideabilityScore } from "./scoring";

const CELL_BY_ID = new Map(IDF_DISPLAY_CELLS.map((c) => [c.id, c]));

export interface ZoneBlockProps {
	score: number;
	blockSize: number;
	br: number;
	bc: number;
}

/** Plus on dézoome, plus les blocs sont grands (moins de pastilles). */
export function blockSizeForZoom(zoom: number): number {
	if (zoom >= 11.5) return 1;
	if (zoom >= 10) return 2;
	if (zoom >= 9) return 3;
	if (zoom >= 8) return 5;
	return 7;
}

/** Centre géographique d’un bloc de grille (aligné sur les cellules). */
export function blockCenterLngLat(
	br: number,
	bc: number,
	blockSize: number,
): { lat: number; lng: number } {
	const { cols, rows } = IDF_DISPLAY_GRID;
	const { west, south, east, north } = IDF_WORK_BOUNDS;
	const dLng = (east - west) / cols;
	const dLat = (north - south) / rows;

	const rowEnd = Math.min(br + blockSize, rows);
	const colEnd = Math.min(bc + blockSize, cols);
	const blockRows = rowEnd - br;
	const blockCols = colEnd - bc;

	return {
		lng: west + (bc + blockCols / 2) * dLng,
		lat: south + (br + blockRows / 2) * dLat,
	};
}

function blockScore(
	displayScores: Map<string, number>,
	br: number,
	bc: number,
	blockSize: number,
): number {
	const { cols, rows } = IDF_DISPLAY_GRID;
	let sum = 0;
	let count = 0;

	for (let r = br; r < Math.min(br + blockSize, rows); r++) {
		for (let c = bc; c < Math.min(bc + blockSize, cols); c++) {
			const id = `dr${r}c${c}`;
			const cell = CELL_BY_ID.get(id);
			sum += displayScores.get(id) ?? displayScores.get(cell?.id ?? "") ?? 50;
			count++;
		}
	}

	return count > 0 ? Math.round(sum / count) : 50;
}

function geoDist2(
	a: { lng: number; lat: number },
	b: { lng: number; lat: number },
): number {
	const dlng = a.lng - b.lng;
	const dlat = a.lat - b.lat;
	return dlng * dlng + dlat * dlat;
}

export function aggregatedZonesGeoJson(
	displayScores: Map<string, number>,
	blockSize: number,
): FeatureCollection<Point> {
	const { cols, rows } = IDF_DISPLAY_GRID;
	const features: Feature<Point>[] = [];
	for (let br = 0; br < rows; br += blockSize) {
		for (let bc = 0; bc < cols; bc += blockSize) {
			const score = blockScore(displayScores, br, bc, blockSize);
			const { lat, lng } = blockCenterLngLat(br, bc, blockSize);
			if (!isInIdfWorkArea(lng, lat)) continue;
			features.push({
				type: "Feature",
				id: `agg-r${br}c${bc}-b${blockSize}`,
				properties: { score, blockSize, br, bc },
				geometry: {
					type: "Point",
					coordinates: [lng, lat],
				},
			});
		}
	}

	return { type: "FeatureCollection", features };
}

/** Trouve le bloc affiché le plus proche d'un clic (même sans pastille sous le pointeur). */
export function findClosestZoneBlock(
	displayScores: Map<string, number>,
	blockSize: number,
	lngLat: { lng: number; lat: number },
): ZoneBlockProps | null {
	const { cols, rows } = IDF_DISPLAY_GRID;
	let best: ZoneBlockProps | null = null;
	let bestDist = Infinity;

	for (let br = 0; br < rows; br += blockSize) {
		for (let bc = 0; bc < cols; bc += blockSize) {
			const center = blockCenterLngLat(br, bc, blockSize);
			if (!isInIdfWorkArea(center.lng, center.lat)) continue;
			const d2 = geoDist2(center, lngLat);
			if (d2 >= bestDist) continue;
			bestDist = d2;
			best = {
				score: blockScore(displayScores, br, bc, blockSize),
				blockSize,
				br,
				bc,
			};
		}
	}

	return best;
}

/** Détail popup cohérent avec le score de la pastille. */
export function rideabilityForZoneBlock(
	props: ZoneBlockProps,
	cache: RideabilityGridCache,
): RideabilityScore {
	const { lat, lng } = blockCenterLngLat(props.br, props.bc, props.blockSize);
	return interpolateZoneRideability(lat, lng, cache.samples, props.score);
}

/** Vérifie que les clés de la carte correspondent aux cellules affichées. */
export function normalizeDisplayScores(
	displayScores: Map<string, number>,
): Map<string, number> {
	const out = new Map<string, number>();
	for (const cell of IDF_DISPLAY_CELLS) {
		out.set(cell.id, displayScores.get(cell.id) ?? 50);
	}
	return out;
}
