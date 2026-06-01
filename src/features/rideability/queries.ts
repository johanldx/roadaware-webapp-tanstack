import { queryOptions } from "@tanstack/react-query";

import { fetchOpenMeteoForecast } from "#/lib/api/open-meteo";
import { queryKeys } from "#/lib/query/keys";

import { IDF_DISPLAY_CELLS, IDF_SAMPLE_CELLS } from "./grid";
import type { RideabilityGridCache, ScoreSampleDetail } from "./grid-cache";
import { interpolateDisplayScores } from "./interpolate";
import type { RideabilityScore } from "./scoring";
import { computeRideabilityScore } from "./scoring";

export type { RideabilityGridCache, ScoreSampleDetail } from "./grid-cache";

import { weatherSnapshotAt } from "./weather-snapshot";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchPointRideability(
	lat: number,
	lng: number,
	at: Date,
): Promise<RideabilityScore> {
	const forecast = await fetchOpenMeteoForecast(lat, lng);
	const snapshot = weatherSnapshotAt(forecast, at);
	if (!snapshot) {
		return {
			score: 50,
			label: "Correct",
			factors: [
				{
					id: "rain",
					label: "Météo",
					score: 50,
					detail: "Créneau hors prévisions disponibles (7 jours)",
				},
			],
		};
	}
	return computeRideabilityScore(snapshot);
}

export interface RideabilityGridData extends RideabilityGridCache {}

export function rideabilityGridQueryOptions(selectedAt: Date) {
	const atKey = selectedAt.toISOString();

	return queryOptions({
		queryKey: [...queryKeys.rideability.all, "grid", atKey] as const,
		queryFn: async (): Promise<RideabilityGridData> => {
			const samples: ScoreSampleDetail[] = [];

			for (const cell of IDF_SAMPLE_CELLS) {
				const result = await fetchPointRideability(
					cell.lat,
					cell.lng,
					selectedAt,
				);
				samples.push({
					lat: cell.lat,
					lng: cell.lng,
					score: result.score,
					result,
				});
				await sleep(120);
			}

			const displayScores = interpolateDisplayScores(
				samples,
				IDF_DISPLAY_CELLS,
			);
			return { samples, displayScores };
		},
		staleTime: 15 * 60_000,
		gcTime: 60 * 60_000,
		retry: 2,
	});
}

export function rideabilityPointQueryOptions(
	lat: number,
	lng: number,
	at: Date,
) {
	const atKey = at.toISOString();

	return queryOptions({
		queryKey: queryKeys.rideability.at(lat, lng, atKey),
		queryFn: async () => {
			const result = await fetchPointRideability(lat, lng, at);
			return { result };
		},
		staleTime: 10 * 60_000,
		retry: 1,
	});
}
