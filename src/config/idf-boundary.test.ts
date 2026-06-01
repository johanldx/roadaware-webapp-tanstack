import { describe, expect, it } from "vitest";

import { isInIdfRegion, isInIdfWorkArea } from "./idf-boundary";

describe("zone IDF + marge 5 km", () => {
	it("Paris est dans la région et la zone de travail", () => {
		expect(isInIdfRegion(2.3522, 48.8566)).toBe(true);
		expect(isInIdfWorkArea(2.3522, 48.8566)).toBe(true);
	});

	it("Dreux est hors zone de travail", () => {
		expect(isInIdfRegion(1.49, 48.73)).toBe(false);
		expect(isInIdfWorkArea(1.49, 48.73)).toBe(false);
	});

	it("Chartres est hors marge", () => {
		expect(isInIdfWorkArea(1.48, 48.44)).toBe(false);
	});
});
