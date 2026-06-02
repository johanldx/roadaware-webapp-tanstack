/**
 * Lambert-93 (EPSG:2154) → WGS84 — métropole française.
 */

const E = 0.08181919106;
const N = 0.725607765053267;
const C = 11_754_255.426096;
const X0 = 700_000;
const Y0 = 12_655_612.049876;
const LON0 = (3 * Math.PI) / 180;

export function parseFrenchNumber(raw) {
	const n = Number(
		String(raw ?? "")
			.trim()
			.replace(",", "."),
	);
	return Number.isFinite(n) ? n : null;
}

/** @returns {[number, number]} [lng, lat] */
export function lambert93ToLngLat(x, y) {
	const r = Math.hypot(x - X0, y - Y0);
	const gamma = Math.atan2(x - X0, Y0 - y);
	const lon = LON0 + gamma / N;
	const latIso = (-1 / N) * Math.log(r / C);

	let phi = 2 * Math.atan(Math.exp(latIso)) - Math.PI / 2;
	for (let i = 0; i < 6; i++) {
		phi =
			2 *
				Math.atan(
					((1 + E * Math.sin(phi)) / (1 - E * Math.sin(phi))) ** (E / 2) *
						Math.exp(latIso),
				) -
			Math.PI / 2;
	}

	return [(lon * 180) / Math.PI, (phi * 180) / Math.PI];
}
