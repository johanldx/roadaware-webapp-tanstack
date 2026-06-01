import type { Map as MapLibreMap } from "maplibre-gl";

/** Insère au-dessus de la heatmap roulabilité, sous les pastilles / radars. */
export function overlayLayerBeforeId(map: MapLibreMap): string | undefined {
	return (
		map.getLayer("layer-rideability-badge-bg")?.id ??
		map.getLayer("layer-radars-halo")?.id ??
		undefined
	);
}

export function moveLayerAboveRideabilityHeatmap(
	map: MapLibreMap,
	layerId: string,
) {
	const beforeId = overlayLayerBeforeId(map);
	if (!beforeId || !map.getLayer(layerId)) return;
	map.moveLayer(layerId, beforeId);
}
