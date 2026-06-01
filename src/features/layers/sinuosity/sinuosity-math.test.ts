import { describe, expect, it } from "vitest";

import {
	computeCurvatureMetrics,
	type LngLat,
	metricsToScore,
	passesQualityGate,
	segmentizeAndScore,
	shouldDisplayScore,
	sinuosityScoreForCoords,
} from "./sinuosity-math";

describe("curvature scoring v4", () => {
	it("score faible pour une ligne droite", () => {
		const line: LngLat[] = [
			[2.35, 48.85],
			[2.36, 48.85],
			[2.37, 48.85],
			[2.38, 48.85],
			[2.39, 48.85],
		];
		const score = sinuosityScoreForCoords(line, 10);
		expect(score == null || score < 0.62).toBe(true);
	});

	it("score élevé pour une route sinueuse", () => {
		const serpentine: LngLat[] = [[2.35, 48.85]];
		for (let i = 1; i <= 48; i++) {
			serpentine.push([
				2.35 + i * 0.0009,
				48.85 + (i % 2 === 0 ? 0.0055 : -0.0055),
			]);
		}
		const m = computeCurvatureMetrics(serpentine, 10, "secondary");
		expect(m).not.toBeNull();
		if (!m) throw new Error("métriques attendues");
		expect(m.turnDensity).toBeGreaterThan(50);
		const score = metricsToScore(m);
		expect(score).toBeGreaterThanOrEqual(0.62);
		expect(passesQualityGate(m, "secondary")).toBe(true);
	});

	it("rejette une route quasi droite", () => {
		const straight: LngLat[] = [];
		for (let i = 0; i <= 40; i++) {
			straight.push([2.35 + i * 0.004, 48.85 + (i % 5 === 0 ? 0.0002 : 0)]);
		}
		const m = computeCurvatureMetrics(straight, 10, "tertiary");
		expect(m == null || !passesQualityGate(m, "tertiary")).toBe(true);
	});

	it("détecte des virages doux sur voie rapide (type N118)", () => {
		const n118PontDeSevre: LngLat[] = [
			[2.2181152, 48.8198931],
			[2.2184271, 48.8203827],
			[2.2185261, 48.820518],
			[2.2188317, 48.8208118],
			[2.21909, 48.8209913],
			[2.219425, 48.8211585],
			[2.2197309, 48.8212764],
			[2.2201746, 48.8214068],
			[2.2211993, 48.8216697],
			[2.2215663, 48.8217883],
			[2.2218002, 48.8218942],
			[2.2220874, 48.8220887],
			[2.2222551, 48.8222557],
			[2.2224114, 48.8225322],
			[2.222447, 48.8227224],
			[2.2224366, 48.8228939],
			[2.2223456, 48.8231636],
		];
		const m = computeCurvatureMetrics(n118PontDeSevre, 200, "trunk");
		expect(m).not.toBeNull();
		if (!m) throw new Error("métriques attendues");
		expect(metricsToScore(m)).toBeGreaterThanOrEqual(0.68);
		expect(
			segmentizeAndScore(n118PontDeSevre, { highway: "trunk" }).length,
		).toBeGreaterThan(0);
	});

	it("shouldDisplayScore plus strict sur autoroute", () => {
		expect(shouldDisplayScore(0.65, "tertiary")).toBe(true);
		expect(shouldDisplayScore(0.6, "tertiary")).toBe(false);
		expect(shouldDisplayScore(0.65, "motorway")).toBe(false);
		expect(shouldDisplayScore(0.7, "motorway")).toBe(true);
	});
});

describe("segmentizeAndScore", () => {
	it("ne garde que les segments au-dessus du seuil", () => {
		const straight: LngLat[] = [
			[2.35, 48.85],
			[2.45, 48.85],
			[2.55, 48.85],
		];
		const segs = segmentizeAndScore(straight, {
			minSegmentM: 10,
			maxSegmentM: 5000,
			minLengthM: 10,
		});
		expect(segs.length).toBe(0);
	});
});
