/**
 * Scores relatifs (percentile) pour agrégats risque.
 */

export function enrichPercentilesBy(clusters, getValue) {
	const sorted = [...clusters].sort((a, b) => getValue(a) - getValue(b));
	const n = sorted.length;
	const rank = new Map();
	sorted.forEach((c, i) => {
		rank.set(c, n <= 1 ? 1 : (i + 1) / n);
	});
	return clusters.map((c) => ({
		...c,
		percentile: Math.round(rank.get(c) * 1000) / 1000,
	}));
}

/** Percentile sur le nombre brut d’accidents (référence). */
export function enrichPercentiles(clusters) {
	return enrichPercentilesBy(clusters, (c) => c.count);
}

export function riskLevelFromPercentile(percentile) {
	if (percentile >= 0.9) return 3;
	if (percentile >= 0.75) return 2;
	return 1;
}

export function riskScoreFromPercentile(percentile) {
	if (percentile < 0.55) return 0.3;
	return Math.round((0.35 + (percentile - 0.55) * 1.15) * 1000) / 1000;
}

/** Accidents par km de tronçon. */
export function accidentsPerKm(count, lengthM) {
	const km = Math.max(lengthM / 1000, 0.05);
	return Math.round((count / km) * 1000) / 1000;
}

/**
 * Accidents pour 100 M véh·km sur la période BAAC.
 * exposure = TMJA × longueur(km) × 365 × nb années
 */
export function accidentsPer100MVehKm(count, tmja, lengthM, yearSpan) {
	const km = Math.max(lengthM / 1000, 0.05);
	const years = Math.max(yearSpan, 1);
	const vehKm = tmja * km * 365 * years;
	if (vehKm <= 0) return null;
	return Math.round((count / vehKm) * 1e8 * 1000) / 1000;
}
