import type { RideabilityLabel, RideabilityScore } from "./scoring";
import { labelFromScore, scoreToColor } from "./scoring";
import { buildZoneMiniRecap, zoneHeadline } from "./zone-popup-copy";

function el(tag: string, className: string, text?: string) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function appendRecapList(
	parent: HTMLElement,
	label: string,
	items: string[],
	modifier: "up" | "down",
) {
	if (items.length === 0) return;

	const block = el(
		"div",
		`zone-popup__recap-block zone-popup__recap-block--${modifier}`,
	);
	block.appendChild(el("span", "zone-popup__recap-label", label));

	const ul = el("ul", "zone-popup__recap-list");
	for (const text of items) {
		const li = el("li", "zone-popup__recap-item");
		li.appendChild(
			el("span", "zone-popup__recap-dot", modifier === "up" ? "+" : "−"),
		);
		li.appendChild(el("span", "zone-popup__recap-text", text));
		ul.appendChild(li);
	}
	block.appendChild(ul);
	parent.appendChild(block);
}

export function buildZonePopupElement(
	score: number,
	result: RideabilityScore | null | undefined,
	loading: boolean,
): HTMLElement {
	const root = el("div", "zone-popup");

	const head = el("div", "zone-popup__head");
	const badge = el("span", "zone-popup__badge", String(score));
	badge.style.backgroundColor = scoreToColor(score);
	head.appendChild(badge);

	const headText = el("div", "zone-popup__head-text");
	const label = result?.label ?? labelFromScore(score);
	headText.appendChild(
		el(
			"span",
			"zone-popup__title",
			loading ? "Analyse en cours…" : zoneHeadline(label),
		),
	);
	head.appendChild(headText);
	root.appendChild(head);

	if (loading) {
		root.appendChild(
			el("p", "zone-popup__hint", "Lecture des conditions pour cette zone…"),
		);
		return root;
	}

	if (!result) {
		root.appendChild(
			el(
				"p",
				"zone-popup__hint",
				"Impossible d’afficher le récap pour le moment.",
			),
		);
		return root;
	}

	const recap = buildZoneMiniRecap(score, result.factors);
	const body = el("div", "zone-popup__recap");
	body.appendChild(el("p", "zone-popup__recap-lead", recap.lead));

	appendRecapList(body, "Ce qui freine", recap.holds, "down");
	appendRecapList(body, "Ce qui joue en votre faveur", recap.helps, "up");

	if (recap.tip) {
		body.appendChild(el("p", "zone-popup__recap-tip", recap.tip));
	}

	root.appendChild(body);
	return root;
}

export function buildZoneQuickPopup(
	score: number,
	label?: RideabilityLabel,
): HTMLElement {
	const root = el("div", "zone-popup zone-popup--quick");
	const head = el("div", "zone-popup__head");
	const badge = el("span", "zone-popup__badge", String(score));
	badge.style.backgroundColor = scoreToColor(score);
	head.appendChild(badge);

	const headText = el("div", "zone-popup__head-text");
	const rideLabel = label ?? labelFromScore(score);
	headText.appendChild(
		el("span", "zone-popup__title", zoneHeadline(rideLabel)),
	);
	head.appendChild(headText);
	root.appendChild(head);

	root.appendChild(el("p", "zone-popup__hint", "Cliquez pour le mini récap"));
	return root;
}
