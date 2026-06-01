import { describe, expect, it } from "vitest";
import type { ScoreSampleDetail } from "./grid-cache";
import { interpolateZoneRideability } from "./interpolate";

const sample = (
	lat: number,
	lng: number,
	score: number,
): ScoreSampleDetail => ({
	lat,
	lng,
	score,
	result: {
		score,
		label: "Agréable",
		factors: [
			{
				id: "temperature",
				label: "Température",
				score: 80,
				detail: "20 °C",
			},
			{
				id: "rain",
				label: "Pluie",
				score: 100,
				detail: "Sec",
			},
			{
				id: "wind",
				label: "Vent",
				score: 100,
				detail: "Faible",
			},
			{
				id: "light",
				label: "Luminosité",
				score: 60,
				detail: "Nuageux",
			},
			{
				id: "sun",
				label: "Soleil",
				score: 70,
				detail: "Jour",
			},
		],
	},
});

describe("interpolateZoneRideability", () => {
	it("conserve le score affiché sur la pastille", () => {
		const samples = [
			sample(48.5, 2.0, 70),
			sample(48.9, 2.5, 90),
			sample(48.2, 1.8, 50),
		];
		const r = interpolateZoneRideability(48.6, 2.2, samples, 89);
		expect(r.score).toBe(89);
		expect(r.label).toBe("Idéal");
	});
});
