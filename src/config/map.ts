import type { LngLatLike, StyleSpecification } from "maplibre-gl";

import { IDF_CENTER, IDF_DEFAULT_ZOOM } from "#/config/region";

export const DEFAULT_CENTER: LngLatLike = IDF_CENTER;
export const DEFAULT_ZOOM = IDF_DEFAULT_ZOOM;
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 18;

export const LAYER_ZOOM_GATES = {
	sinuosity: 10,
	relief: 10,
	risk: 9,
	radars: 7,
} as const;

/**
 * Fonds disponibles (style MapLibre).
 *
 * - `carto-voyager` — coloré, routes et parcs lisibles (défaut)
 * - `satellite` — imagerie Esri + labels (villes, routes, sans clé API)
 * - `liberty` / `bright` — vectoriel OpenFreeMap
 * - `positron` — très gris, peu adapté ici
 */
export type BasemapId = "carto-voyager" | "satellite";

export const DEFAULT_BASEMAP_ID: BasemapId = "carto-voyager";

export const BASEMAP_LABELS: Record<
	BasemapId,
	{ label: string; switchTo: string }
> = {
	"carto-voyager": {
		label: "Plan",
		switchTo: "Vue satellite",
	},
	satellite: {
		label: "Satellite",
		switchTo: "Vue plan",
	},
};

export const BASEMAP_PRESETS = {
	"carto-voyager": {
		version: 8,
		name: "voyager",
		glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
		sources: {
			carto: {
				type: "raster",
				tiles: [
					"https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
				],
				tileSize: 256,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
			},
		},
		layers: [
			{
				id: "carto-raster",
				type: "raster",
				source: "carto",
				minzoom: 0,
				maxzoom: 22,
			},
		],
	},
	satellite: {
		version: 8,
		name: "satellite",
		glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
		sources: {
			esri: {
				type: "raster",
				tiles: [
					"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
				],
				tileSize: 256,
				maxzoom: 19,
				attribution:
					"Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
			},
			/** Routes discrètes (sans labels ni frontières administratives). */
			"carto-roads": {
				type: "raster",
				tiles: [
					"https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png",
				],
				tileSize: 256,
				maxzoom: 20,
			},
			/** Labels clairs lisibles sur fond sombre (villes, axes). */
			"carto-labels": {
				type: "raster",
				tiles: [
					"https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png",
				],
				tileSize: 256,
				maxzoom: 20,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
			},
		},
		layers: [
			{
				id: "esri-satellite",
				type: "raster",
				source: "esri",
				minzoom: 0,
				maxzoom: 22,
			},
			{
				id: "carto-roads",
				type: "raster",
				source: "carto-roads",
				minzoom: 0,
				maxzoom: 22,
				paint: {
					"raster-opacity": 0.32,
				},
			},
			{
				id: "carto-labels",
				type: "raster",
				source: "carto-labels",
				minzoom: 0,
				maxzoom: 22,
				paint: {
					"raster-opacity": 0.92,
				},
			},
		],
	},
	liberty: "https://tiles.openfreemap.org/styles/liberty",
	bright: "https://tiles.openfreemap.org/styles/bright",
	positron: "https://tiles.openfreemap.org/styles/positron",
} as const satisfies Record<string, string | StyleSpecification>;

export function getBasemapStyle(id: BasemapId): string | StyleSpecification {
	return BASEMAP_PRESETS[id];
}

/** Fond coloré — CARTO Voyager (raster, sans clé API) */
export const BASEMAP_STYLE: string | StyleSpecification =
	getBasemapStyle(DEFAULT_BASEMAP_ID);
