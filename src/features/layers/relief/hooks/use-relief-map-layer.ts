import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { useMapLayerOnViewport } from "#/features/map/use-map-layer-on-viewport";
import { LAYER_DEFINITIONS } from "#/types/layers";

import {
	applyReliefToMap,
	ensureReliefLayer,
	setReliefVisibility,
} from "../layer";
import { reliefGeoJsonQueryOptions } from "../queries";

export function useReliefMapLayer() {
	const map = useMapStore((s) => s.map);
	const zoom = useMapStore((s) => s.zoom);
	const enabled = useLayersStore((s) => s.enabled.relief);
	const minZoom = LAYER_DEFINITIONS.relief.minZoom;

	const { data, isError, isLoading } = useQuery({
		...reliefGeoJsonQueryOptions(),
		enabled,
	});

	const applyLayer = useCallback(() => {
		if (!map) return;
		ensureReliefLayer(map);
		if (!enabled || !data) {
			setReliefVisibility(map, false);
			return;
		}
		applyReliefToMap(map, data);
		setReliefVisibility(map, true);
	}, [map, enabled, data]);

	useMapLayerOnViewport(map, applyLayer);

	return {
		reliefLoading: enabled && isLoading && !data,
		reliefError: isError,
		belowMinZoom: enabled && zoom < minZoom,
	};
}
