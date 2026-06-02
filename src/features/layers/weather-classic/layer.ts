import type { FeatureCollection, Point } from "geojson";
import type {
	GeoJSONSource,
	ImageSource,
	Map as MapLibreMap,
} from "maplibre-gl";

import { idfImageCoordinates } from "#/config/idf-boundary";
import { moveLayerAboveRideabilityHeatmap } from "#/features/map/layer-order";
import type { ScoreSample } from "#/features/rideability/interpolate";
import { renderSmoothFieldImage } from "#/features/rideability/smooth-field";

export type ClassicWeatherKind = "rain" | "wind" | "sun" | "night";

export interface ClassicWeatherProps {
	kind: ClassicWeatherKind;
	icon: string;
	weatherScore: number;
}

export type ClassicWeatherCollection = FeatureCollection<
	Point,
	ClassicWeatherProps
>;

export const WEATHER_CLASSIC_IMAGE_SOURCE_ID = "source-weather-classic-image";
export const WEATHER_CLASSIC_SOURCE_ID = "source-weather-classic-icons";
export const WEATHER_CLASSIC_FILL_LAYER_ID = "layer-weather-classic-raster";
export const WEATHER_CLASSIC_ICON_LAYER_ID = "layer-weather-classic-icon";
export const WEATHER_CLASSIC_TEXT_LAYER_ID = "layer-weather-classic-text";

const WEATHER_CLASSIC_LAYERS = [
	WEATHER_CLASSIC_FILL_LAYER_ID,
	WEATHER_CLASSIC_ICON_LAYER_ID,
	WEATHER_CLASSIC_TEXT_LAYER_ID,
] as const;

const EMPTY: ClassicWeatherCollection = {
	type: "FeatureCollection",
	features: [],
};
const TRANSPARENT_PIXEL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function ensureWeatherClassicLayers(map: MapLibreMap) {
	if (!map.getSource(WEATHER_CLASSIC_IMAGE_SOURCE_ID)) {
		map.addSource(WEATHER_CLASSIC_IMAGE_SOURCE_ID, {
			type: "image",
			url: TRANSPARENT_PIXEL,
			coordinates: idfImageCoordinates(),
		});
	}

	if (!map.getSource(WEATHER_CLASSIC_SOURCE_ID)) {
		map.addSource(WEATHER_CLASSIC_SOURCE_ID, {
			type: "geojson",
			data: EMPTY,
			generateId: true,
		});
	}

	if (!map.getLayer(WEATHER_CLASSIC_FILL_LAYER_ID)) {
		map.addLayer({
			id: WEATHER_CLASSIC_FILL_LAYER_ID,
			type: "raster",
			source: WEATHER_CLASSIC_IMAGE_SOURCE_ID,
			paint: {
				"raster-opacity": 0.84,
				"raster-fade-duration": 0,
			},
		});
		moveLayerAboveRideabilityHeatmap(map, WEATHER_CLASSIC_FILL_LAYER_ID);
	}

	if (!map.getLayer(WEATHER_CLASSIC_ICON_LAYER_ID)) {
		map.addLayer({
			id: WEATHER_CLASSIC_ICON_LAYER_ID,
			type: "symbol",
			source: WEATHER_CLASSIC_SOURCE_ID,
			filter: ["==", ["geometry-type"], "Point"],
			layout: {
				"text-field": ["get", "icon"],
				"text-font": ["Arial Unicode MS Regular"],
				"text-size": [
					"interpolate",
					["linear"],
					["zoom"],
					7,
					13,
					11,
					16,
					14,
					18,
				],
				"text-allow-overlap": true,
				"text-ignore-placement": true,
			},
			paint: {
				"text-color": "#1f2f26",
				"text-halo-color": "rgba(255,255,255,0.95)",
				"text-halo-width": 1.5,
			},
		});
		moveLayerAboveRideabilityHeatmap(map, WEATHER_CLASSIC_ICON_LAYER_ID);
	}

	if (!map.getLayer(WEATHER_CLASSIC_TEXT_LAYER_ID)) {
		map.addLayer({
			id: WEATHER_CLASSIC_TEXT_LAYER_ID,
			type: "symbol",
			source: WEATHER_CLASSIC_SOURCE_ID,
			filter: ["==", ["geometry-type"], "Point"],
			minzoom: 9,
			layout: {
				"text-field": [
					"match",
					["get", "kind"],
					"rain",
					"Pluie",
					"wind",
					"Vent",
					"sun",
					"Soleil",
					"Nuit",
				],
				"text-font": ["Open Sans Semibold", "Arial Unicode MS Regular"],
				"text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 13, 11],
				"text-offset": [0, 1.2],
				"text-allow-overlap": true,
				"text-ignore-placement": true,
			},
			paint: {
				"text-color": "#2f4234",
				"text-halo-color": "rgba(255,255,255,0.9)",
				"text-halo-width": 1.2,
			},
		});
		moveLayerAboveRideabilityHeatmap(map, WEATHER_CLASSIC_TEXT_LAYER_ID);
	}
}

export function applyWeatherClassicToMap(
	map: MapLibreMap,
	data: ClassicWeatherCollection,
) {
	const src = map.getSource(WEATHER_CLASSIC_SOURCE_ID) as
		| GeoJSONSource
		| undefined;
	if (!src) return;
	src.setData(data);
}

export function applyWeatherClassicRasterToMap(
	map: MapLibreMap,
	samples: ScoreSample[],
) {
	const src = map.getSource(WEATHER_CLASSIC_IMAGE_SOURCE_ID) as
		| ImageSource
		| undefined;
	if (!src) return;

	const { url, coordinates } = renderSmoothFieldImage(samples);
	src.setCoordinates(coordinates);
	src.updateImage({ url, coordinates });
}

export function setWeatherClassicVisibility(
	map: MapLibreMap,
	visible: boolean,
) {
	const visibility = visible ? "visible" : "none";
	for (const id of WEATHER_CLASSIC_LAYERS) {
		if (map.getLayer(id)) {
			map.setLayoutProperty(id, "visibility", visibility);
		}
	}
}
