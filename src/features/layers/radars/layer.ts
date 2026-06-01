import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { RadarCollection } from "./types";

export const RADARS_SOURCE_ID = "source-radars";
export const RADARS_HALO_LAYER_ID = "layer-radars-halo";
export const RADARS_POINT_LAYER_ID = "layer-radars-point";
export const RADARS_HIT_LAYER_ID = "layer-radars-hit";

const RADARS_LAYERS = [
	RADARS_HALO_LAYER_ID,
	RADARS_POINT_LAYER_ID,
	RADARS_HIT_LAYER_ID,
] as const;

const EMPTY: RadarCollection = { type: "FeatureCollection", features: [] };

export function ensureRadarsLayers(map: MapLibreMap) {
	if (!map.getSource(RADARS_SOURCE_ID)) {
		map.addSource(RADARS_SOURCE_ID, {
			type: "geojson",
			data: EMPTY,
			generateId: true,
		});
	}

	if (!map.getLayer(RADARS_HALO_LAYER_ID)) {
		map.addLayer({
			id: RADARS_HALO_LAYER_ID,
			type: "circle",
			source: RADARS_SOURCE_ID,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					8,
					10,
					11,
					16,
					14,
					22,
				],
				"circle-color": "#ff3b30",
				"circle-opacity": 0.12,
				"circle-stroke-width": 0,
			},
		});
	}

	if (!map.getLayer(RADARS_POINT_LAYER_ID)) {
		map.addLayer({
			id: RADARS_POINT_LAYER_ID,
			type: "circle",
			source: RADARS_SOURCE_ID,
			minzoom: 7,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					8,
					4,
					11,
					5.5,
					14,
					7,
				],
				"circle-color": "#ff3b30",
				"circle-opacity": 0.95,
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});
	}

	if (!map.getLayer(RADARS_HIT_LAYER_ID)) {
		map.addLayer({
			id: RADARS_HIT_LAYER_ID,
			type: "circle",
			source: RADARS_SOURCE_ID,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					8,
					14,
					11,
					18,
					14,
					24,
				],
				"circle-opacity": 0,
			},
		});
	}
}

export function applyRadarsToMap(map: MapLibreMap, data: RadarCollection) {
	const src = map.getSource(RADARS_SOURCE_ID) as GeoJSONSource | undefined;
	if (!src) return;
	src.setData(data);
}

export function setRadarsVisibility(map: MapLibreMap, visible: boolean) {
	const v = visible ? "visible" : "none";
	for (const id of RADARS_LAYERS) {
		if (map.getLayer(id)) {
			map.setLayoutProperty(id, "visibility", v);
		}
	}
}
