import { Store } from "@tanstack/store";

import { type BasemapId, DEFAULT_BASEMAP_ID } from "#/config/map";

const STORAGE_KEY = "roadaware-basemap";

function readStoredBasemap(): BasemapId {
	if (typeof localStorage === "undefined") return DEFAULT_BASEMAP_ID;
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		if (value === "carto-voyager" || value === "satellite") return value;
	} catch {
		// localStorage indisponible (mode privé, etc.)
	}
	return DEFAULT_BASEMAP_ID;
}

export interface BasemapState {
	basemapId: BasemapId;
}

export const basemapStore = new Store<BasemapState>({
	basemapId: readStoredBasemap(),
});

export function setBasemapId(id: BasemapId) {
	basemapStore.setState({ basemapId: id });
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, id);
	} catch {
		// ignore
	}
}

export function toggleBasemapId() {
	const next: BasemapId =
		basemapStore.state.basemapId === "satellite"
			? "carto-voyager"
			: "satellite";
	setBasemapId(next);
}
