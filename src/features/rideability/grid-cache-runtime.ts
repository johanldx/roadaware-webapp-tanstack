import type { RideabilityGridCache } from "./grid-cache";

/** Cache grille lu par les handlers carte (hors cycle React). */
let runtimeCache: RideabilityGridCache | null = null;

export function setRuntimeGridCache(cache: RideabilityGridCache | null) {
	runtimeCache = cache;
}

export function getRuntimeGridCache(): RideabilityGridCache | null {
	return runtimeCache;
}
