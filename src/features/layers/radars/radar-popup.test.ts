import { describe, expect, it } from "vitest";

import { formatInServiceDuration } from "./radar-popup";

describe("formatInServiceDuration", () => {
	it("formate en années", () => {
		expect(formatInServiceDuration("31/10/2003 12:51")).toMatch(/\d+ an/);
	});

	it("gère une date récente", () => {
		const d = new Date();
		const raw = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} 00:00`;
		expect(formatInServiceDuration(raw)).toBe("Moins d'un mois");
	});

	it("retourne inconnu si absent", () => {
		expect(formatInServiceDuration(null)).toBe("Inconnu");
	});
});
