import type { OpenMeteoForecast } from "#/lib/api/open-meteo";

import type { WeatherSnapshot } from "./scoring";

const PARIS_TZ = "Europe/Paris";

function parseSunTime(iso: string, ref: Date): Date {
	const d = new Date(iso);
	if (d.getTime() < ref.getTime() - 12 * 3_600_000) {
		d.setDate(d.getDate() + 1);
	}
	return d;
}

function dayKeyParis(d: Date): string {
	return d.toLocaleDateString("sv-SE", { timeZone: PARIS_TZ });
}

/** Clé horaire alignée sur le format Open-Meteo (Europe/Paris), ex. 2024-06-01T14:00 */
export function parisHourKey(d: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: PARIS_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hour12: false,
	}).formatToParts(d);

	const y = parts.find((p) => p.type === "year")?.value;
	const mo = parts.find((p) => p.type === "month")?.value;
	const da = parts.find((p) => p.type === "day")?.value;
	const h = parts.find((p) => p.type === "hour")?.value;
	return `${y}-${mo}-${da}T${h}:00`;
}

export function weatherSnapshotAt(
	forecast: OpenMeteoForecast,
	at: Date,
): WeatherSnapshot | null {
	const { hourly, daily } = forecast;
	const targetKey = parisHourKey(at);

	let bestIdx = hourly.time.findIndex(
		(t) => t === targetKey || t.startsWith(targetKey.slice(0, 13)),
	);

	if (bestIdx < 0) {
		let bestDiff = Number.POSITIVE_INFINITY;
		const targetMs = new Date(targetKey).getTime();
		for (let i = 0; i < hourly.time.length; i++) {
			const t = hourly.time[i];
			if (t === undefined) continue;
			const diff = Math.abs(new Date(t).getTime() - targetMs);
			if (diff < bestDiff) {
				bestDiff = diff;
				bestIdx = i;
			}
		}
		if (bestIdx < 0 || bestDiff > 3 * 60 * 60_000) return null;
	}

	const dayKey = dayKeyParis(at);
	const dayIdx = daily.time.findIndex((t) => t.startsWith(dayKey));
	if (dayIdx < 0) return null;

	const sunriseIso = daily.sunrise[dayIdx];
	const sunsetIso = daily.sunset[dayIdx];
	const temperatureC = hourly.temperature_2m[bestIdx];
	const windSpeedKmh = hourly.wind_speed_10m[bestIdx];
	if (
		sunriseIso === undefined ||
		sunsetIso === undefined ||
		temperatureC === undefined ||
		windSpeedKmh === undefined
	) {
		return null;
	}

	const sunrise = parseSunTime(sunriseIso, at);
	const sunset = parseSunTime(sunsetIso, at);

	return {
		at,
		temperatureC,
		precipitationMm: hourly.precipitation[bestIdx] ?? 0,
		precipitationProbability: hourly.precipitation_probability[bestIdx] ?? 0,
		windSpeedKmh,
		cloudCoverPercent: hourly.cloud_cover[bestIdx] ?? 50,
		isDay: (hourly.is_day[bestIdx] ?? 1) === 1,
		shortwaveRadiation: hourly.shortwave_radiation?.[bestIdx],
		sunrise,
		sunset,
	};
}
