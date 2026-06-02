import type { Feature, FeatureCollection, LineString } from "geojson";

export interface ReliefProperties {
	relief: number;
	highway?: string;
}

export type ReliefFeature = Feature<LineString, ReliefProperties>;
export type ReliefCollection = FeatureCollection<LineString, ReliefProperties>;
