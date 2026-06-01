import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "#/lib/query/keys";

import { RADARS_GEOJSON_URL } from "./config";
import type { RadarCollection } from "./types";

async function fetchRadarsGeoJson(): Promise<RadarCollection> {
	const res = await fetch(RADARS_GEOJSON_URL);
	if (!res.ok) throw new Error(`Radars: HTTP ${res.status}`);
	return res.json() as Promise<RadarCollection>;
}

export function radarsGeoJsonQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.staticLayer.radars("idf"),
		queryFn: fetchRadarsGeoJson,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}
