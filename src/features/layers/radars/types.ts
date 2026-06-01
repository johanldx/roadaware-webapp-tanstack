import type { Feature, FeatureCollection, Point } from "geojson";

export type FixedRadarType = "ETF" | "ETD" | "ETT" | "ETU";

export interface RadarProperties {
	id: string;
	radarType: FixedRadarType;
	speedLimit: number | null;
	inServiceSince: string | null;
}

export type RadarFeature = Feature<Point, RadarProperties>;
export type RadarCollection = FeatureCollection<Point, RadarProperties>;

export const RADAR_TYPE_LABELS: Record<FixedRadarType, string> = {
	ETF: "Radar fixe",
	ETD: "Radar discriminant",
	ETT: "Radar fixe (nouvelle génération)",
	ETU: "Radar fixe urbain",
};
