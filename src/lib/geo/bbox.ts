import type { ViewportBounds } from "#/types/geo";

export function boundsToKey(bounds: ViewportBounds, precision = 3): string {
	const f = (n: number) => n.toFixed(precision);
	return `${f(bounds.west)},${f(bounds.south)},${f(bounds.east)},${f(bounds.north)}`;
}

export function boundsIntersect(a: ViewportBounds, b: ViewportBounds): boolean {
	return !(
		a.east < b.west ||
		a.west > b.east ||
		a.north < b.south ||
		a.south > b.north
	);
}
