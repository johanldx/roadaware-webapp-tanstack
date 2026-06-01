import type { BBox, Feature, FeatureCollection, Geometry } from "geojson";

export type { BBox, Feature, FeatureCollection, Geometry };

export interface ViewportBounds {
	west: number;
	south: number;
	east: number;
	north: number;
}

export function bboxToViewport(bounds: BBox): ViewportBounds {
	const [west, south, east, north] = bounds;
	return { west, south, east, north };
}
