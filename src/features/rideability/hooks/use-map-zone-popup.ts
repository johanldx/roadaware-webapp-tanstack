import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { getRuntimeGridCache } from "#/features/rideability/grid-cache-runtime";
import { labelFromScore } from "#/features/rideability/scoring";
import {
	blockCenterLngLat,
	blockSizeForZoom,
	findClosestZoneBlock,
	normalizeDisplayScores,
	rideabilityForZoneBlock,
	type ZoneBlockProps,
} from "#/features/rideability/zone-aggregation";

import { RIDEABILITY_ZONES_HIT_LAYER } from "../layer";
import { fetchPointRideability } from "../queries";
import { buildZonePopupElement, buildZoneQuickPopup } from "../zone-popup";
import { useRideabilityStore } from "./use-rideability-store";

function zonePropsFromFeature(
	f: maplibregl.MapGeoJSONFeature,
): ZoneBlockProps | null {
	const score = Number(f.properties?.score);
	const blockSize = Number(f.properties?.blockSize);
	if (!Number.isFinite(score) || !Number.isFinite(blockSize)) return null;

	let br = Number(f.properties?.br);
	let bc = Number(f.properties?.bc);
	if (!Number.isFinite(br) || !Number.isFinite(bc)) {
		const m = /^agg-r(\d+)c(\d+)-b(\d+)$/.exec(String(f.id ?? ""));
		if (!m) return null;
		br = Number(m[1]);
		bc = Number(m[2]);
		const idBlock = Number(m[3]);
		if (idBlock !== blockSize) return null;
	}

	return { score, blockSize, br, bc };
}

function zoneDetailFromCache(props: ZoneBlockProps) {
	const cache = getRuntimeGridCache();
	const samples =
		cache?.samples?.filter((s) => s.result?.factors?.length) ?? [];
	if (samples.length === 0 || !cache) return null;
	return rideabilityForZoneBlock(props, { ...cache, samples });
}

