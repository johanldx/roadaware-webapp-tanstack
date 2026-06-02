import type {
	GeoJSONSource,
	ImageSource,
	Map as MapLibreMap,
} from "maplibre-gl";

import {
	IDF_BOUNDARY_GEOJSON,
	idfImageCoordinates,
} from "#/config/idf-boundary";

import type { ScoreSample } from "./interpolate";
import { renderSmoothFieldImage } from "./smooth-field";
import {
	aggregatedZonesGeoJson,
	blockSizeForZoom,
	normalizeDisplayScores,
} from "./zone-aggregation";

export const RIDEABILITY_IMAGE_SOURCE = "source-rideability-image";
export const RIDEABILITY_IMAGE_LAYER = "layer-rideability-image";
export const RIDEABILITY_BOUNDARY_SOURCE = "source-idf-boundary";
const LEGACY_BOUNDARY_LAYERS = [
	"layer-idf-boundary",
	"layer-idf-boundary-glow",
	"layer-idf-boundary-halo",
] as const;

const RIDEABILITY_BOUNDARY_LINE_LAYER = "layer-idf-boundary-line";
export const RIDEABILITY_ZONES_SOURCE = "source-rideability-zones";
export const RIDEABILITY_BADGE_BG_LAYER = "layer-rideability-badge-bg";
export const RIDEABILITY_BADGE_TEXT_LAYER = "layer-rideability-badge-text";
export const RIDEABILITY_ZONES_HIT_LAYER = "layer-rideability-zones-hit";

/** Ancien id — évite les calques fantômes après mise à jour */
const LEGACY_LABELS_LAYER = "layer-rideability-zones-labels";

const RIDEABILITY_LAYERS = [
	RIDEABILITY_IMAGE_LAYER,
	RIDEABILITY_BADGE_BG_LAYER,
	RIDEABILITY_BADGE_TEXT_LAYER,
	RIDEABILITY_ZONES_HIT_LAYER,
] as const;

function removeLegacyBoundaryLayers(map: MapLibreMap) {
	for (const id of LEGACY_BOUNDARY_LAYERS) {
		if (map.getLayer(id)) map.removeLayer(id);
	}
	if (map.getLayer(RIDEABILITY_BOUNDARY_LINE_LAYER)) {
		map.removeLayer(RIDEABILITY_BOUNDARY_LINE_LAYER);
	}
}

const SCORE_CIRCLE_COLOR: maplibregl.ExpressionSpecification = [
	"interpolate",
	["linear"],
	["get", "score"],
	0,
	"#ff6961",
	30,
	"#ff9f0a",
	45,
	"#e5a800",
	60,
	"#63c77b",
	75,
	"#34c759",
	100,
	"#30b350",
];

const BADGE_RADIUS: maplibregl.ExpressionSpecification = [
	"interpolate",
	["linear"],
	["zoom"],
	7,
	["+", 7, ["*", ["get", "blockSize"], 0.65]],
	10,
	["+", 9, ["*", ["get", "blockSize"], 0.8]],
	13,
	["+", 11, ["*", ["get", "blockSize"], 0.95]],
];

const EMPTY_ZONES: GeoJSON.FeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

/** 1×1 PNG transparent — évite un flash coloré pendant le chargement. */
const TRANSPARENT_PIXEL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

let applyGeneration = 0;

