import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { runWhenMapReady } from "#/features/map/run-when-map-ready";
import { setRuntimeGridCache } from "#/features/rideability/grid-cache-runtime";
import { setRideabilityGridCache } from "#/stores/rideability-store";

import {
	applyRideabilityToMap,
	setRideabilityVisibility,
	updateZoneMarkers,
} from "../layer";
import {
	isRideabilityGridLoading,
	shouldHideRideabilityLayer,
} from "../loading";
import { rideabilityGridQueryOptions } from "../queries";
import { useRideabilityStore } from "./use-rideability-store";

export function useRideabilityMapLayer() {
	const map = useMapStore((s) => s.map);
	const styleEpoch = useMapStore((s) => s.styleEpoch);
	const enabled = useLayersStore((s) => s.enabled.rideability);
	const selectedAt = useRideabilityStore((s) => s.selectedAt);

	const { data, isFetching, isLoading, isError, isPlaceholderData } = useQuery({
		...rideabilityGridQueryOptions(selectedAt),
		enabled,
		placeholderData: (prev) => prev,
	});

	const hasData = Boolean(data?.samples?.length);
	const gridLoading = isRideabilityGridLoading(
		enabled,
		isLoading,
		isFetching,
		hasData,
		isPlaceholderData,
	);
	const displayScoresRef = useRef<Map<string, number> | null>(null);

	useEffect(() => {
		displayScoresRef.current = data?.displayScores ?? null;
		if (data) {
			const cache = {
				samples: data.samples,
				displayScores: data.displayScores,
			};
			setRuntimeGridCache(cache);
			setRideabilityGridCache(cache);
		} else if (!enabled) {
			setRuntimeGridCache(null);
			setRideabilityGridCache(null);
		}
	}, [data, enabled]);

	useEffect(() => {
		if (!map) return;
		void styleEpoch;

		const render = () => {
			if (shouldHideRideabilityLayer(enabled, isLoading, hasData) || !data) {
				setRideabilityVisibility(map, false);
				return;
			}

			applyRideabilityToMap(map, data.samples, data.displayScores, true);
		};

		return runWhenMapReady(map, render);
	}, [map, data, enabled, isLoading, hasData, styleEpoch]);

	useEffect(() => {
		if (!map || !enabled) return;

		let raf = 0;
		const refreshMarkers = () => {
			if (!displayScoresRef.current || !map.isStyleLoaded()) return;
			updateZoneMarkers(map, displayScoresRef.current);
		};

		const onZoom = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(refreshMarkers);
		};

		map.on("zoom", onZoom);
		map.on("zoomend", refreshMarkers);
		return () => {
			cancelAnimationFrame(raf);
			map.off("zoom", onZoom);
			map.off("zoomend", refreshMarkers);
		};
	}, [map, enabled]);

	return { gridLoading, gridError: isError };
}
