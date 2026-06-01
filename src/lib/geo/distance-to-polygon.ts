import { pointToSegmentMeters } from "./geo-distance";

/** Distance minimale (m) du point au contour du polygone (anneau extérieur). */
export function distanceToPolygonBoundaryM(
	lng: number,
	lat: number,
	ring: [number, number][],
): number {
	let min = Infinity;
	const n = ring.length;
	if (n < 2) return min;

	for (let i = 0; i < n - 1; i++) {
		const a = ring[i];
		const b = ring[i + 1];
		if (a === undefined || b === undefined) continue;
		const d = pointToSegmentMeters([lng, lat], a, b);
		if (d < min) min = d;
	}
	return min;
}
