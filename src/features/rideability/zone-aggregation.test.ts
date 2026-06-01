import { describe, expect, it } from "vitest";

import { isInIdfWorkArea } from "#/config/idf-boundary";
import { IDF_DISPLAY_GRID } from "#/config/region";

import { IDF_DISPLAY_CELLS } from "./grid";
import {
	aggregatedZonesGeoJson,
	blockCenterLngLat,
	blockSizeForZoom,
} from "./zone-aggregation";

describe("blockSizeForZoom", () => {
	it("agrandit les blocs quand on dézoome", () => {
		expect(blockSizeForZoom(12)).toBe(1);
		expect(blockSizeForZoom(10.5)).toBe(2);
		expect(blockSizeForZoom(9)).toBe(3);
		expect(blockSizeForZoom(7)).toBe(7);
	});
});

describe("aggregatedZonesGeoJson", () => {
	it("réduit le nombre de pastilles avec un grand bloc", () => {
		const scores = new Map(IDF_DISPLAY_CELLS.map((c) => [c.id, 70]));
		const fine = aggregatedZonesGeoJson(scores, 1).features.length;
		const coarse = aggregatedZonesGeoJson(scores, 8).features.length;
		expect(coarse).toBeLessThan(fine);
		expect(fine).toBeLessThanOrEqual(
			IDF_DISPLAY_GRID.cols * IDF_DISPLAY_GRID.rows,
		);
		expect(fine).toBeGreaterThan(0);
	});

	it("moyenne les scores du bloc", () => {
		const cellIds = new Set(IDF_DISPLAY_CELLS.map((c) => c.id));
		const { cols, rows } = IDF_DISPLAY_GRID;
		let br = 0;
		let bc = 0;
		let found = false;

		outer: for (let r = 0; r < rows - 1; r += 2) {
			for (let c = 0; c < cols - 1; c += 2) {
				const ids = [
					`dr${r}c${c}`,
					`dr${r}c${c + 1}`,
					`dr${r + 1}c${c}`,
					`dr${r + 1}c${c + 1}`,
				];
				if (!ids.every((id) => cellIds.has(id))) continue;
				const center = blockCenterLngLat(r, c, 2);
				if (!isInIdfWorkArea(center.lng, center.lat)) continue;
				br = r;
				bc = c;
				found = true;
				break outer;
			}
		}
		expect(found).toBe(true);

		const scores = new Map<string, number>();
		const blockCellIds = [
			`dr${br}c${bc}`,
			`dr${br}c${bc + 1}`,
			`dr${br + 1}c${bc}`,
			`dr${br + 1}c${bc + 1}`,
		];
		const blockScores = [80, 60, 60, 80];
		for (const [i, id] of blockCellIds.entries()) {
			const score = blockScores[i];
			if (score === undefined) continue;
			scores.set(id, score);
		}

		const block = aggregatedZonesGeoJson(scores, 2).features.find(
			(f) => f.properties?.br === br && f.properties?.bc === bc,
		);
		expect(block?.properties?.score).toBe(70);
	});
});

describe("blockCenterLngLat", () => {
	it("place le centre au milieu géométrique du bloc", () => {
		const c1 = blockCenterLngLat(0, 0, 2);
		const c2 = blockCenterLngLat(0, 0, 1);
		expect(c1.lat).toBeGreaterThan(c2.lat);
		expect(c1.lng).toBeGreaterThan(c2.lng);
	});
});
