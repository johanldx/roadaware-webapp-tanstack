import type { Feature, FeatureCollection, LineString } from "geojson";

export interface SinuosityProperties {
	sinuosity: number;
	highway?: string;
}

export type SinuosityFeature = Feature<LineString, SinuosityProperties>;
export type SinuosityCollection = FeatureCollection<
	LineString,
	SinuosityProperties
>;
