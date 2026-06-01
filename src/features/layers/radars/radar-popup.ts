import { RADAR_TYPE_LABELS, type RadarProperties } from "./types";

function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className: string,
	text?: string,
) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function parseServiceStart(raw: string | null): Date | null {
	if (!raw) return null;
	const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(raw.trim());
	if (!m) return null;
	const day = Number(m[1]);
	const month = Number(m[2]) - 1;
	const year = Number(m[3]);
	const d = new Date(year, month, day);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** Durée en français : « 3 ans », « 8 mois », etc. */
export function formatInServiceDuration(raw: string | null): string {
	const start = parseServiceStart(raw);
	if (!start) return "Inconnu";

	const now = new Date();
	let months =
		(now.getFullYear() - start.getFullYear()) * 12 +
		(now.getMonth() - start.getMonth());
	if (now.getDate() < start.getDate()) months -= 1;
	if (months < 0) months = 0;

	if (months < 1) return "Moins d'un mois";
	if (months < 12) return months === 1 ? "1 mois" : `${months} mois`;

	const years = Math.floor(months / 12);
	const rest = months % 12;
	const yLabel = years === 1 ? "1 an" : `${years} ans`;
	if (rest === 0) return yLabel;
	const mLabel = rest === 1 ? "1 mois" : `${rest} mois`;
	return `${yLabel} et ${mLabel}`;
}

function appendFact(list: HTMLDListElement, label: string, value: string) {
	const row = el("div", "radar-popup__row");
	row.appendChild(el("dt", "radar-popup__label", label));
	row.appendChild(el("dd", "radar-popup__value", value));
	list.appendChild(row);
}

export function buildRadarPopupElement(props: RadarProperties): HTMLElement {
	const root = el("div", "radar-popup");
	root.appendChild(el("p", "radar-popup__title", "Radar fixe"));

	const list = el("dl", "radar-popup__list");
	const limitation =
		props.speedLimit != null ? `${props.speedLimit} km/h` : "Non renseignée";
	const typeLabel = RADAR_TYPE_LABELS[props.radarType] ?? props.radarType;

	appendFact(list, "Limitation", limitation);
	appendFact(list, "Type", typeLabel);
	appendFact(list, "En service", formatInServiceDuration(props.inServiceSince));

	root.appendChild(list);
	return root;
}
