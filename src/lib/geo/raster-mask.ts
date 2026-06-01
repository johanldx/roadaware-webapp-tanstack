import type { LngLat } from "#/config/idf-boundary";

export interface GeoBounds {
	west: number;
	south: number;
	east: number;
	north: number;
}

/** Masque raster (alpha > 0 = à l’intérieur du polygone). */
export function rasterizePolygonMask(
	ring: LngLat[],
	bounds: GeoBounds,
	width: number,
	height: number,
): Uint8Array {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return new Uint8Array(width * height);

	const { west, south, east, north } = bounds;
	const wSpan = east - west;
	const hSpan = north - south;

	ctx.beginPath();
	for (let i = 0; i < ring.length; i++) {
		const pt = ring[i];
		if (!pt) continue;
		const [lng, lat] = pt;
		const x = ((lng - west) / wSpan) * (width - 1);
		const y = ((north - lat) / hSpan) * (height - 1);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fillStyle = "#000";
	ctx.fill();

	const data = ctx.getImageData(0, 0, width, height).data;
	const mask = new Uint8Array(width * height);
	for (let i = 0; i < mask.length; i++) {
		mask[i] = (data[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
	}
	return mask;
}
