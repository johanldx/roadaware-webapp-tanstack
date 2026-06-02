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
	applyWeatherClassicRasterToMap,
	applyWeatherClassicToMap,
	type ClassicWeatherKind,
	ensureWeatherClassicLayers,
} from "#/features/layers/weather-classic/layer";
import type { ScoreSampleDetail } from "#/features/rideability/grid-cache";
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

function weatherKindFromSample(sample: ScoreSampleDetail): ClassicWeatherKind {
	const factorScore = (id: string) =>
		sample.result.factors.find((item) => item.id === id)?.score ?? 50;
	const rain = factorScore("rain");
	const wind = factorScore("wind");
	const sun = factorScore("sun");
	const light = factorScore("light");

	if (light <= 52 || sun <= 35) return "night";
	if (rain <= 45) return "rain";
	if (wind <= 52) return "wind";
	return "sun";
}

function weatherIcon(kind: ClassicWeatherKind): string {
	if (kind === "rain") return "🌧";
	if (kind === "wind") return "💨";
	if (kind === "sun") return "☀";
	return "🌙";
}

function weatherScoreFromSample(sample: ScoreSampleDetail): number {
	const factorScore = (id: string) =>
		sample.result.factors.find((item) => item.id === id)?.score ?? 50;
	const rain = factorScore("rain");
	const wind = factorScore("wind");
	const sun = factorScore("sun");
	const light = factorScore("light");
	const raw = Math.round(rain * 0.38 + wind * 0.26 + light * 0.2 + sun * 0.16);
	const kind = weatherKindFromSample(sample);
	if (kind === "night") return Math.min(raw, 42);
	if (kind === "rain") return Math.min(raw, 38);
	if (kind === "wind") return Math.min(raw, 58);
	return Math.max(raw, 62);
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
			ensureWeatherClassicLayers(map);
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

			if (state.layers.weatherClassic) {
				tasks.push(
					rideabilityGridQueryOptions(at)
						.queryFn?.()
						.then((data) => {
							if (!alive || !data) return;
							applyWeatherClassicRasterToMap(
								map,
								data.samples.map((sample) => ({
									lat: sample.lat,
									lng: sample.lng,
									score: weatherScoreFromSample(sample),
								})),
							);
							applyWeatherClassicToMap(map, {
								type: "FeatureCollection",
								features: data.samples.map((sample) => {
									const kind = weatherKindFromSample(sample);
									return {
										type: "Feature" as const,
										properties: {
											kind,
											icon: weatherIcon(kind),
											weatherScore: weatherScoreFromSample(sample),
										},
										geometry: {
											type: "Point" as const,
											coordinates: [sample.lng, sample.lat],
										},
									};
								}),
							});
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
