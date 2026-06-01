import type { LngLatLike } from "maplibre-gl";

import { IDF_CENTER, IDF_DEFAULT_ZOOM } from "#/config/region";

export const DEFAULT_CENTER: LngLatLike = IDF_CENTER;
export const DEFAULT_ZOOM = IDF_DEFAULT_ZOOM;
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 18;

export const LAYER_ZOOM_GATES = {
	sinuosity: 10,
	risk: 9,
	radars: 7,
} as const;

/** Carto Voyager — routes et villes visibles */
export const BASEMAP_STYLE = {
	version: 8 as const,
	name: "voyager",
	glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
	sources: {
		carto: {
			type: "raster" as const,
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
			type: "raster" as const,
			source: "carto",
			minzoom: 0,
			maxzoom: 22,
		},
	],
};
