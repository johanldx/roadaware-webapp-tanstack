import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { useMapLayerOnViewport } from "#/features/map/use-map-layer-on-viewport";
import { LAYER_DEFINITIONS } from "#/types/layers";

import {
	applySinuosityToMap,
	ensureSinuosityLayer,
	setSinuosityVisibility,
} from "../layer";
import { sinuosityGeoJsonQueryOptions } from "../queries";

export function useSinuosityMapLayer() {
	const map = useMapStore((s) => s.map);
	const zoom = useMapStore((s) => s.zoom);
	const enabled = useLayersStore((s) => s.enabled.sinuosity);
	const minZoom = LAYER_DEFINITIONS.sinuosity.minZoom;

	const { data, isError, isLoading } = useQuery({
		...sinuosityGeoJsonQueryOptions(),
		enabled,
	});

	const applyLayer = useCallback(() => {
		if (!map) return;
		ensureSinuosityLayer(map);
		if (!enabled || !data) {
			setSinuosityVisibility(map, false);
			return;
		}
		// Données toujours chargées ; le minzoom du calque MapLibre gère l’affichage au dézoom.
		applySinuosityToMap(map, data);
		setSinuosityVisibility(map, true);
	}, [map, enabled, data]);

	useMapLayerOnViewport(map, applyLayer);

	return {
		sinuosityLoading: enabled && isLoading && !data,
		sinuosityError: isError,
		belowMinZoom: enabled && zoom < minZoom,
	};
}
