import { describe, expect, it } from "vitest";

import { computeRideabilityScore } from "./scoring";

describe("computeRideabilityScore", () => {
	const base = {
		precipitationMm: 0,
		precipitationProbability: 10,
		windSpeedKmh: 15,
		cloudCoverPercent: 20,
		isDay: true,
		sunrise: new Date("2026-06-01T05:30:00"),
		sunset: new Date("2026-06-01T21:30:00"),
	};

	it("favorise une journée ensoleillée et douce", () => {
		const result = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 20,
		});
		expect(result.score).toBeGreaterThanOrEqual(70);
	});

	it("pénalise la pluie forte", () => {
		const result = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 18,
			precipitationMm: 3,
			precipitationProbability: 90,
		});
		expect(result.score).toBeLessThan(50);
	});

	it("bonus golden hour", () => {
		const day = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 20,
		});
		const golden = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T20:45:00"),
			temperatureC: 20,
		});
		expect(golden.score).toBeGreaterThanOrEqual(day.score - 5);
	});

	it("pénalise la chaleur >25°C avec fort soleil", () => {
		const mild = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 24,
			shortwaveRadiation: 700,
		});
		const hot = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 30,
			shortwaveRadiation: 760,
		});
		expect(hot.score).toBeLessThan(mild.score);
	});

	it("pénalise fortement la pluie à venir", () => {
		const dry = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 20,
			precipitationMm: 0.1,
			precipitationProbability: 12,
		});
		const rainSoon = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 20,
			precipitationMm: 0.3,
			precipitationProbability: 65,
		});
		expect(rainSoon.score).toBeLessThan(dry.score);
		expect(rainSoon.score).toBeLessThanOrEqual(48);
	});

	it("écrase le score en cas de grosse pluie mm/h", () => {
		const heavy = computeRideabilityScore({
			...base,
			at: new Date("2026-06-01T14:00:00"),
			temperatureC: 15,
			precipitationMm: 11,
			precipitationProbability: 95,
		});
		expect(heavy.score).toBeLessThanOrEqual(12);
	});
});