export function ensureRideabilityLayers(map: MapLibreMap) {
	if (map.getLayer(LEGACY_LABELS_LAYER)) {
		map.removeLayer(LEGACY_LABELS_LAYER);
	}

	if (!map.getSource(RIDEABILITY_BOUNDARY_SOURCE)) {
		map.addSource(RIDEABILITY_BOUNDARY_SOURCE, {
			type: "geojson",
			data: IDF_BOUNDARY_GEOJSON,
		});
	}

	const imageCoords = idfImageCoordinates();

	if (!map.getSource(RIDEABILITY_IMAGE_SOURCE)) {
		map.addSource(RIDEABILITY_IMAGE_SOURCE, {
			type: "image",
			url: TRANSPARENT_PIXEL,
			coordinates: imageCoords,
		});
	} else {
		const img = map.getSource(RIDEABILITY_IMAGE_SOURCE) as ImageSource;
		img.setCoordinates(imageCoords);
	}

	removeLegacyBoundaryLayers(map);

	if (!map.getLayer(RIDEABILITY_IMAGE_LAYER)) {
		map.addLayer({
			id: RIDEABILITY_IMAGE_LAYER,
			type: "raster",
			source: RIDEABILITY_IMAGE_SOURCE,
			paint: {
				"raster-opacity": 0.78,
				"raster-fade-duration": 0,
			},
		});
	}

	if (!map.getSource(RIDEABILITY_ZONES_SOURCE)) {
		map.addSource(RIDEABILITY_ZONES_SOURCE, {
			type: "geojson",
			data: EMPTY_ZONES,
			generateId: true,
		});
	}

	if (!map.getLayer(RIDEABILITY_BADGE_BG_LAYER)) {
		map.addLayer({
			id: RIDEABILITY_BADGE_BG_LAYER,
			type: "circle",
			source: RIDEABILITY_ZONES_SOURCE,
			paint: {
				"circle-radius": BADGE_RADIUS,
				"circle-color": SCORE_CIRCLE_COLOR,
				"circle-opacity": 0.94,
				"circle-stroke-width": 1.5,
				"circle-stroke-color": "rgba(255,255,255,0.92)",
				"circle-blur": 0.05,
			},
		});
	}

	if (!map.getLayer(RIDEABILITY_BADGE_TEXT_LAYER)) {
		map.addLayer({
			id: RIDEABILITY_BADGE_TEXT_LAYER,
			type: "symbol",
			source: RIDEABILITY_ZONES_SOURCE,
			layout: {
				"text-field": ["to-string", ["get", "score"]],
				"text-size": [
					"interpolate",
					["linear"],
					["zoom"],
					7,
					9,
					10,
					10,
					13,
					12,
				],
				"text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
				"text-allow-overlap": true,
				"text-ignore-placement": true,
			},
			paint: {
				"text-color": "#ffffff",
			},
		});
	}

	if (!map.getLayer(RIDEABILITY_ZONES_HIT_LAYER)) {
		map.addLayer({
			id: RIDEABILITY_ZONES_HIT_LAYER,
			type: "circle",
			source: RIDEABILITY_ZONES_SOURCE,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					7,
					["+", 12, ["*", ["get", "blockSize"], 1.2]],
					10,
					["+", 14, ["*", ["get", "blockSize"], 1.4]],
					13,
					["+", 17, ["*", ["get", "blockSize"], 1.6]],
				],
				"circle-opacity": 0,
			},
		});
	}

	setRideabilityVisibility(map, false);
}

export function updateZoneMarkers(
	map: MapLibreMap,
	displayScores: Map<string, number>,
) {
	const src = map.getSource(RIDEABILITY_ZONES_SOURCE) as
		| GeoJSONSource
		| undefined;
	if (!src) return;

	const normalized = normalizeDisplayScores(displayScores);
	const blockSize = blockSizeForZoom(map.getZoom());
	src.setData(aggregatedZonesGeoJson(normalized, blockSize));
}

export function applyRideabilityToMap(
	map: MapLibreMap,
	samples: ScoreSample[],
	displayScores: Map<string, number>,
	visible: boolean,
) {
	if (!visible || samples.length === 0) {
		setRideabilityVisibility(map, false);
		return;
	}

	ensureRideabilityLayers(map);
	setRideabilityVisibility(map, false);

	const generation = ++applyGeneration;
	const { url, coordinates } = renderSmoothFieldImage(samples);

	const imgSrc = map.getSource(RIDEABILITY_IMAGE_SOURCE) as
		| ImageSource
		| undefined;
	if (!imgSrc) return;

	let revealed = false;
	const reveal = () => {
		if (revealed || generation !== applyGeneration) return;
		revealed = true;
		imgSrc.off("data", onSourceData);
		updateZoneMarkers(map, displayScores);
		setRideabilityVisibility(map, true);
	};

	const onSourceData = (e: { sourceDataType?: string }) => {
		const ready =
			e.sourceDataType === "idle" ||
			e.sourceDataType === "content" ||
			e.sourceDataType === "metadata";
		if (!ready || !imgSrc.loaded()) return;
		reveal();
	};

	imgSrc.on("data", onSourceData);
	imgSrc.setCoordinates(coordinates);
	imgSrc.updateImage({ url, coordinates });

	const waitForImage = (attempt = 0) => {
		if (revealed || generation !== applyGeneration) return;
		if (imgSrc.loaded()) {
			reveal();
			return;
		}
		if (attempt < 120) {
			requestAnimationFrame(() => waitForImage(attempt + 1));
			return;
		}
		reveal();
	};
	requestAnimationFrame(() => waitForImage());
}

export function setRideabilityVisibility(map: MapLibreMap, visible: boolean) {
	const v = visible ? "visible" : "none";
	for (const id of RIDEABILITY_LAYERS) {
		if (map.getLayer(id)) {
			map.setLayoutProperty(id, "visibility", v);
		}
	}
}
