import type { RiskSegmentProperties } from "./types";

function el(tag: string, className: string, text?: string) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function highwayLabel(highway: string): string {
	const labels: Record<string, string> = {
		motorway: "Autoroute",
		trunk: "Voie rapide",
		motorway_link: "Bretelle",
		trunk_link: "Bretelle",
		primary: "Route principale",
		secondary: "Route secondaire",
		tertiary: "Route tertiaire",
	};
	return labels[highway] ?? "Route";
}

function percentileLabel(p: number): string {
	const pct = Math.round(p * 100);
	if (pct >= 90) return `Densité au-dessus de ${pct} % des tronçons IDF`;
	if (pct >= 75) return `Densité élevée (≈ ${pct}e percentile IDF)`;
	return `Densité modérée (≈ ${pct}e percentile)`;
}

function levelTitle(level: number): string {
	if (level >= 3) return "Historique très dense";
	if (level >= 2) return "Historique notable";
	return "Historique modéré";
}

function formatPeriod(props: RiskSegmentProperties): string {
	return props.yearsFrom === props.yearsTo
		? `${props.yearsFrom}`
		: `${props.yearsFrom}–${props.yearsTo}`;
}

function formatRoad(props: RiskSegmentProperties): string {
	const len = Math.round(props.lengthM);
	return (
		props.name?.trim() ||
		`${highwayLabel(props.highway)}${len > 0 ? ` (~${len} m)` : ""}`
	);
}

function levelLead(props: RiskSegmentProperties): string {
	const period = formatPeriod(props);
	const road = formatRoad(props);
	return `${props.accidentCount} accidents moto déclarés sur ce tronçon (${road}, ${period}).`;
}

function appendMetricRow(
	parent: HTMLElement,
	label: string,
	value: string,
	hint?: string,
) {
	const row = el("div", "risk-popup__metric");
	row.appendChild(el("span", "risk-popup__metric-label", label));
	row.appendChild(el("span", "risk-popup__metric-value", value));
	if (hint) row.appendChild(el("span", "risk-popup__metric-hint", hint));
	parent.appendChild(row);
}

export function buildRiskPopupElement(
	props: RiskSegmentProperties,
): HTMLElement {
	const root = el("div", "risk-popup");

	const head = el("div", "risk-popup__head");
	const pct = Math.round(props.percentile * 100);
	head.appendChild(
		el(
			"span",
			`risk-popup__badge risk-popup__badge--l${props.riskLevel}`,
			`${pct}%`,
		),
	);
	const headText = el("div", "risk-popup__head-text");
	headText.appendChild(
		el("span", "risk-popup__title", levelTitle(props.riskLevel)),
	);
	headText.appendChild(
		el("p", "risk-popup__subtitle", percentileLabel(props.percentile)),
	);
	headText.appendChild(el("p", "risk-popup__lead", levelLead(props)));
	head.appendChild(headText);
	root.appendChild(head);

	const metrics = el("div", "risk-popup__metrics");
	appendMetricRow(
		metrics,
		"Densité",
		`${props.accidentsPerKm.toLocaleString("fr-FR")} acc./km`,
		"Proxy sur la longueur du tronçon OSM",
	);
	appendMetricRow(
		metrics,
		"Volume brut",
		`${props.accidentCount} accidents`,
		`≈ ${Math.round(props.countPercentile * 100)}e percentile IDF (comptage)`,
	);

	if (props.trafficSource === "tmja" && props.tmja != null) {
		const rate =
			props.accidentsPer100MVehKm != null
				? `${props.accidentsPer100MVehKm.toLocaleString("fr-FR")} / 100 M véh·km`
				: "—";
		const tmjaHint = [
			`TMJA ${props.tmja.toLocaleString("fr-FR")} véh/j`,
			props.tmjaMeasureYear ? `mesure ${props.tmjaMeasureYear}` : null,
			props.tmjaDistM != null ? `section à ${props.tmjaDistM} m` : null,
			props.tmjaPercentile != null
				? `≈ ${Math.round(props.tmjaPercentile * 100)}e percentile ratio IDF`
				: null,
		]
			.filter(Boolean)
			.join(" · ");
		appendMetricRow(metrics, "Ratio trafic", rate, tmjaHint);
	} else {
		appendMetricRow(
			metrics,
			"Ratio trafic",
			"Non disponible",
			"Pas de comptage TMJA à ≤ 500 m de ce tronçon",
		);
	}

	root.appendChild(metrics);

	const note = el("p", "risk-popup__note");
	note.textContent =
		"BAAC = accidents corporels déclarés (2-roues motorisés), rattachés au tronçon OSM le plus proche (≤ 45 m). Tendance historique, pas un danger absolu.";
	root.appendChild(note);

	return root;
}
