import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { runWhenMapReady } from "#/features/map/run-when-map-ready";
import { LAYER_DEFINITIONS } from "#/types/layers";

import {
	applyRadarsToMap,
	ensureRadarsLayers,
	setRadarsVisibility,
} from "../layer";
import { radarsGeoJsonQueryOptions } from "../queries";

export function useRadarsMapLayer() {
	const map = useMapStore((s) => s.map);
	const zoom = useMapStore((s) => s.zoom);
	const enabled = useLayersStore((s) => s.enabled.radars);
	const minZoom = LAYER_DEFINITIONS.radars.minZoom;

	const { data, isError, isLoading } = useQuery({
		...radarsGeoJsonQueryOptions(),
		enabled,
	});

	const showLayer = enabled && zoom >= minZoom && !!data;

	useEffect(() => {
		if (!map) return;

		const apply = () => {
			ensureRadarsLayers(map);
			if (!showLayer || !data) {
				setRadarsVisibility(map, false);
				return;
			}
			applyRadarsToMap(map, data);
			setRadarsVisibility(map, true);
		};

		return runWhenMapReady(map, apply);
	}, [map, data, showLayer]);

	return {
		radarsLoading: enabled && isLoading && !data,
		radarsError: isError,
		belowMinZoom: enabled && zoom < minZoom,
	};
}
