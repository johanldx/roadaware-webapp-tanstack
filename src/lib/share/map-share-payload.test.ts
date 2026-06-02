import { describe, expect, it } from "vitest";

import {
	buildMapSharePayload,
	decodeMapSharePayload,
	encodeMapSharePayload,
} from "./map-share-payload";

describe("map-share-payload", () => {
	const state = {
		lng: 2.3522,
		lat: 48.8566,
		zoom: 10.5,
		at: "2026-06-01T14:00:00.000Z",
		layers: {
			sinuosity: true,
			rideability: true,
			weatherClassic: false,
			radars: false,
			risk: true,
			relief: false,
		},
		basemapId: "satellite" as const,
	};

	it("round-trips via base64url", () => {
		const encoded = encodeMapSharePayload(state);
		expect(encoded).not.toContain("+");
		expect(encoded.length).toBeLessThan(200);
		const decoded = decodeMapSharePayload(encoded);
		expect(decoded).toEqual(state);
	});

	it("builds compact payload", () => {
		const p = buildMapSharePayload(state);
		expect(p.l).toBe("srk");
		expect(p.b).toBe("t");
	});
});
