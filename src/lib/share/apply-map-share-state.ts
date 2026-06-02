import type { Map as MapLibreMap } from "maplibre-gl";

import { switchBasemapStyle } from "#/features/map/switch-basemap";
import type { MapShareState } from "#/lib/share/map-share-payload";
import { basemapStore, setBasemapId } from "#/stores/basemap-store";
import { setLayersEnabled } from "#/stores/layers-store";
import { setMapViewport } from "#/stores/map-store";
import { rideabilityStore, setSelectedAtIso } from "#/stores/rideability-store";

export function applyMapShareState(
	map: MapLibreMap | null,
	state: MapShareState,
) {
	setLayersEnabled(state.layers);

	if (state.at) {
		const next = new Date(state.at).getTime();
		const current = rideabilityStore.state.selectedAt.getTime();
		if (next !== current) setSelectedAtIso(state.at);
	}

	const currentBasemap = basemapStore.state.basemapId;
	if (currentBasemap !== state.basemapId) {
		setBasemapId(state.basemapId);
		if (map) switchBasemapStyle(map, state.basemapId);
	}

	if (map) {
		map.jumpTo({
			center: [state.lng, state.lat],
			zoom: state.zoom,
			duration: 0,
		});
	}

	setMapViewport({
		center: [state.lng, state.lat],
		zoom: state.zoom,
		bounds: null,
	});
}
