import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { useMapLayerOnViewport } from "#/features/map/use-map-layer-on-viewport";
import { LAYER_DEFINITIONS } from "#/types/layers";

import { applyRiskToMap, ensureRiskLayers, setRiskVisibility } from "../layer";
import { riskGeoJsonQueryOptions } from "../queries";

export function useRiskMapLayer() {
	const map = useMapStore((s) => s.map);
	const zoom = useMapStore((s) => s.zoom);
	const enabled = useLayersStore((s) => s.enabled.risk);
	const minZoom = LAYER_DEFINITIONS.risk.minZoom;

	const { data, isError, isLoading } = useQuery({
		...riskGeoJsonQueryOptions(),
		enabled,
	});

	const applyLayer = useCallback(() => {
		if (!map) return;
		ensureRiskLayers(map);
		if (!enabled || !data) {
			setRiskVisibility(map, false);
			return;
		}
		applyRiskToMap(map, data);
		setRiskVisibility(map, true);
	}, [map, enabled, data]);

	useMapLayerOnViewport(map, applyLayer);

	return {
		riskLoading: enabled && isLoading && !data,
		riskError: isError,
		belowMinZoom: enabled && zoom < minZoom,
	};
}
