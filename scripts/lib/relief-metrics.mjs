import { elevationAt } from "./elevation-grid.mjs";
import { distanceMeters, pathLengthMeters } from "./geo-distance.mjs";

const MIN_LENGTH_M = 260;
const MIN_SINUOSITY = 0.35;
/** Seuil de sortie "dense mais propre" pour mieux couvrir l'IDF. */
export const RELIEF_DISPLAY_MIN = 0.36;
const SCORE_CAP_GRADE = 7.5;
const SCORE_CAP_RANGE = 45;

function sampleCoordsByDistance(coords, stepMeters = 55) {
	if (coords.length < 2) return coords;
	const out = [coords[0]];
	let acc = 0;
	for (let i = 1; i < coords.length; i++) {
		const prev = coords[i - 1];
		const cur = coords[i];
		if (!prev || !cur) continue;
		acc += distanceMeters(prev, cur);
		if (acc >= stepMeters) {
			out.push(cur);
			acc = 0;
		}
	}
	const last = coords[coords.length - 1];
	if (last && out[out.length - 1] !== last) out.push(last);
	return out;
}

function median(values) {
	if (!values.length) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
	return sorted[mid];
}

function smoothSeries(values) {
	if (values.length < 3) return values;
	const out = values.slice();
	for (let i = 1; i < values.length - 1; i++) {
		out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
	}
	return out;
}

/**
 * Score 0–1 : relief "fiable" sur segment sinueux (pente médiane + dénivelé local).
 * @param {{ step: number, points: { lat: number, lng: number, elev: number }[] }} grid
 * @param {import('geojson').Position[]} coords
 * @param {number} sinuosity
 */
export function reliefScoreForCoords(grid, coords, sinuosity = 0) {
	const len = pathLengthMeters(coords);
	if (len < MIN_LENGTH_M) return 0;

	const sampled = sampleCoordsByDistance(coords, 55);
	if (sampled.length < 3) return 0;

	const rawElevs = sampled.map(([lng, lat]) => elevationAt(grid, lat, lng));
	const elevs = smoothSeries(rawElevs);
	const grades = [];
	let positiveClimb = 0;

	for (let i = 1; i < sampled.length; i++) {
		const a = sampled[i - 1];
		const b = sampled[i];
		if (!a || !b) continue;
		const dist = Math.max(1, distanceMeters(a, b));
		const diff = elevs[i] - elevs[i - 1];
		const gradeAbsPct = (Math.abs(diff) / dist) * 100;
		grades.push(gradeAbsPct);
		if (diff > 0) positiveClimb += diff;
	}
	if (!grades.length) return 0;

	const medianGrade = median(grades);
	const localRange = Math.max(...elevs) - Math.min(...elevs);
	const climbPct = (positiveClimb / len) * 100;

	// Garde-fou "relief réel" pour éviter les faux positifs plats.
	if (medianGrade < 1.6 && localRange < 18 && climbPct < 1.2) return 0;

	const rangeNorm = Math.min(1, localRange / SCORE_CAP_RANGE);
	const gradeNorm = Math.min(1, medianGrade / SCORE_CAP_GRADE);
	const climbNorm = Math.min(1, climbPct / 4.5);
	const sinNorm = Math.min(1, Math.max(0, (sinuosity - MIN_SINUOSITY) / 0.34));

	// On privilégie le relief réel, la sinuosité sert de garde-fou.
	return Math.min(
		1,
		gradeNorm * 0.45 + rangeNorm * 0.3 + climbNorm * 0.15 + sinNorm * 0.1,
	);
}

export function simplifyCoords(coords, maxPts = 24) {
	if (coords.length <= maxPts) return coords;
	const out = [coords[0]];
	const step = (coords.length - 1) / (maxPts - 1);
	for (let i = 1; i < maxPts - 1; i++) {
		out.push(coords[Math.round(i * step)]);
	}
	out.push(coords[coords.length - 1]);
	return out;
}
