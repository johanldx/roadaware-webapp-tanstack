import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import { getBasemapStyle } from "#/config/map";
import {
	applyRadarsToMap,
	ensureRadarsLayers,
} from "#/features/layers/radars/layer";
import { radarsGeoJsonQueryOptions } from "#/features/layers/radars/queries";
import {
	applyReliefToMap,
	ensureReliefLayer,
} from "#/features/layers/relief/layer";
import { reliefGeoJsonQueryOptions } from "#/features/layers/relief/queries";
import { applyRiskToMap, ensureRiskLayers } from "#/features/layers/risk/layer";
import { riskGeoJsonQueryOptions } from "#/features/layers/risk/queries";
import {
	applySinuosityToMap,
	ensureSinuosityLayer,
} from "#/features/layers/sinuosity/layer";
import { sinuosityGeoJsonQueryOptions } from "#/features/layers/sinuosity/queries";
import {
	applyRideabilityToMap,
	ensureRideabilityLayers,
} from "#/features/rideability/layer";
import { rideabilityGridQueryOptions } from "#/features/rideability/queries";
import type { MapShareState } from "#/lib/share/map-share-payload";

import "maplibre-gl/dist/maplibre-gl.css";

interface ShareMapPreviewProps {
	state: MapShareState;
}

export function ShareMapPreview({ state }: ShareMapPreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let alive = true;
		const map = new maplibregl.Map({
			container,
			style: getBasemapStyle(state.basemapId),
			center: [state.lng, state.lat],
			zoom: state.zoom,
			interactive: false,
			attributionControl: false,
			pitchWithRotate: false,
			dragRotate: false,
		});

		const loadLayers = async () => {
			if (!alive) return;
			ensureRideabilityLayers(map);
			ensureSinuosityLayer(map);
			ensureReliefLayer(map);
			ensureRadarsLayers(map);
			ensureRiskLayers(map);

			const at = state.at ? new Date(state.at) : new Date();
			const tasks: Promise<void>[] = [];

			if (state.layers.rideability) {
				tasks.push(
					rideabilityGridQueryOptions(at)
						.queryFn?.()
						.then((data) => {
							if (!alive || !data) return;
							applyRideabilityToMap(
								map,
								data.samples,
								data.displayScores,
								true,
							);
						})
						.catch(() => undefined) ?? Promise.resolve(),
				);
			}

			if (state.layers.sinuosity) {
				tasks.push(
					sinuosityGeoJsonQueryOptions()
						.queryFn?.()
						.then((data) => {
							if (alive && data) applySinuosityToMap(map, data);
						})
						.catch(() => undefined) ?? Promise.resolve(),
				);
			}

			if (state.layers.relief) {
				tasks.push(
					reliefGeoJsonQueryOptions()
						.queryFn?.()
						.then((data) => {
							if (alive && data) applyReliefToMap(map, data);
						})
						.catch(() => undefined) ?? Promise.resolve(),
				);
			}

			if (state.layers.radars) {
				tasks.push(
					radarsGeoJsonQueryOptions()
						.queryFn?.()
						.then((data) => {
							if (alive && data) applyRadarsToMap(map, data);
						})
						.catch(() => undefined) ?? Promise.resolve(),
				);
			}

			if (state.layers.risk) {
				tasks.push(
					riskGeoJsonQueryOptions()
						.queryFn?.()
						.then((data) => {
							if (alive && data) applyRiskToMap(map, data);
						})
						.catch(() => undefined) ?? Promise.resolve(),
				);
			}

			await Promise.all(tasks);
			if (alive) map.resize();
		};

		map.on("load", () => {
			void loadLayers();
		});

		return () => {
			alive = false;
			map.remove();
		};
	}, [state]);

	return <div ref={containerRef} className="share-preview__map" aria-hidden />;
}
