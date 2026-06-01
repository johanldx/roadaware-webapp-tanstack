import type { Feature, FeatureCollection, LineString } from "geojson";

export type RiskLevel = 1 | 2 | 3;
export type RiskTrafficSource = "none" | "tmja";

export interface RiskSegmentProperties {
	segmentId: string;
	accidentCount: number;
	/** Accidents par km de tronçon (proxy uniforme). */
	accidentsPerKm: number;
	/** Percentile IDF sur accidents/km — base du score carte. */
	percentile: number;
	/** Percentile sur le nombre brut d’accidents (référence). */
	countPercentile: number;
	riskLevel: RiskLevel;
	riskScore: number;
	highway: string;
	name?: string;
	lengthM: number;
	yearsFrom: number;
	yearsTo: number;
	metric: "density";
	trafficSource: RiskTrafficSource;
	/** TMJA (véh/jour) si section de comptage proche. */
	tmja?: number;
	tmjaDistM?: number;
	tmjaMeasureYear?: number;
	/** Accidents pour 100 M véh·km (période BAAC). */
	accidentsPer100MVehKm?: number;
	/** Percentile IDF du ratio TMJA (tronçons matchés uniquement). */
	tmjaPercentile?: number;
}

export type RiskSegmentFeature = Feature<LineString, RiskSegmentProperties>;

export interface RiskCollection extends FeatureCollection<LineString> {
	features: RiskSegmentFeature[];
	metadata?: {
		source?: string;
		years?: string[];
		accidents?: number;
		snappedAccidents?: number;
		segments?: number;
		metric?: string;
		tmjaMatchedSegments?: number;
		exportedAt?: string;
	};
}
