import { Store } from "@tanstack/store";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { ViewportBounds } from "#/types/geo";

export interface MapState {
	map: MapLibreMap | null;
	zoom: number;
	center: [number, number];
	bounds: ViewportBounds | null;
	isReady: boolean;
	/** Incrémenté à chaque nouvelle instance carte (ré-applique les calques). */
	mapEpoch: number;
}

const initialState: MapState = {
	map: null,
	zoom: 6,
	center: [2.3522, 46.6034],
	bounds: null,
	isReady: false,
	mapEpoch: 0,
};

export const mapStore = new Store<MapState>(initialState);

export function setMapInstance(map: MapLibreMap | null) {
	mapStore.setState((s) => ({
		...s,
		map,
		isReady: map !== null,
		mapEpoch: map ? s.mapEpoch + 1 : s.mapEpoch,
	}));
}

export function setMapViewport(
	patch: Partial<Pick<MapState, "zoom" | "center" | "bounds">>,
) {
	mapStore.setState((s) => ({ ...s, ...patch }));
}
