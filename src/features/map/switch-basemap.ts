import type { Map as MapLibreMap } from "maplibre-gl";

import { type BasemapId, getBasemapStyle } from "#/config/map";
import { bumpStyleEpoch } from "#/stores/map-store";

/** Change le fond de carte en conservant la vue et en ré-appliquant les calques. */
export function switchBasemapStyle(map: MapLibreMap, basemapId: BasemapId) {
	const center = map.getCenter();
	const zoom = map.getZoom();
	const bearing = map.getBearing();
	const pitch = map.getPitch();

	const onStyleLoad = () => {
		map.jumpTo({ center, zoom, bearing, pitch });
		bumpStyleEpoch();
	};

	map.once("style.load", onStyleLoad);
	map.setStyle(getBasemapStyle(basemapId));
}
