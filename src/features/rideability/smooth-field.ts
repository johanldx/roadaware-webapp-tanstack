import {
	IDF_BOUNDARY_RING,
	IDF_BOUNDS,
	idfImageCoordinates,
} from "#/config/idf-boundary";
import { rasterizePolygonMask } from "#/lib/geo/raster-mask";

import type { ScoreSample } from "./interpolate";

const W = 384;
const H = 256;

const STOPS: [number, number, number, number][] = [
	[0, 210, 45, 75],
	[35, 255, 175, 0],
	[50, 255, 200, 50],
	[65, 100, 200, 160],
	[80, 40, 175, 120],
	[100, 25, 155, 70],
];

let cachedMask: Uint8Array | null = null;

function regionMask(): Uint8Array {
	if (!cachedMask) {
		cachedMask = rasterizePolygonMask(IDF_BOUNDARY_RING, IDF_BOUNDS, W, H);
	}
	return cachedMask;
}

/** Retire les pixels de bord pour couper l’auréole du flou raster. */
function erodeMask(
	mask: Uint8Array,
	w: number,
	h: number,
	radius: number,
): Uint8Array {
	let current = mask;
	for (let pass = 0; pass < radius; pass++) {
		const next = new Uint8Array(current.length);
		for (let py = 0; py < h; py++) {
			for (let px = 0; px < w; px++) {
				const idx = py * w + px;
				if (!current[idx]) continue;
				let inside = true;
				for (let dy = -1; dy <= 1 && inside; dy++) {
					for (let dx = -1; dx <= 1 && inside; dx++) {
						const nx = px + dx;
						const ny = py + dy;
						if (
							nx < 0 ||
							nx >= w ||
							ny < 0 ||
							ny >= h ||
							!current[ny * w + nx]
						) {
							inside = false;
						}
					}
				}
				if (inside) next[idx] = 1;
			}
		}
		current = next;
	}
	return current;
}

function dist2(lat1: number, lng1: number, lat2: number, lng2: number) {
	const dLat = lat2 - lat1;
	const dLng = (lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180);
	return dLat * dLat + dLng * dLng;
}

function idwScore(lat: number, lng: number, samples: ScoreSample[]): number {
	if (samples.length === 0) return 50;
	let num = 0;
	let den = 0;
	for (const s of samples) {
		const d = Math.sqrt(dist2(lat, lng, s.lat, s.lng));
		if (d < 0.00008) return s.score;
		const w = 1 / d ** 1.15;
		num += w * s.score;
		den += w;
	}
	return num / den;
}

function lerpColor(score: number): [number, number, number] {
	const s = Math.max(0, Math.min(100, score));
	for (let i = 0; i < STOPS.length - 1; i++) {
		const a = STOPS[i];
		const b = STOPS[i + 1];
		if (a === undefined || b === undefined) continue;
		if (s >= a[0] && s <= b[0]) {
			const t = (s - a[0]) / (b[0] - a[0]);
			return [
				Math.round(a[1] + t * (b[1] - a[1])),
				Math.round(a[2] + t * (b[2] - a[2])),
				Math.round(a[3] + t * (b[3] - a[3])),
			];
		}
	}
	const last = STOPS[STOPS.length - 1];
	if (last === undefined) return [25, 155, 70];
	return [last[1], last[2], last[3]];
}

function boxBlur(
	data: Uint8ClampedArray,
	w: number,
	h: number,
	radius: number,
) {
	const out = new Uint8ClampedArray(data.length);
	const tmp = new Uint8ClampedArray(data.length);

	for (let pass = 0; pass < 2; pass++) {
		const src = pass === 0 ? data : tmp;
		const dst = pass === 0 ? tmp : out;

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				let r = 0;
				let g = 0;
				let b = 0;
				let a = 0;
				let n = 0;
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
						const i = (ny * w + nx) * 4;
						r += src[i] ?? 0;
						g += src[i + 1] ?? 0;
						b += src[i + 2] ?? 0;
						a += src[i + 3] ?? 0;
						n++;
					}
				}
				const o = (y * w + x) * 4;
				dst[o] = r / n;
				dst[o + 1] = g / n;
				dst[o + 2] = b / n;
				dst[o + 3] = a / n;
			}
		}
	}
	return out;
}

/** Raster lisse IDF → image pour MapLibre (masqué au contour régional). */
export function renderSmoothFieldImage(samples: ScoreSample[]): {
	url: string;
	coordinates: [
		[number, number],
		[number, number],
		[number, number],
		[number, number],
	];
} {
	const { west, south, east, north } = IDF_BOUNDS;
	const mask = regionMask();
	const edgeMask = erodeMask(mask, W, H, 2);
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D unavailable");

	const imageData = ctx.createImageData(W, H);
	const d = imageData.data;

	for (let py = 0; py < H; py++) {
		for (let px = 0; px < W; px++) {
			const i = (py * W + px) * 4;
			if (!mask[py * W + px]) {
				d[i + 3] = 0;
				continue;
			}

			const lng = west + (px / (W - 1)) * (east - west);
			const lat = north - (py / (H - 1)) * (north - south);
			const score = idwScore(lat, lng, samples);
			const [r, g, b] = lerpColor(score);

			d[i] = r;
			d[i + 1] = g;
			d[i + 2] = b;
			d[i + 3] = Math.round(0.74 * 255);
		}
	}

	// Flou très léger ; le masque érodé coupe l’auréole au contour IDF
	const blurred = boxBlur(d, W, H, 1);
	for (let py = 0; py < H; py++) {
		for (let px = 0; px < W; px++) {
			const idx = py * W + px;
			const i = idx * 4;
			if (!edgeMask[idx]) {
				blurred[i + 3] = 0;
				continue;
			}
			blurred[i + 3] = Math.round(0.74 * 255);
		}
	}

	imageData.data.set(blurred);
	ctx.putImageData(imageData, 0, 0);

	return {
		url: canvas.toDataURL("image/png"),
		coordinates: idfImageCoordinates(),
	};
}
