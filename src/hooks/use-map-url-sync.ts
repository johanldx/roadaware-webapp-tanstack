import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { idfFitBounds } from "#/config/idf-boundary";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { setMapViewport } from "#/stores/map-store";
import { setSelectedAtIso } from "#/stores/rideability-store";

export function useMapUrlSync() {
	const navigate = useNavigate({ from: "/app" });
	const search = useSearch({ from: "/app" });
	const map = useMapStore((s) => s.map);
	const mapEpoch = useMapStore((s) => s.mapEpoch);
	const skipNextUrlWrite = useRef(false);
	const viewportSyncedEpoch = useRef(-1);

	useEffect(() => {
		if (search.at) {
			skipNextUrlWrite.current = true;
			setSelectedAtIso(search.at);
		}
	}, [search.at]);

	useEffect(() => {
		if (!map || viewportSyncedEpoch.current === mapEpoch) return;
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
	}, [map, mapEpoch, search.lat, search.lng, search.zoom]);

	useEffect(() => {
		if (!map) return;

		const writeUrl = () => {
			if (skipNextUrlWrite.current) {
				skipNextUrlWrite.current = false;
				return;
			}
			const c = map.getCenter();
			const z = map.getZoom();
			navigate({
				search: (prev) => ({
					...prev,
					lat: Math.round(c.lat * 1e4) / 1e4,
					lng: Math.round(c.lng * 1e4) / 1e4,
					zoom: Math.round(z * 10) / 10,
				}),
				replace: true,
			});
		};

		map.on("moveend", writeUrl);
		return () => {
			map.off("moveend", writeUrl);
		};
	}, [map, navigate]);
}

export function syncTimeToUrl(
	at: Date,
	navigate: ReturnType<typeof useNavigate>,
) {
	navigate({
		search: (prev) => ({ ...prev, at: at.toISOString() }),
		replace: true,
	});
}
