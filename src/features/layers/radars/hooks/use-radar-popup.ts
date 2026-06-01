import maplibregl from "maplibre-gl";
import { useEffect } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";

import { RADARS_HIT_LAYER_ID } from "../layer";
import { buildRadarPopupElement } from "../radar-popup";
import type { RadarProperties } from "../types";

export function useRadarPopup() {
	const map = useMapStore((s) => s.map);
	const enabled = useLayersStore((s) => s.enabled.radars);

	useEffect(() => {
		if (!map || !enabled) return;

		const popup = new maplibregl.Popup({
			closeButton: true,
			closeOnClick: false,
			maxWidth: "280px",
			className: "radar-popup-container",
			offset: 12,
		});

		const mount = document.createElement("div");
		popup.setDOMContent(mount);

		const show = (lngLat: maplibregl.LngLatLike, props: RadarProperties) => {
			mount.replaceChildren(buildRadarPopupElement(props));
			popup.setLngLat(lngLat);
			if (!popup.isOpen()) popup.addTo(map);
		};

		const onEnter = (e: maplibregl.MapLayerMouseEvent) => {
			const f = e.features?.[0];
			if (!f?.geometry || f.geometry.type !== "Point") return;
			map.getCanvas().style.cursor = "pointer";
			const props = f.properties as unknown as RadarProperties;
			show(f.geometry.coordinates as [number, number], props);
		};

		const onLeave = () => {
			map.getCanvas().style.cursor = "";
			popup.remove();
		};

		const onClick = (e: maplibregl.MapLayerMouseEvent) => {
			const f = e.features?.[0];
			if (!f?.geometry || f.geometry.type !== "Point") return;
			const props = f.properties as unknown as RadarProperties;
			show(f.geometry.coordinates as [number, number], props);
		};

		map.on("mouseenter", RADARS_HIT_LAYER_ID, onEnter);
		map.on("mouseleave", RADARS_HIT_LAYER_ID, onLeave);
		map.on("click", RADARS_HIT_LAYER_ID, onClick);

		return () => {
			map.off("mouseenter", RADARS_HIT_LAYER_ID, onEnter);
			map.off("mouseleave", RADARS_HIT_LAYER_ID, onLeave);
			map.off("click", RADARS_HIT_LAYER_ID, onClick);
			popup.remove();
			map.getCanvas().style.cursor = "";
		};
	}, [map, enabled]);
}
