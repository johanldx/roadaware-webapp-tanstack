import type { BasemapId } from "#/config/map";
import type { MapShareState } from "#/lib/share/map-share-payload";
import { basemapStore } from "#/stores/basemap-store";
import { layersStore } from "#/stores/layers-store";
import { mapStore } from "#/stores/map-store";
import { rideabilityStore } from "#/stores/rideability-store";

export function collectMapShareState(): MapShareState | null {
	const map = mapStore.state.map;
	if (!map) return null;

	const center = map.getCenter();
	return {
		lng: Math.round(center.lng * 1e4) / 1e4,
		lat: Math.round(center.lat * 1e4) / 1e4,
		zoom: Math.round(map.getZoom() * 10) / 10,
		at: rideabilityStore.state.selectedAt.toISOString(),
		layers: { ...layersStore.state.enabled },
		basemapId: basemapStore.state.basemapId as BasemapId,
	};
}
