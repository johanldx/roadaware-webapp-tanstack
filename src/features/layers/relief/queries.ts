import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "#/lib/query/keys";

import { RELIEF_GEOJSON_URL } from "./config";
import type { ReliefCollection } from "./types";

async function fetchReliefGeoJson(): Promise<ReliefCollection> {
	const res = await fetch(RELIEF_GEOJSON_URL);
	if (!res.ok) throw new Error(`Relief: HTTP ${res.status}`);
	return res.json() as Promise<ReliefCollection>;
}

export function reliefGeoJsonQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.staticLayer.relief("idf"),
		queryFn: fetchReliefGeoJson,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}
