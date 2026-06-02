import { z } from "zod";

import type { BasemapId } from "#/config/map";
import { LAYER_DEFINITIONS, type LayerId } from "#/types/layers";

const LAYER_CHAR: Record<LayerId, string> = {
	sinuosity: "s",
	rideability: "r",
	radars: "d",
	risk: "k",
	relief: "e",
};

const payloadSchema = z.object({
	v: z.literal(1),
	c: z.tuple([z.number(), z.number(), z.number()]),
	a: z.string().optional(),
	l: z.string(),
	b: z.enum(["p", "t"]),
});

export type MapSharePayload = z.infer<typeof payloadSchema>;

export interface MapShareState {
	lng: number;
	lat: number;
	zoom: number;
	at?: string;
	layers: Record<LayerId, boolean>;
	basemapId: BasemapId;
}

function basemapToChar(id: BasemapId): "p" | "t" {
	return id === "satellite" ? "t" : "p";
}

function charToBasemap(c: "p" | "t"): BasemapId {
	return c === "t" ? "satellite" : "carto-voyager";
}

function layersToString(layers: Record<LayerId, boolean>): string {
	return (Object.keys(LAYER_DEFINITIONS) as LayerId[])
		.filter((id) => layers[id])
		.map((id) => LAYER_CHAR[id])
		.join("");
}

function stringToLayers(s: string): Record<LayerId, boolean> {
	const active = new Set(s.split(""));
	const out = {} as Record<LayerId, boolean>;
	for (const id of Object.keys(LAYER_DEFINITIONS) as LayerId[]) {
		const c = LAYER_CHAR[id];
		out[id] = c ? active.has(c) : false;
	}
	return out;
}

export function buildMapSharePayload(state: MapShareState): MapSharePayload {
	return {
		v: 1,
		c: [
			Math.round(state.lng * 1e4) / 1e4,
			Math.round(state.lat * 1e4) / 1e4,
			Math.round(state.zoom * 10) / 10,
		],
		...(state.at ? { a: state.at } : {}),
		l: layersToString(state.layers),
		b: basemapToChar(state.basemapId),
	};
}

export function encodeMapSharePayload(state: MapShareState): string {
	const json = JSON.stringify(buildMapSharePayload(state));
	const bytes = new TextEncoder().encode(json);
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export function decodeMapSharePayload(encoded: string): MapShareState | null {
	try {
		const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const pad =
			padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
		const json = atob(padded + pad);
		const raw = JSON.parse(json) as unknown;
		const parsed = payloadSchema.safeParse(raw);
		if (!parsed.success) return null;
		const { c, a, l, b } = parsed.data;
		return {
			lng: c[0],
			lat: c[1],
			zoom: c[2],
			at: a,
			layers: stringToLayers(l),
			basemapId: charToBasemap(b),
		};
	} catch {
		return null;
	}
}

export function sharePageUrl(encoded: string): string {
	if (typeof window === "undefined") return `/share?s=${encoded}`;
	return `${window.location.origin}/share?s=${encoded}`;
}

export function appUrlFromPayload(encoded: string): string {
	return `/app?s=${encoded}`;
}

export function layerLabelsFromPayload(state: MapShareState): string[] {
	return (Object.keys(LAYER_DEFINITIONS) as LayerId[])
		.filter((id) => state.layers[id])
		.map((id) => LAYER_DEFINITIONS[id].label);
}
