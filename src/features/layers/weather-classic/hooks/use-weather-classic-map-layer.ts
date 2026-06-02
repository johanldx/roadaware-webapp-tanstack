import { useQuery } from "@tanstack/react-query";
import type { Feature, Point } from "geojson";
import { useEffect } from "react";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { runWhenMapReady } from "#/features/map/run-when-map-ready";
import type { ScoreSampleDetail } from "#/features/rideability/grid-cache";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import type { ScoreSample } from "#/features/rideability/interpolate";
import { rideabilityGridQueryOptions } from "#/features/rideability/queries";
import { LAYER_DEFINITIONS } from "#/types/layers";

import {
	applyWeatherClassicRasterToMap,
	applyWeatherClassicToMap,
	type ClassicWeatherCollection,
	type ClassicWeatherKind,
	ensureWeatherClassicLayers,
	setWeatherClassicVisibility,
} from "../layer";

function iconForKind(kind: ClassicWeatherKind): string {
	if (kind === "rain") return "🌧";
	if (kind === "wind") return "💨";
	if (kind === "sun") return "☀";
	return "🌙";
}

function weatherScoreFromFactors({
	rain,
	wind,
	sun,
	light,
}: {
	rain: number;
	wind: number;
	sun: number;
	light: number;
}): number {
	return Math.round(rain * 0.38 + wind * 0.26 + light * 0.2 + sun * 0.16);
}

function classifyWeather(sample: ScoreSampleDetail): {
	kind: ClassicWeatherKind;
	score: number;
} {
	const factorScore = (id: string) =>
		sample.result.factors.find((item) => item.id === id)?.score ?? 50;
	const rain = factorScore("rain");
	const wind = factorScore("wind");
	const sun = factorScore("sun");
	const light = factorScore("light");
	const rawScore = weatherScoreFromFactors({ rain, wind, sun, light });

	if (light <= 52 || sun <= 35) {
		return { kind: "night", score: Math.min(rawScore, 42) };
	}
	if (rain <= 45) {
		return { kind: "rain", score: Math.min(rawScore, 38) };
	}
	if (wind <= 52) {
		return { kind: "wind", score: Math.min(rawScore, 58) };
	}
	return { kind: "sun", score: Math.max(rawScore, 62) };
}

function toClassicWeatherGeoJson(
	samples: ScoreSampleDetail[],
): ClassicWeatherCollection {
	const pointFeatures: Feature<
		Point,
		{ kind: ClassicWeatherKind; icon: string; weatherScore: number }
	>[] = samples.map((sample) => {
		const { kind, score } = classifyWeather(sample);
		return {
			type: "Feature",
			properties: {
				kind,
				icon: iconForKind(kind),
				weatherScore: score,
			},
			geometry: {
				type: "Point",
				coordinates: [sample.lng, sample.lat],
			},
		};
	});

	return {
		type: "FeatureCollection",
		features: pointFeatures,
	};
}

function toWeatherScoreSamples(samples: ScoreSampleDetail[]): ScoreSample[] {
	return samples.map((sample) => {
		const { score } = classifyWeather(sample);
		return {
			lat: sample.lat,
			lng: sample.lng,
			score,
		};
	});
}

export function useWeatherClassicMapLayer() {
	const map = useMapStore((s) => s.map);
	const styleEpoch = useMapStore((s) => s.styleEpoch);
	const zoom = useMapStore((s) => s.zoom);
	const enabled = useLayersStore((s) => s.enabled.weatherClassic);
	const selectedAt = useRideabilityStore((s) => s.selectedAt);
	const minZoom = LAYER_DEFINITIONS.weatherClassic.minZoom;

	const { data, isLoading, isError } = useQuery({
		...rideabilityGridQueryOptions(selectedAt),
		enabled,
	});

	const showLayer = enabled && zoom >= minZoom && Boolean(data?.samples.length);

	useEffect(() => {
		if (!map) return;
		void styleEpoch;

		const apply = () => {
			ensureWeatherClassicLayers(map);
			if (!showLayer || !data) {
				setWeatherClassicVisibility(map, false);
				return;
			}

			applyWeatherClassicRasterToMap(map, toWeatherScoreSamples(data.samples));
			applyWeatherClassicToMap(map, toClassicWeatherGeoJson(data.samples));
			setWeatherClassicVisibility(map, true);
		};

		return runWhenMapReady(map, apply);
	}, [map, styleEpoch, showLayer, data]);

	return {
		weatherClassicLoading: enabled && isLoading && !data,
		weatherClassicError: isError,
		belowMinZoom: enabled && zoom < minZoom,
	};
}
