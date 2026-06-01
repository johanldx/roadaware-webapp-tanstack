import type { RideabilityFactor, RideabilityLabel } from "./scoring";
import { labelFromScore } from "./scoring";

export interface ZoneMiniRecap {
	/** Une phrase : pourquoi le score est là. */
	lead: string;
	/** Points forts (vide si rien de notable). */
	helps: string[];
	/** Points qui tirent le score vers le bas. */
	holds: string[];
	/** Conseil court optionnel. */
	tip?: string;
}

const THRESHOLD_HELP = 68;
const THRESHOLD_HOLD = 52;

export function zoneHeadline(label: RideabilityLabel): string {
	switch (label) {
		case "Idéal":
			return "Conditions idéales";
		case "Agréable":
			return "Belle période pour rouler";
		case "Correct":
			return "Roulable avec vigilance";
		case "Médiocre":
			return "Conditions mitigées";
		case "Déconseillé":
			return "Peu favorable à la moto";
	}
}

function extractTemp(detail: string): string | null {
	const m = /(-?\d+)\s*°C/.exec(detail);
	return m ? `${m[1]} °C` : null;
}

function extractMm(detail: string): string | null {
	const m = /([\d.]+)\s*mm/.exec(detail);
	return m ? `${m[1]} mm` : null;
}

function extractWind(detail: string): string | null {
	const m = /(\d+)\s*km\/h/.exec(detail);
	return m ? `${m[1]} km/h` : null;
}

function extractCloud(detail: string): string | null {
	const m = /(\d+)\s*%/.exec(detail);
	return m ? `${m[1]} % de nuages` : null;
}

function recapHelpLine(f: RideabilityFactor): string | null {
	switch (f.id) {
		case "temperature": {
			const t = extractTemp(f.detail);
			if (!t) return null;
			if (f.score >= 70) return `${t}, agréable à moto`;
			return null;
		}
		case "rain":
			if (f.score >= 75) return "Pas de pluie à prévoir";
			if (f.score >= 68) return "Peu de risque de pluie";
			return null;
		case "wind": {
			const w = extractWind(f.detail);
			if (!w || f.score < 68) return null;
			return f.score >= 90 ? `Vent très faible (${w})` : `Vent modéré (${w})`;
		}
		case "light":
			if (f.score >= 75) return "Bonne visibilité";
			if (f.score >= 68) return "Visibilité correcte";
			return null;
		case "sun":
			if (f.score >= 85) return "Belle lumière (golden hour ou jour clair)";
			if (f.score >= 70) return "Luminosité du jour favorable";
			return null;
		default:
			return null;
	}
}

function recapHoldLine(f: RideabilityFactor): string | null {
	switch (f.id) {
		case "temperature": {
			const t = extractTemp(f.detail);
			if (f.score < 35)
				return t
					? `${t}, trop froid pour rouler confortablement`
					: "Froid marqué";
			if (f.score < 52)
				return t ? `${t}, un peu frais — équipez-vous` : "Température basse";
			if (f.score < 68 && t) return `${t}, fraîcheur à prévoir`;
			return null;
		}
		case "rain": {
			const mm = extractMm(f.detail);
			if (f.score < 35)
				return mm
					? `Pluie prévue (${mm}) — sortie déconseillée`
					: "Forte pluie prévue";
			if (f.score < 52)
				return mm
					? `Pluie attendue (${mm}) — équipement imperméable`
					: "Risque de pluie élevé";
			if (f.score < 68) return "Risque de pluie à surveiller";
			return null;
		}
		case "wind": {
			const w = extractWind(f.detail);
			if (f.score < 35) return w ? `Vent fort (${w}) — prudence` : "Vent fort";
			if (f.score < 52) return w ? `Vent soutenu (${w})` : "Vent gênant";
			return null;
		}
		case "light": {
			const c = extractCloud(f.detail);
			if (f.score < 40) return "Nuit ou très faible luminosité";
			if (f.score < 52)
				return c ? `Ciel très couvert (${c})` : "Visibilité réduite";
			if (f.score < 68) return "Luminosité moyenne, restez attentif";
			return null;
		}
		case "sun":
			if (f.score < 40) return "Nuit — visibilité limitée";
			if (f.score < 52) return "Peu de lumière naturelle";
			return null;
		default:
			return null;
	}
}

function buildLead(score: number, helps: string[], holds: string[]): string {
	const label = labelFromScore(score);

	if (label === "Idéal" || label === "Agréable") {
		if (holds.length === 0) {
			return "Tout est réuni pour une belle balade sur ce créneau.";
		}
		if (holds.length === 1) {
			return `Globalement très bon, malgré un point à garder en tête.`;
		}
		return `Plutôt favorable, avec quelques réserves.`;
	}

	if (label === "Déconseillé") {
		if (holds.length >= 2) {
			return "Plusieurs conditions difficiles pour la moto en même temps.";
		}
		return holds[0]
			? `Ce créneau est difficile : ${holds[0].charAt(0).toLowerCase()}${holds[0].slice(1)}`
			: "Conditions peu adaptées à une sortie moto.";
	}

	if (holds.length > 0 && helps.length > 0) {
		return "Score moyen : certains éléments jouent en votre faveur, d’autres freinent la balade.";
	}
	if (holds.length > 0) {
		return "Le score est surtout tiré vers le bas par la météo sur ce créneau.";
	}
	if (helps.length > 0) {
		return "Pas de gros blocage, mais rien d’exceptionnel non plus.";
	}
	return "Conditions moyennes, sans point très marquant.";
}

function buildTip(holds: string[], score: number): string | undefined {
	const label = labelFromScore(score);
	const rainHold = holds.some((h) => h.toLowerCase().includes("pluie"));
	const coldHold = holds.some(
		(h) => h.toLowerCase().includes("froid") || h.includes("frais"),
	);
	const windHold = holds.some((h) => h.toLowerCase().includes("vent"));
	const nightHold = holds.some((h) => h.toLowerCase().includes("nuit"));

	if (label === "Déconseillé") {
		return "Envisagez un autre créneau ou une autre zone.";
	}
	if (rainHold) return "Prévoyez veste et gants imperméables.";
	if (coldHold) return "Pensez aux couches chaudes sous la veste.";
	if (windHold) return "Privilégiez routes abritées et allure modérée.";
	if (nightHold) return "Reportez si possible avant le lever du jour.";
	if (label === "Idéal" || label === "Agréable") return undefined;
	return "Une sortie courte reste envisageable si vous restez prudent.";
}

export function buildZoneMiniRecap(
	score: number,
	factors: RideabilityFactor[],
): ZoneMiniRecap {
	const helps = factors
		.filter((f) => f.score >= THRESHOLD_HELP)
		.map(recapHelpLine)
		.filter((line): line is string => line != null)
		.slice(0, 2);

	const holds = factors
		.filter((f) => f.score < THRESHOLD_HOLD)
		.sort((a, b) => a.score - b.score)
		.map(recapHoldLine)
		.filter((line): line is string => line != null)
		.slice(0, 2);

	const lead = buildLead(score, helps, holds);
	const tip = buildTip(holds, score);

	return { lead, helps, holds, tip };
}
