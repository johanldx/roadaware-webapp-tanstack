import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "#/lib/query/keys";

import { SINUOSITY_GEOJSON_URL } from "./config";
import type { SinuosityCollection } from "./types";

async function fetchSinuosityGeoJson(): Promise<SinuosityCollection> {
	const res = await fetch(SINUOSITY_GEOJSON_URL);
	if (!res.ok) throw new Error(`Sinuosité: HTTP ${res.status}`);
	return res.json() as Promise<SinuosityCollection>;
}

export function sinuosityGeoJsonQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.staticLayer.sinuosity("idf"),
		queryFn: fetchSinuosityGeoJson,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}
