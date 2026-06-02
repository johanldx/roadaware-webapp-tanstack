import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { idfFitBounds } from "#/config/idf-boundary";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { collectMapShareState } from "#/features/share/collect-map-share-state";
import { applyMapShareState } from "#/lib/share/apply-map-share-state";
import {
	decodeMapSharePayload,
	encodeMapSharePayload,
} from "#/lib/share/map-share-payload";
import { basemapStore } from "#/stores/basemap-store";
import { layersStore } from "#/stores/layers-store";
import { setMapViewport } from "#/stores/map-store";
import { rideabilityStore, setSelectedAtIso } from "#/stores/rideability-store";

export function useMapShareUrlSync() {
	const navigate = useNavigate({ from: "/app" });
	const search = useSearch({ from: "/app" });
	const map = useMapStore((s) => s.map);
	const mapEpoch = useMapStore((s) => s.mapEpoch);
	const skipNextUrlWrite = useRef(false);
	const suppressUrlWrite = useRef(false);
	const viewportSyncedEpoch = useRef(-1);
	const shareApplied = useRef<string | null>(null);

	useEffect(() => {
		if (!map || !search.s || shareApplied.current === search.s) return;
		const state = decodeMapSharePayload(search.s);
		if (!state) return;

		shareApplied.current = search.s;
		skipNextUrlWrite.current = true;
		suppressUrlWrite.current = true;
		viewportSyncedEpoch.current = mapEpoch;

		applyMapShareState(map, state);

		queueMicrotask(() => {
			suppressUrlWrite.current = false;
		});
	}, [map, mapEpoch, search.s]);

	useEffect(() => {
		if (!map || viewportSyncedEpoch.current === mapEpoch) return;
		if (search.s) return;
		viewportSyncedEpoch.current = mapEpoch;

		if (search.lat != null && search.lng != null) {
			const zoom = search.zoom ?? 9;
			map.jumpTo({ center: [search.lng, search.lat], zoom });
			setMapViewport({
				center: [search.lng, search.lat],
				zoom,
				bounds: null,
			});
			return;
		}

		map.fitBounds(idfFitBounds(), {
			padding: { top: 80, bottom: 200, left: 24, right: 24 },
			duration: 0,
		});
	}, [map, mapEpoch, search.lat, search.lng, search.zoom, search.s]);

	useEffect(() => {
		if (search.at && !search.s) {
			skipNextUrlWrite.current = true;
			setSelectedAtIso(search.at);
		}
	}, [search.at, search.s]);

	useEffect(() => {
		if (!map) return;

		const writeUrl = () => {
			if (suppressUrlWrite.current) return;
			if (skipNextUrlWrite.current) {
				skipNextUrlWrite.current = false;
				return;
			}

			const state = collectMapShareState();
			if (!state) return;

			const encoded = encodeMapSharePayload(state);
			if (encoded === shareApplied.current) return;

			shareApplied.current = encoded;
			navigate({
				search: { s: encoded },
				replace: true,
			});
		};

		map.on("moveend", writeUrl);
		const subLayers = layersStore.subscribe(writeUrl);
		const subBasemap = basemapStore.subscribe(writeUrl);
		const subRide = rideabilityStore.subscribe(writeUrl);

		return () => {
			map.off("moveend", writeUrl);
			subLayers.unsubscribe();
			subBasemap.unsubscribe();
			subRide.unsubscribe();
		};
	}, [map, navigate]);
}
