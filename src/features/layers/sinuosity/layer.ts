import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import {
	moveLayerAboveRideabilityHeatmap,
	overlayLayerBeforeId,
} from "#/features/map/layer-order";

import { SINUOSITY_DISPLAY_MIN } from "./config";
import type { SinuosityCollection } from "./types";

export const SINUOSITY_SOURCE_ID = "source-sinuosity";
export const SINUOSITY_LAYER_ID = "layer-sinuosity";

const EMPTY: SinuosityCollection = {
	type: "FeatureCollection",
	features: [],
};

/** Filtre carte : uniquement tronçons sinueux (pas de vert) */
const DISPLAY_FILTER: maplibregl.FilterSpecification = [
	">=",
	["get", "sinuosity"],
	SINUOSITY_DISPLAY_MIN,
];

export function ensureSinuosityLayer(map: MapLibreMap) {
	if (!map.getSource(SINUOSITY_SOURCE_ID)) {
		map.addSource(SINUOSITY_SOURCE_ID, {
			type: "geojson",
			data: EMPTY,
			buffer: 128,
		});
	}

	if (!map.getLayer(SINUOSITY_LAYER_ID)) {
		map.addLayer(
			{
				id: SINUOSITY_LAYER_ID,
				type: "line",
				source: SINUOSITY_SOURCE_ID,
				minzoom: 9,
				filter: DISPLAY_FILTER,
				paint: {
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						9,
						2,
						12,
						3.5,
						15,
						5,
					],
					"line-color": [
						"interpolate",
						["linear"],
						["get", "sinuosity"],
						SINUOSITY_DISPLAY_MIN,
						"#a78bfa",
						0.72,
						"#8b5cf6",
						0.88,
						"#6d28d9",
						1,
						"#4c1d95",
					],
					"line-opacity": 0.9,
				},
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
			},
			overlayLayerBeforeId(map),
		);
	}

	syncSinuosityLinePaint(map);
}

function syncSinuosityLinePaint(map: MapLibreMap) {
	if (!map.getLayer(SINUOSITY_LAYER_ID)) return;
	map.setPaintProperty(SINUOSITY_LAYER_ID, "line-color", [
		"interpolate",
		["linear"],
		["get", "sinuosity"],
		SINUOSITY_DISPLAY_MIN,
		"#a78bfa",
		0.72,
		"#8b5cf6",
		0.88,
		"#6d28d9",
		1,
		"#4c1d95",
	]);
}

export function applySinuosityToMap(
	map: MapLibreMap,
	data: SinuosityCollection,
) {
	const src = map.getSource(SINUOSITY_SOURCE_ID) as GeoJSONSource | undefined;
	if (!src) return;
	src.setData(data);
	moveLayerAboveRideabilityHeatmap(map, SINUOSITY_LAYER_ID);
}

export function setSinuosityVisibility(map: MapLibreMap, visible: boolean) {
	if (map.getLayer(SINUOSITY_LAYER_ID)) {
		map.setLayoutProperty(
			SINUOSITY_LAYER_ID,
			"visibility",
			visible ? "visible" : "none",
		);
	}
}
