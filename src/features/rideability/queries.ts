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

const FORECAST_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const out = new Array<R>(items.length);
	let cursor = 0;

	const worker = async () => {
		while (true) {
			const idx = cursor;
			cursor += 1;
			if (idx >= items.length) return;
			const item = items[idx];
			if (item === undefined) return;
			out[idx] = await mapper(item, idx);
		}
	};

	const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
		worker(),
	);
	await Promise.all(workers);
	return out;
}

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
			const samples = await mapWithConcurrency(
				IDF_SAMPLE_CELLS,
				FORECAST_CONCURRENCY,
				async (cell): Promise<ScoreSampleDetail> => {
					const result = await fetchPointRideability(
						cell.lat,
						cell.lng,
						selectedAt,
					);
					return {
						lat: cell.lat,
						lng: cell.lng,
						score: result.score,
						result,
					};
				},
			);

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
