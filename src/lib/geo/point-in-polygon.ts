/** Point dans un anneau fermé [lng, lat] (ray casting). */
export function pointInRing(
	lng: number,
	lat: number,
	ring: [number, number][],
): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const pi = ring[i];
		const pj = ring[j];
		if (pi === undefined || pj === undefined) continue;
		const [xi, yi] = pi;
		const [xj, yj] = pj;
		const intersect =
			yi > lat !== yj > lat &&
			lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

export function pointInPolygon(
	lng: number,
	lat: number,
	coordinates: [number, number][][] | [number, number][][][],
): boolean {
	if (!coordinates.length) return false;

	if (typeof coordinates[0]?.[0]?.[0] === "number") {
		const rings = coordinates as [number, number][][];
		const outer = rings[0];
		if (!outer || !pointInRing(lng, lat, outer)) return false;
		for (let h = 1; h < rings.length; h++) {
			const hole = rings[h];
			if (hole && pointInRing(lng, lat, hole)) return false;
		}
		return true;
	}

	const polys = coordinates as [number, number][][][];
	for (const poly of polys) {
		if (pointInPolygon(lng, lat, poly)) return true;
	}
	return false;
}
