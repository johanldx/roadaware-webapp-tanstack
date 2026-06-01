import { describe, expect, it } from "vitest";

import type { RideabilityFactor } from "./scoring";
import { buildZoneMiniRecap, zoneHeadline } from "./zone-popup-copy";

const factor = (
	id: RideabilityFactor["id"],
	score: number,
	detail: string,
): RideabilityFactor => ({
	id,
	label: id,
	score,
	detail,
});

describe("buildZoneMiniRecap", () => {
	it("explique un score bas surtout par la pluie", () => {
		const recap = buildZoneMiniRecap(50, [
			factor("temperature", 87, "17 °C — température confortable"),
			factor("rain", 21, "Pluie active (~2.6 mm)"),
			factor("wind", 100, "15 km/h — vent faible"),
			factor("light", 55, "Très nuageux (100 %) — luminosité basse"),
			factor("sun", 70, "Hors fenêtre coucher / lever"),
		]);

		expect(recap.lead.length).toBeGreaterThan(10);
		expect(recap.holds.some((h) => h.toLowerCase().includes("pluie"))).toBe(
			true,
		);
		expect(
			recap.helps.some((h) => h.includes("17 °C") || h.includes("Vent")),
		).toBe(true);
		expect(recap.tip?.toLowerCase()).toContain("imperméable");
	});

	it("récap positif sans liste frein si tout va bien", () => {
		const recap = buildZoneMiniRecap(88, [
			factor("temperature", 90, "20 °C — température confortable"),
			factor("rain", 95, "Pas de pluie prévue"),
			factor("wind", 100, "12 km/h — vent faible"),
			factor("light", 85, "Ciel dégagé — bonne visibilité"),
			factor("sun", 80, "Journée — avant la golden hour"),
		]);

		expect(recap.holds).toHaveLength(0);
		expect(recap.helps.length).toBeGreaterThan(0);
		expect(recap.lead).toContain("belle balade");
	});
});

describe("zoneHeadline", () => {
	it("titre lisible", () => {
		expect(zoneHeadline("Médiocre")).toBe("Conditions mitigées");
	});
});
