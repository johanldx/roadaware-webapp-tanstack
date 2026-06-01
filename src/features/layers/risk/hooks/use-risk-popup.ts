import maplibregl from "maplibre-gl";
import { useEffect } from "react";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";

import { RISK_HIT_LAYER_ID } from "../layer";
import { buildRiskPopupElement } from "../risk-popup";
import type { RiskSegmentProperties, RiskTrafficSource } from "../types";

function num(p: GeoJSON.GeoJsonProperties, key: string): number | undefined {
	const v = Number(p?.[key]);
	return Number.isFinite(v) ? v : undefined;
}

function str(p: GeoJSON.GeoJsonProperties, key: string): string | undefined {
	const v = p?.[key];
	return v != null && v !== "" ? String(v) : undefined;
}

export function useRiskPopup() {
	const map = useMapStore((s) => s.map);
	const enabled = useLayersStore((s) => s.enabled.risk);

	useEffect(() => {
		if (!map || !enabled) return;

		const popup = new maplibregl.Popup({
			closeButton: true,
			closeOnClick: false,
			maxWidth: "340px",
			className: "risk-popup-container",
			offset: 12,
		});

		const mount = document.createElement("div");
		popup.setDOMContent(mount);

		let pinned = false;

		const show = (
			lngLat: maplibregl.LngLatLike,
			props: RiskSegmentProperties,
		) => {
			mount.replaceChildren(buildRiskPopupElement(props));
			popup.setLngLat(lngLat);
			if (!popup.isOpen()) popup.addTo(map);
		};

		popup.on("close", () => {
			pinned = false;
		});

		const propsFrom = (
			f: maplibregl.MapGeoJSONFeature,
		): RiskSegmentProperties | null => {
			const p = f.properties;
			if (!p) return null;

			const accidentCount = num(p, "accidentCount");
			const lengthM = num(p, "lengthM") ?? 0;
			const percentile = num(p, "percentile");
			const countPercentile = num(p, "countPercentile") ?? percentile;
			const riskLevel = Number(p.riskLevel) as 1 | 2 | 3;
			const riskScore = num(p, "riskScore");
			const accidentsPerKm =
				num(p, "accidentsPerKm") ??
				(accidentCount != null && lengthM > 0
					? Math.round(
							(accidentCount / Math.max(lengthM / 1000, 0.05)) * 1000,
						) / 1000
					: undefined);

			if (
				accidentCount == null ||
				accidentsPerKm == null ||
				percentile == null ||
				riskScore == null
			) {
				return null;
			}

			const trafficSource = (str(p, "trafficSource") ??
				"none") as RiskTrafficSource;

			const props: RiskSegmentProperties = {
				segmentId: String(p.segmentId ?? ""),
				accidentCount,
				accidentsPerKm,
				percentile,
				countPercentile: countPercentile ?? percentile,
				riskLevel: riskLevel >= 3 ? 3 : riskLevel >= 2 ? 2 : 1,
				riskScore,
				highway: String(p.highway ?? ""),
				name: str(p, "name"),
				lengthM: lengthM ?? 0,
				yearsFrom: Number(p.yearsFrom) || 0,
				yearsTo: Number(p.yearsTo) || 0,
				metric: "density",
				trafficSource,
			};

			if (trafficSource === "tmja") {
				const tmja = num(p, "tmja");
				if (tmja != null) {
					props.tmja = tmja;
					props.tmjaDistM = num(p, "tmjaDistM");
					props.tmjaMeasureYear = num(p, "tmjaMeasureYear");
					props.accidentsPer100MVehKm = num(p, "accidentsPer100MVehKm");
					props.tmjaPercentile = num(p, "tmjaPercentile");
				}
			}

			return props;
		};

		const onEnter = (e: maplibregl.MapLayerMouseEvent) => {
			if (pinned) return;
			const f = e.features?.[0];
			if (!f) return;
			const props = propsFrom(f);
			if (!props) return;
			map.getCanvas().style.cursor = "pointer";
			show(e.lngLat, props);
		};

		const onLeave = () => {
			map.getCanvas().style.cursor = "";
			if (!pinned) popup.remove();
		};

		const onClick = (e: maplibregl.MapLayerMouseEvent) => {
			const f = e.features?.[0];
			if (!f) return;
			const props = propsFrom(f);
			if (!props) return;
			pinned = true;
			map.getCanvas().style.cursor = "pointer";
			show(e.lngLat, props);
		};

		map.on("mouseenter", RISK_HIT_LAYER_ID, onEnter);
		map.on("mouseleave", RISK_HIT_LAYER_ID, onLeave);
		map.on("click", RISK_HIT_LAYER_ID, onClick);

		return () => {
			map.off("mouseenter", RISK_HIT_LAYER_ID, onEnter);
			map.off("mouseleave", RISK_HIT_LAYER_ID, onLeave);
			map.off("click", RISK_HIT_LAYER_ID, onClick);
			popup.remove();
			map.getCanvas().style.cursor = "";
		};
	}, [map, enabled]);
}
