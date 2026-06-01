import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import {
	moveLayerAboveRideabilityHeatmap,
	overlayLayerBeforeId,
} from "#/features/map/layer-order";

import { RISK_DISPLAY_MIN_SCORE } from "./config";
import type { RiskCollection } from "./types";

export const RISK_SOURCE_ID = "source-risk";
export const RISK_LINE_LAYER_ID = "layer-risk-line";
export const RISK_HIT_LAYER_ID = "layer-risk-hit";

const RISK_LAYERS = [RISK_LINE_LAYER_ID, RISK_HIT_LAYER_ID] as const;

const EMPTY: RiskCollection = { type: "FeatureCollection", features: [] };

const DISPLAY_FILTER: maplibregl.FilterSpecification = [
	"all",
	[">=", ["get", "riskScore"], RISK_DISPLAY_MIN_SCORE],
	[">=", ["get", "percentile"], 0.72],
];

/** Rouge / bordeaux — distinct du violet sinuosité */
const LINE_COLOR: maplibregl.ExpressionSpecification = [
	"interpolate",
	["linear"],
	["get", "riskScore"],
	0.4,
	"#fb7185",
	0.7,
	"#e11d48",
	1,
	"#881337",
];

const RISK_LINE_PAINT = {
	"line-width": ["interpolate", ["linear"], ["zoom"], 9, 3, 13, 5, 15, 7],
	"line-color": LINE_COLOR,
	"line-opacity": 0.92,
	"line-dasharray": [4, 2.5] as [number, number],
} satisfies maplibregl.LineLayerSpecification["paint"];

export function ensureRiskLayers(map: MapLibreMap) {
	if (!map.getSource(RISK_SOURCE_ID)) {
		map.addSource(RISK_SOURCE_ID, {
			type: "geojson",
			data: EMPTY,
			generateId: true,
			buffer: 128,
		});
	}

	const beforeId = overlayLayerBeforeId(map);

	if (!map.getLayer(RISK_LINE_LAYER_ID)) {
		map.addLayer(
			{
				id: RISK_LINE_LAYER_ID,
				type: "line",
				source: RISK_SOURCE_ID,
				minzoom: 9,
				filter: DISPLAY_FILTER,
				paint: RISK_LINE_PAINT,
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
			},
			beforeId,
		);

		map.addLayer(
			{
				id: RISK_HIT_LAYER_ID,
				type: "line",
				source: RISK_SOURCE_ID,
				minzoom: 9,
				filter: DISPLAY_FILTER,
				paint: {
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						9,
						12,
						13,
						16,
						15,
						20,
					],
					"line-opacity": 0,
				},
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
			},
			beforeId,
		);
	}

	syncRiskLinePaint(map);
}

function syncRiskLinePaint(map: MapLibreMap) {
	if (!map.getLayer(RISK_LINE_LAYER_ID)) return;
	for (const [key, value] of Object.entries(RISK_LINE_PAINT)) {
		map.setPaintProperty(RISK_LINE_LAYER_ID, key, value);
	}
}

export function applyRiskToMap(map: MapLibreMap, data: RiskCollection) {
	const src = map.getSource(RISK_SOURCE_ID) as GeoJSONSource | undefined;
	if (!src) return;
	src.setData(data);
	moveLayerAboveRideabilityHeatmap(map, RISK_LINE_LAYER_ID);
	moveLayerAboveRideabilityHeatmap(map, RISK_HIT_LAYER_ID);
}

export function setRiskVisibility(map: MapLibreMap, visible: boolean) {
	const v = visible ? "visible" : "none";
	for (const id of RISK_LAYERS) {
		if (map.getLayer(id)) {
			map.setLayoutProperty(id, "visibility", v);
		}
	}
}
