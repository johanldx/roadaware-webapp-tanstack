import type { RideabilityScore } from "./scoring";

export interface ScoreSampleDetail {
	lat: number;
	lng: number;
	score: number;
	result: RideabilityScore;
}

export interface RideabilityGridCache {
	samples: ScoreSampleDetail[];
	displayScores: Map<string, number>;
}
