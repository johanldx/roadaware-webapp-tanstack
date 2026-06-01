import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import { BASEMAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from "#/config/map";
import { useRadarPopup, useRadarsMapLayer } from "#/features/layers/radars";
import { ensureRadarsLayers } from "#/features/layers/radars/layer";
import { useRiskMapLayer, useRiskPopup } from "#/features/layers/risk";
import { ensureRiskLayers } from "#/features/layers/risk/layer";
import { useSinuosityMapLayer } from "#/features/layers/sinuosity";
import { useMapZonePopup } from "#/features/rideability/hooks/use-map-zone-popup";
import { useRideabilityMapLayer } from "#/features/rideability/hooks/use-rideability-map-layer";
import { ensureRideabilityLayers } from "#/features/rideability/layer";
import { setMapInstance, setMapViewport } from "#/stores/map-store";

import "maplibre-gl/dist/maplibre-gl.css";

const MIN_CONTAINER_PX = 2;

function containerSized(el: HTMLElement) {
	const { width, height } = el.getBoundingClientRect();
	return width >= MIN_CONTAINER_PX && height >= MIN_CONTAINER_PX;
}

export function MapView() {
	const containerRef = useRef<HTMLElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);

	useRideabilityMapLayer();
	useSinuosityMapLayer();
	useRadarsMapLayer();
	useRiskMapLayer();
	useMapZonePopup();
	useRadarPopup();
	useRiskPopup();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let alive = true;
		let map: maplibregl.Map | null = null;

		const syncViewport = (m: maplibregl.Map) => {
			const center = m.getCenter();
			const b = m.getBounds();
			setMapViewport({
				zoom: m.getZoom(),
				center: [center.lng, center.lat],
				bounds: {
					west: b.getWest(),
					south: b.getSouth(),
					east: b.getEast(),
					north: b.getNorth(),
				},
			});
		};

		const onMapLoad = (m: maplibregl.Map) => {
			if (!alive || mapRef.current !== m) return;

			ensureRideabilityLayers(m);
			ensureRadarsLayers(m);
			ensureRiskLayers(m);
			setMapInstance(m);
			m.resize();
			syncViewport(m);
		};

		const tryCreateMap = () => {
			if (!alive || mapRef.current || !containerSized(container)) return;

			map = new maplibregl.Map({
				container,
				style: BASEMAP_STYLE,
				center: DEFAULT_CENTER,
				zoom: DEFAULT_ZOOM,
				attributionControl: false,
				pitchWithRotate: false,
				dragRotate: false,
			});

			mapRef.current = map;
			const activeMap = map;

			map.addControl(
				new maplibregl.AttributionControl({ compact: true }),
				"bottom-left",
			);

			map.on("load", () => onMapLoad(activeMap));
			map.on("moveend", () => syncViewport(activeMap));
			map.on("zoomend", () => syncViewport(activeMap));
		};

		tryCreateMap();

		const ro = new ResizeObserver(() => {
			if (!alive) return;
			if (!mapRef.current) {
				tryCreateMap();
				return;
			}
			mapRef.current.resize();
		});
		ro.observe(container);

		return () => {
			alive = false;
			ro.disconnect();
			const m = mapRef.current;
			mapRef.current = null;
			setMapInstance(null);
			m?.remove();
			map = null;
		};
	}, []);

	return (
		<section
			ref={containerRef}
			className="map-container absolute inset-0 h-full w-full"
			aria-label="Carte interactive"
		/>
	);
}
