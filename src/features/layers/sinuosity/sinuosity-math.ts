/** Coordonnées [longitude, latitude] */
export type LngLat = [number, number];

/** Seuil minimal pour afficher un tronçon (dégradé violet) */
export const SINUOSITY_DISPLAY_MIN = 0.62;

const EARTH_RADIUS_M = 6_371_000;
const MIN_SIGNIFICANT_TURNS = 2;
const MIN_PATH_M = 200;
const MIN_STRAIGHT_M = 80;

const MOTORWAY_TYPES = new Set([
	"motorway",
	"trunk",
	"motorway_link",
	"trunk_link",
]);

const MAIN_ROAD_TYPES = new Set(["primary", "secondary"]);

export function distanceMeters(a: LngLat, b: LngLat): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const [lng1, lat1] = a;
	const [lng2, lat2] = b;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const x =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function pathLengthMeters(coords: LngLat[]): number {
	let sum = 0;
	for (let i = 1; i < coords.length; i++) {
		const a = coords[i - 1];
		const b = coords[i];
		if (a === undefined || b === undefined) continue;
		sum += distanceMeters(a, b);
	}
	return sum;
}

function bearingDegrees(a: LngLat, b: LngLat): number {
	const [lng1, lat1] = a;
	const [lng2, lat2] = b;
	const y =
		Math.sin(((lng2 - lng1) * Math.PI) / 180) *
		Math.cos((lat2 * Math.PI) / 180);
	const x =
		Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
		Math.sin((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.cos(((lng2 - lng1) * Math.PI) / 180);
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function densifyStepM(highway?: string): number {
	if (highway && MOTORWAY_TYPES.has(highway)) return 12;
	if (highway && MAIN_ROAD_TYPES.has(highway)) return 15;
	return 20;
}

function significantTurnDeg(highway?: string): number {
	if (highway && MOTORWAY_TYPES.has(highway)) return 10;
	if (highway && MAIN_ROAD_TYPES.has(highway)) return 12;
	return 15;
}

export function densifyCoords(coords: LngLat[], stepM = 15): LngLat[] {
	if (coords.length < 2) return coords;
	const first = coords[0];
	if (first === undefined) return coords;
	const out: LngLat[] = [first];
	for (let i = 1; i < coords.length; i++) {
		const a = coords[i - 1];
		const b = coords[i];
		if (a === undefined || b === undefined) continue;
		const segLen = distanceMeters(a, b);
		const steps = Math.max(1, Math.ceil(segLen / stepM));
		for (let s = 1; s <= steps; s++) {
			const t = s / steps;
			out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
		}
	}
	return out;
}

export interface CurvatureMetrics {
	ratio: number;
	turnDensity: number;
	pathM: number;
	significantTurns: number;
	maxTurn: number;
}

/** Sinuosité v4 : densification OSM + seuils adaptés voies rapides. */
export function computeCurvatureMetrics(
	coords: LngLat[],
	minLengthM = MIN_PATH_M,
	highway?: string,
): CurvatureMetrics | null {
	if (coords.length < 2) return null;

	const dense = densifyCoords(coords, densifyStepM(highway));
	if (dense.length < 3) return null;

	const pathM = pathLengthMeters(dense);
	const start = dense[0];
	const end = dense[dense.length - 1];
	if (start === undefined || end === undefined) return null;
	const straight = distanceMeters(start, end);
	if (pathM < minLengthM || straight < MIN_STRAIGHT_M) return null;

	const turnDeg = significantTurnDeg(highway);
	let significantTurnSum = 0;
	let significantTurns = 0;
	let maxTurn = 0;
	let prevBearing: number | null = null;

	for (let i = 1; i < dense.length; i++) {
		const a = dense[i - 1];
		const bPt = dense[i];
		if (a === undefined || bPt === undefined) continue;
		const b = bearingDegrees(a, bPt);
		if (prevBearing != null) {
			let delta = Math.abs(b - prevBearing);
			if (delta > 180) delta = 360 - delta;
			if (delta >= turnDeg) {
				significantTurnSum += delta;
				significantTurns++;
				if (delta > maxTurn) maxTurn = delta;
			}
		}
		prevBearing = b;
	}

	const pathKm = pathM / 1000;
	if (pathKm < 0.05 || significantTurns < MIN_SIGNIFICANT_TURNS) return null;

	return {
		ratio: pathM / Math.max(straight, 1),
		turnDensity: significantTurnSum / pathKm,
		pathM,
		significantTurns,
		maxTurn,
	};
}

export function metricsToScore(metrics: CurvatureMetrics): number {
	const ratioPart = Math.min(1, Math.max(0, (metrics.ratio - 1.06) / 0.34));
	const turnPart = Math.min(1, Math.max(0, (metrics.turnDensity - 32) / 60));
	return Math.round((ratioPart * 0.3 + turnPart * 0.7) * 1000) / 1000;
}

export function sinuosityScoreForCoords(
	coords: LngLat[],
	minLengthM = MIN_PATH_M,
	highway?: string,
): number | null {
	const m = computeCurvatureMetrics(coords, minLengthM, highway);
	if (!m) return null;
	return metricsToScore(m);
}

export function passesQualityGate(
	metrics: CurvatureMetrics,
	highway?: string,
): boolean {
	if (metrics.significantTurns < MIN_SIGNIFICANT_TURNS) return false;
	if (metrics.pathM < MIN_PATH_M) return false;

	const minDensity = highway && MOTORWAY_TYPES.has(highway) ? 32 : 40;
	if (metrics.turnDensity < minDensity) return false;

	const minMaxTurn = highway && MOTORWAY_TYPES.has(highway) ? 14 : 18;
	if (metrics.maxTurn < minMaxTurn && metrics.turnDensity < 48) return false;

	if (metrics.ratio < 1.04 && metrics.turnDensity < 45) return false;

	return true;
}

export function shouldDisplayScore(score: number, highway?: string): boolean {
	const min =
		highway && MOTORWAY_TYPES.has(highway) ? 0.68 : SINUOSITY_DISPLAY_MIN;
	return score >= min;
}

export interface SegmentOptions {
	minSegmentM?: number;
	maxSegmentM?: number;
	minLengthM?: number;
	highway?: string;
}

export function segmentizeAndScore(
	coords: LngLat[],
	opts: SegmentOptions = {},
): { coords: LngLat[]; score: number }[] {
	const minSegmentM = opts.minSegmentM ?? 200;
	const maxSegmentM = opts.maxSegmentM ?? 1000;
	const minLengthM = opts.minLengthM ?? MIN_PATH_M;
	const highway = opts.highway;

	if (coords.length < 2) return [];

	const out: { coords: LngLat[]; score: number }[] = [];
	let startIdx = 0;
	let acc = 0;

	for (let i = 1; i < coords.length; i++) {
		const a = coords[i - 1];
		const b = coords[i];
		if (a === undefined || b === undefined) continue;
		acc += distanceMeters(a, b);
		const isLast = i === coords.length - 1;
		if (acc >= maxSegmentM || isLast) {
			const seg = coords.slice(startIdx, i + 1);
			const metrics = computeCurvatureMetrics(seg, minLengthM, highway);
			const score = metrics ? metricsToScore(metrics) : null;
			if (
				score != null &&
				metrics &&
				pathLengthMeters(seg) >= minSegmentM &&
				shouldDisplayScore(score, highway) &&
				passesQualityGate(metrics, highway)
			) {
				out.push({ coords: seg, score });
			}
			startIdx = i;
			acc = 0;
		}
	}

	return out;
}
