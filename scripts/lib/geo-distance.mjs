/**
 * Distances géodésiques (scripts Node uniquement).
 */

export const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters([lng1, lat1], [lng2, lat2]) {
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const x =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function pathLengthMeters(coords) {
	let sum = 0;
	for (let i = 1; i < coords.length; i++) {
		sum += distanceMeters(coords[i - 1], coords[i]);
	}
	return sum;
}

/** Distance point → segment [lng,lat] (approx. plane local). */
export function pointToSegmentMeters(point, a, b) {
	const [px, py] = point;
	const [ax, ay] = a;
	const [bx, by] = b;
	const cosLat = Math.cos(((ay + by) / 2) * Math.PI) / 180;
	const mx = (bx - ax) * cosLat;
	const my = by - ay;
	const len2 = mx * mx + my * my;
	if (len2 < 1e-12) return distanceMeters(point, a);

	let t = ((px - ax) * cosLat * mx + (py - ay) * my) / len2;
	t = Math.max(0, Math.min(1, t));
	const qx = ax + (t * mx) / cosLat;
	const qy = ay + t * my;
	return distanceMeters(point, [qx, qy]);
}

export function pointToPolylineMeters(point, coords) {
	let best = Infinity;
	for (let i = 1; i < coords.length; i++) {
		const d = pointToSegmentMeters(point, coords[i - 1], coords[i]);
		if (d < best) best = d;
	}
	return best;
}
