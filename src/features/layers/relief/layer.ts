import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import {
	moveLayerAboveRideabilityHeatmap,
	overlayLayerBeforeId,
} from "#/features/map/layer-order";

import { RELIEF_DISPLAY_MIN } from "./config";
import type { ReliefCollection } from "./types";

export const RELIEF_SOURCE_ID = "source-relief";
export const RELIEF_LAYER_ID = "layer-relief";

const EMPTY: ReliefCollection = {
	type: "FeatureCollection",
	features: [],
};

const DISPLAY_FILTER: maplibregl.FilterSpecification = [
	">=",
	["get", "relief"],
	RELIEF_DISPLAY_MIN,
];

export function ensureReliefLayer(map: MapLibreMap) {
	if (!map.getSource(RELIEF_SOURCE_ID)) {
		map.addSource(RELIEF_SOURCE_ID, {
			type: "geojson",
			data: EMPTY,
			buffer: 128,
		});
	}

	if (!map.getLayer(RELIEF_LAYER_ID)) {
		map.addLayer(
			{
				id: RELIEF_LAYER_ID,
				type: "line",
				source: RELIEF_SOURCE_ID,
				minzoom: 9,
				filter: DISPLAY_FILTER,
				paint: {
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						9,
						1.8,
						12,
						3,
						15,
						4,
					],
					"line-color": [
						"interpolate",
						["linear"],
						["get", "relief"],
						RELIEF_DISPLAY_MIN,
						"#9ca3af",
						0.62,
						"#6b7280",
						0.82,
						"#374151",
						1,
						"#111827",
					],
					"line-opacity": 0.72,
					"line-blur": 0.2,
				},
				layout: {
					"line-cap": "round",
					"line-join": "round",
					"line-sort-key": ["get", "relief"],
				},
			},
			overlayLayerBeforeId(map),
		);
	}
}

export function applyReliefToMap(map: MapLibreMap, data: ReliefCollection) {
	const src = map.getSource(RELIEF_SOURCE_ID) as GeoJSONSource | undefined;
	if (!src) return;
	src.setData(data);
	moveLayerAboveRideabilityHeatmap(map, RELIEF_LAYER_ID);
}

export function setReliefVisibility(map: MapLibreMap, visible: boolean) {
	if (map.getLayer(RELIEF_LAYER_ID)) {
		map.setLayoutProperty(
			RELIEF_LAYER_ID,
			"visibility",
			visible ? "visible" : "none",
		);
	}
}
