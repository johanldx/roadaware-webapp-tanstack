import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "#/lib/query/keys";

import { RISK_GEOJSON_URL } from "./config";
import type { RiskCollection } from "./types";

async function fetchRiskGeoJson(): Promise<RiskCollection> {
	const res = await fetch(RISK_GEOJSON_URL);
	if (!res.ok) throw new Error(`Risque: HTTP ${res.status}`);
	return res.json() as Promise<RiskCollection>;
}

export function riskGeoJsonQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.staticLayer.risk("idf"),
		queryFn: fetchRiskGeoJson,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}