export function useMapZonePopup() {
	const map = useMapStore((s) => s.map);
	const enabled = useLayersStore((s) => s.enabled.rideability);
	const selectedAt = useRideabilityStore((s) => s.selectedAt);
	const selectedAtRef = useRef(selectedAt);
	selectedAtRef.current = selectedAt;

	useEffect(() => {
		if (!map || !enabled) return;

		const popup = new maplibregl.Popup({
			closeButton: true,
			closeOnClick: false,
			maxWidth: "340px",
			className: "zone-score-popup",
			offset: 14,
		});

		const mount = document.createElement("div");
		mount.className = "zone-popup-mount";
		popup.setDOMContent(mount);

		let pinned = false;
		let loadSeq = 0;

		const showContent = (lngLat: maplibregl.LngLatLike, node: HTMLElement) => {
			mount.replaceChildren(node);
			popup.setLngLat(lngLat);
			if (!popup.isOpen()) popup.addTo(map);
		};

		popup.on("close", () => {
			pinned = false;
			loadSeq += 1;
		});

		const previewFeature = (f: maplibregl.MapGeoJSONFeature) => {
			if (!f.geometry || f.geometry.type !== "Point") return;
			const props = zonePropsFromFeature(f);
			if (!props) return;
			map.getCanvas().style.cursor = "pointer";
			const coords = f.geometry.coordinates as [number, number];
			showContent(
				coords,
				buildZoneQuickPopup(props.score, labelFromScore(props.score)),
			);
		};

		const openDetailedFeature = (f: maplibregl.MapGeoJSONFeature) => {
			if (!f.geometry || f.geometry.type !== "Point") return;
			const props = zonePropsFromFeature(f);
			if (!props) return;

			pinned = true;
			const seq = ++loadSeq;
			map.getCanvas().style.cursor = "pointer";

			const [lng, lat] = f.geometry.coordinates as [number, number];
			const cached = zoneDetailFromCache(props);

			if (cached) {
				showContent(
					[lng, lat],
					buildZonePopupElement(props.score, cached, false),
				);
				return;
			}

			showContent(
				[lng, lat],
				buildZonePopupElement(props.score, undefined, true),
			);

			const center = blockCenterLngLat(props.br, props.bc, props.blockSize);
			void fetchPointRideability(center.lat, center.lng, selectedAtRef.current)
				.then((fetched) => {
					if (seq !== loadSeq || !pinned) return;
					const result = {
						...fetched,
						score: props.score,
						label: labelFromScore(props.score),
					};
					showContent(
						[lng, lat],
						buildZonePopupElement(props.score, result, false),
					);
				})
				.catch(() => {
					if (seq !== loadSeq || !pinned) return;
					showContent(
						[lng, lat],
						buildZonePopupElement(props.score, null, false),
					);
				});
		};

		const onEnter = (e: maplibregl.MapLayerMouseEvent) => {
			if (pinned) return;
			const f = e.features?.[0];
			if (!f) return;
			previewFeature(f);
		};

		const onLeave = () => {
			map.getCanvas().style.cursor = "";
			if (!pinned) popup.remove();
		};

		const onClick = (e: maplibregl.MapLayerMouseEvent) => {
			const f = e.features?.[0];
			if (!f) return;
			openDetailedFeature(f);
		};

		const onMoveAnywhere = (e: maplibregl.MapMouseEvent) => {
			if (pinned) return;
			const f = map.queryRenderedFeatures(e.point, {
				layers: [RIDEABILITY_ZONES_HIT_LAYER],
			})[0];
			if (!f) {
				popup.remove();
				map.getCanvas().style.cursor = "";
				return;
			}
			previewFeature(f);
		};

		const dismissPopup = (point?: maplibregl.Point) => {
			if (!popup.isOpen()) return;
			if (point) {
				const onZone = map.queryRenderedFeatures(point, {
					layers: [RIDEABILITY_ZONES_HIT_LAYER],
				});
				if (onZone.length > 0) return;
			}
			popup.remove();
		};

		const onMapClick = (e: maplibregl.MapMouseEvent) => {
			const f = map.queryRenderedFeatures(e.point, {
				layers: [RIDEABILITY_ZONES_HIT_LAYER],
			})[0];
			if (f) {
				openDetailedFeature(f);
				return;
			}
			const cache = getRuntimeGridCache();
			const scores = cache?.displayScores;
			if (!scores) {
				dismissPopup(e.point);
				return;
			}
			const blockSize = blockSizeForZoom(map.getZoom());
			const nearest = findClosestZoneBlock(
				normalizeDisplayScores(scores),
				blockSize,
				e.lngLat,
			);
			if (!nearest) {
				dismissPopup(e.point);
				return;
			}
			const synthetic = {
				type: "Feature",
				id: `click-r${nearest.br}c${nearest.bc}-b${nearest.blockSize}`,
				properties: {
					score: nearest.score,
					blockSize: nearest.blockSize,
					br: nearest.br,
					bc: nearest.bc,
				},
				geometry: {
					type: "Point",
					coordinates: [e.lngLat.lng, e.lngLat.lat],
				},
			} as unknown as maplibregl.MapGeoJSONFeature;
			openDetailedFeature(synthetic);
		};

		const onDocumentPointerDown = (e: PointerEvent) => {
			if (!popup.isOpen()) return;
			const popupEl = popup.getElement();
			if (popupEl?.contains(e.target as Node)) return;
			if ((e.target as HTMLElement).closest(".maplibregl-canvas")) return;
			popup.remove();
		};

		map.on("mouseenter", RIDEABILITY_ZONES_HIT_LAYER, onEnter);
		map.on("mouseleave", RIDEABILITY_ZONES_HIT_LAYER, onLeave);
		map.on("click", RIDEABILITY_ZONES_HIT_LAYER, onClick);
		map.on("mousemove", onMoveAnywhere);
		map.on("click", onMapClick);
		document.addEventListener("pointerdown", onDocumentPointerDown, true);

		return () => {
			loadSeq += 1;
			map.off("mouseenter", RIDEABILITY_ZONES_HIT_LAYER, onEnter);
			map.off("mouseleave", RIDEABILITY_ZONES_HIT_LAYER, onLeave);
			map.off("click", RIDEABILITY_ZONES_HIT_LAYER, onClick);
			map.off("mousemove", onMoveAnywhere);
			map.off("click", onMapClick);
			document.removeEventListener("pointerdown", onDocumentPointerDown, true);
			popup.remove();
			map.getCanvas().style.cursor = "";
		};
	}, [map, enabled]);
}
