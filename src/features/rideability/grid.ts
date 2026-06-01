import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

import { isInIdfWorkArea } from "#/config/idf-boundary";
import {
	IDF_DISPLAY_GRID,
	IDF_SAMPLE_GRID,
	IDF_WORK_BOUNDS,
} from "#/config/region";

export interface GridCell {
	id: string;
	lat: number;
	lng: number;
}

function buildGrid(cols: number, rows: number, prefix: string): GridCell[] {
	const { west, south, east, north } = IDF_WORK_BOUNDS;
	const dLng = (east - west) / cols;
	const dLat = (north - south) / rows;
	const cells: GridCell[] = [];

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cellWest = west + col * dLng;
			const cellSouth = south + row * dLat;
			const lat = cellSouth + dLat / 2;
			const lng = cellWest + dLng / 2;
			if (!isInIdfWorkArea(lng, lat)) continue;
			cells.push({
				id: `${prefix}r${row}c${col}`,
				lat,
				lng,
			});
		}
	}
	return cells;
}

export const IDF_SAMPLE_CELLS = buildGrid(
	IDF_SAMPLE_GRID.cols,
	IDF_SAMPLE_GRID.rows,
	"s",
);

export const IDF_DISPLAY_CELLS = buildGrid(
	IDF_DISPLAY_GRID.cols,
	IDF_DISPLAY_GRID.rows,
	"d",
);

export function scoresToPointGeoJson(
	scores: Map<string, number>,
	cells: GridCell[],
): FeatureCollection<Point> {
	return {
		type: "FeatureCollection",
		features: cells.map(
			(cell): Feature<Point> => ({
				type: "Feature",
				properties: { score: scores.get(cell.id) ?? 50 },
				geometry: { type: "Point", coordinates: [cell.lng, cell.lat] },
			}),
		),
	};
}

export function scoresToFillGeoJson(
	scores: Map<string, number>,
): FeatureCollection<Polygon> {
	const { west, south, east, north } = IDF_WORK_BOUNDS;
	const { cols, rows } = IDF_DISPLAY_GRID;
	const dLng = (east - west) / cols;
	const dLat = (north - south) / rows;

	const features: Feature<Polygon>[] = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const id = `dr${row}c${col}`;
			const cellWest = west + col * dLng;
			const cellSouth = south + row * dLat;
			features.push({
				type: "Feature",
				properties: { score: scores.get(id) ?? 50 },
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[cellWest, cellSouth],
							[cellWest + dLng, cellSouth],
							[cellWest + dLng, cellSouth + dLat],
							[cellWest, cellSouth + dLat],
							[cellWest, cellSouth],
						],
					],
				},
			});
		}
	}
	return { type: "FeatureCollection", features };
}
