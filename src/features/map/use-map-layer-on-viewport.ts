import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";
import { useMapStore } from "./hooks/use-map-store";
import { runWhenMapReady } from "./run-when-map-ready";

/**
 * Ré-applique un calque quand la carte est prête ou bouge (zoom / pan).
 */
export function useMapLayerOnViewport(
	map: MapLibreMap | null,
	apply: () => void,
) {
	const styleEpoch = useMapStore((s) => s.styleEpoch);

	useEffect(() => {
		if (!map) return;
		void styleEpoch;

		let cancelReady = () => {};

		const run = () => {
			cancelReady();
			cancelReady = runWhenMapReady(map, apply);
		};

		run();

		map.on("moveend", run);
		map.on("zoomend", run);
		return () => {
			cancelReady();
			map.off("moveend", run);
			map.off("zoomend", run);
		};
	}, [map, apply, styleEpoch]);
}
