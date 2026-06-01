import { IDF_DISPLAY_GRID } from "#/config/region";

import type { GridCell } from "./grid";
import type { ScoreSampleDetail } from "./grid-cache";
import type { RideabilityFactor, RideabilityScore } from "./scoring";
import { labelFromScore } from "./scoring";

export interface ScoreSample {
	lat: number;
	lng: number;
	score: number;
}

function dist2(lat1: number, lng1: number, lat2: number, lng2: number) {
	const dLat = lat2 - lat1;
	const dLng = (lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180);
	return dLat * dLat + dLng * dLng;
}

export function interpolateScore(
	lat: number,
	lng: number,
	samples: ScoreSample[],
	power = 1.35,
): number {
	if (samples.length === 0) return 50;

	let num = 0;
	let den = 0;
	for (const s of samples) {
		const d = Math.sqrt(dist2(lat, lng, s.lat, s.lng));
		if (d < 0.0001) return s.score;
		const w = 1 / d ** power;
		num += w * s.score;
		den += w;
	}
	return num / den;
}

/** Lissage gaussien léger sur la grille — supprime l'effet damier */
function smoothGrid(
	raw: Map<string, number>,
	cells: GridCell[],
): Map<string, number> {
	const { cols, rows } = IDF_DISPLAY_GRID;
	const out = new Map<string, number>();

	for (const cell of cells) {
		const m = /^dr(\d+)c(\d+)$/.exec(cell.id);
		if (!m) {
			out.set(cell.id, raw.get(cell.id) ?? 50);
			continue;
		}
		const row = Number(m[1]);
		const col = Number(m[2]);
		let sum = 0;
		let wSum = 0;
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				const nr = row + dr;
				const nc = col + dc;
				if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
				const id = `dr${nr}c${nc}`;
				const w = dr === 0 && dc === 0 ? 4 : 1;
				sum += (raw.get(id) ?? 50) * w;
				wSum += w;
			}
		}
		out.set(cell.id, Math.round(sum / wSum));
	}

	return out;
}

export function interpolateDisplayScores(
	samples: ScoreSample[],
	displayCells: GridCell[],
): Map<string, number> {
	const raw = new Map<string, number>();
	for (const cell of displayCells) {
		raw.set(cell.id, Math.round(interpolateScore(cell.lat, cell.lng, samples)));
	}
	return smoothGrid(raw, displayCells);
}

const FACTOR_IDS = [
	"temperature",
	"rain",
	"wind",
	"light",
	"sun",
] as const satisfies readonly RideabilityFactor["id"][];

function nearestSample(
	lat: number,
	lng: number,
	samples: ScoreSampleDetail[],
): ScoreSampleDetail {
	const [first] = samples;
	if (first === undefined) {
		throw new Error("nearestSample requires at least one sample");
	}
	let best = first;
	let bestD = Infinity;
	for (const s of samples) {
		const d = dist2(lat, lng, s.lat, s.lng);
		if (d < bestD) {
			bestD = d;
			best = s;
		}
	}
	return best;
}

/**
 * Détail météo interpolé (même grille que la carte) — le score affiché
 * doit être imposé par l’agrégat zone pour rester cohérent avec la pastille.
 */
export function interpolateZoneRideability(
	lat: number,
	lng: number,
	samples: ScoreSampleDetail[],
	displayScore: number,
): RideabilityScore {
	if (samples.length === 0) {
		return {
			score: displayScore,
			label: labelFromScore(displayScore),
			factors: [],
		};
	}

	const nearest = nearestSample(lat, lng, samples);
	const factors: RideabilityFactor[] = FACTOR_IDS.map((id) => {
		const ref = nearest.result.factors.find((f) => f.id === id);
		if (!ref) {
			throw new Error(`facteur météo manquant : ${id}`);
		}
		const factorSamples: ScoreSample[] = samples.map((s) => ({
			lat: s.lat,
			lng: s.lng,
			score: s.result.factors.find((f) => f.id === id)?.score ?? 50,
		}));
		return {
			...ref,
			score: Math.round(interpolateScore(lat, lng, factorSamples)),
		};
	});

	return {
		score: displayScore,
		label: labelFromScore(displayScore),
		factors,
	};
}
