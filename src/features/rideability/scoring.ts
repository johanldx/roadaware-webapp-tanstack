export type RideabilityLabel =
	| "Idéal"
	| "Agréable"
	| "Correct"
	| "Médiocre"
	| "Déconseillé";

export interface RideabilityFactor {
	id: "temperature" | "rain" | "wind" | "light" | "sun";
	label: string;
	score: number;
	detail: string;
}

export interface RideabilityScore {
	score: number;
	label: RideabilityLabel;
	factors: RideabilityFactor[];
}

export interface WeatherSnapshot {
	at: Date;
	temperatureC: number;
	precipitationMm: number;
	precipitationProbability: number;
	windSpeedKmh: number;
	cloudCoverPercent: number;
	isDay: boolean;
	shortwaveRadiation?: number;
	sunrise: Date;
	sunset: Date;
}

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
	if (x1 === x0) return y0;
	const t = clamp((x - x0) / (x1 - x0), 0, 1);
	return y0 + t * (y1 - y0);
}

function scoreTemperature(temp: number): { score: number; detail: string } {
	if (temp >= 14 && temp <= 25) {
		const dist = Math.abs(temp - 20);
		const score = Math.round(100 - dist * 4);
		return {
			score: clamp(score, 70, 100),
			detail: `${Math.round(temp)} °C — température confortable`,
		};
	}
	if (temp < 5) {
		return { score: 15, detail: `${Math.round(temp)} °C — trop froid` };
	}
	if (temp < 14) {
		return {
			score: Math.round(lerp(temp, 5, 14, 25, 75)),
			detail: `${Math.round(temp)} °C — frais, équipement chaud conseillé`,
		};
	}
	if (temp > 34) {
		return { score: 10, detail: `${Math.round(temp)} °C — chaleur écrasante` };
	}
	return {
		score: Math.round(lerp(temp, 25, 34, 65, 18)),
		detail: `${Math.round(temp)} °C — trop chaud pour rouler longtemps`,
	};
}

function scoreRain(
	prob: number,
	mm: number,
): { score: number; detail: string } {
	if (mm >= 8) {
		return { score: 2, detail: `Très forte pluie (~${mm.toFixed(1)} mm)` };
	}
	if (mm >= 4) {
		return { score: 5, detail: `Forte pluie (~${mm.toFixed(1)} mm)` };
	}
	if (mm >= 2) {
		return { score: 8, detail: `Pluie soutenue (~${mm.toFixed(1)} mm)` };
	}
	if (mm >= 1) {
		return { score: 14, detail: `Pluie active (~${mm.toFixed(1)} mm)` };
	}
	const wet = clamp(prob / 100, 0, 1) * 0.8 + clamp(mm / 1.2, 0, 1) * 0.2;
	const score = Math.round(100 * (1 - wet));
	if (prob >= 75) {
		return {
			score: Math.min(score, 22),
			detail:
				mm >= 0.2
					? `Pluie probable (${prob} %, ~${mm.toFixed(1)} mm)`
					: `Pluie probable (${prob} %) — créneau défavorable`,
		};
	}
	if (prob >= 55) {
		return {
			score: Math.min(score, 38),
			detail:
				mm >= 0.2
					? `Pluie à venir (${prob} %, ~${mm.toFixed(1)} mm)`
					: `Pluie à venir (${prob} %)`,
		};
	}
	if (prob >= 35) {
		return {
			score,
			detail:
				mm >= 0.2
					? `${prob} % de pluie prévu (~${mm.toFixed(1)} mm)`
					: `${prob} % de pluie prévu`,
		};
	}
	if (prob >= 20) {
		return { score, detail: `Risque de pluie modéré (${prob} %)` };
	}
	return {
		score,
		detail: prob > 0 ? `Peu de pluie (${prob} %)` : "Pas de pluie prévue",
	};
}

function scoreWind(kmh: number): { score: number; detail: string } {
	if (kmh <= 20) {
		return { score: 100, detail: `${Math.round(kmh)} km/h — vent faible` };
	}
	if (kmh >= 55) {
		return {
			score: 12,
			detail: `${Math.round(kmh)} km/h — vent fort, prudence`,
		};
	}
	const score = Math.round(lerp(kmh, 20, 55, 100, 15));
	return { score, detail: `${Math.round(kmh)} km/h — vent modéré` };
}

function hoursDiff(a: Date, b: Date) {
	return (a.getTime() - b.getTime()) / 3_600_000;
}

function scoreLightAndSun(
	at: Date,
	isDay: boolean,
	cloud: number,
	sunrise: Date,
	sunset: Date,
): { light: RideabilityFactor; sun: RideabilityFactor } {
	const untilSunset = hoursDiff(sunset, at);
	const afterSunset = hoursDiff(at, sunset);
	const untilSunrise = hoursDiff(sunrise, at);
	const afterSunrise = hoursDiff(at, sunrise);

	let lightScore = 50;
	let lightDetail = "Luminosité moyenne";

	if (!isDay) {
		if (afterSunset >= 0 && afterSunset < 1) {
			lightScore = 48;
			lightDetail = "Crépuscule — visibilité limitée";
		} else if (untilSunrise >= 0 && untilSunrise < 1) {
			lightScore = 52;
			lightDetail = "Aube — luminosité faible";
		} else {
			lightScore = 22;
			lightDetail = "Nuit — visibilité réduite";
		}
	} else {
		const clarity = 1 - cloud / 100;
		lightScore = Math.round(55 + clarity * 40);
		lightDetail =
			cloud <= 30
				? "Ciel dégagé — bonne visibilité"
				: cloud <= 70
					? `Nuages ${cloud} % — luminosité correcte`
					: `Très nuageux (${cloud} %) — luminosité basse`;
	}

	let sunScore = 70;
	let sunDetail = "Hors fenêtre coucher / lever";

	if (untilSunset > 0 && untilSunset <= 1.5) {
		const boost = Math.round(90 + (1 - untilSunset / 1.5) * 10);
		sunScore = clamp(boost, 85, 100);
		sunDetail =
			untilSunset <= 0.5
				? "Proche du coucher — golden hour"
				: "Avant le coucher — belle lumière rasante";
	} else if (afterSunrise >= 0 && afterSunrise <= 1) {
		sunScore = 82;
		sunDetail = "Après le lever — lumière douce";
	} else if (!isDay) {
		sunScore = 25;
		sunDetail = "Nuit — moins agréable à moto";
	} else if (untilSunset > 1.5 && untilSunset < 4) {
		sunScore = 75;
		sunDetail = "Journée — avant la golden hour";
	}

	return {
		light: {
			id: "light",
			label: "Luminosité",
			score: lightScore,
			detail: lightDetail,
		},
		sun: { id: "sun", label: "Soleil", score: sunScore, detail: sunDetail },
	};
}

export function labelFromScore(score: number): RideabilityLabel {
	if (score >= 82) return "Idéal";
	if (score >= 68) return "Agréable";
	if (score >= 52) return "Correct";
	if (score >= 36) return "Médiocre";
	return "Déconseillé";
}

const WEIGHTS = {
	temperature: 0.24,
	rain: 0.28,
	wind: 0.22,
	light: 0.18,
	sun: 0.08,
} as const;

export function computeRideabilityScore(
	weather: WeatherSnapshot,
): RideabilityScore {
	const temp = scoreTemperature(weather.temperatureC);
	const rain = scoreRain(
		weather.precipitationProbability,
		weather.precipitationMm,
	);
	const wind = scoreWind(weather.windSpeedKmh);
	const { light, sun } = scoreLightAndSun(
		weather.at,
		weather.isDay,
		weather.cloudCoverPercent,
		weather.sunrise,
		weather.sunset,
	);

	const factors: RideabilityFactor[] = [
		{
			id: "temperature",
			label: "Température",
			score: temp.score,
			detail: temp.detail,
		},
		{ id: "rain", label: "Pluie", score: rain.score, detail: rain.detail },
		{ id: "wind", label: "Vent", score: wind.score, detail: wind.detail },
		light,
		sun,
	];

	let score = Math.round(
		temp.score * WEIGHTS.temperature +
			rain.score * WEIGHTS.rain +
			wind.score * WEIGHTS.wind +
			light.score * WEIGHTS.light +
			sun.score * WEIGHTS.sun,
	);

	// En plein soleil, la chaleur devient vite pénible au-dessus de 25°C.
	if (
		weather.isDay &&
		weather.temperatureC > 25 &&
		(weather.shortwaveRadiation ?? 0) >= 350
	) {
		const heatPenalty = Math.round(lerp(weather.temperatureC, 25, 34, 6, 18));
		score -= heatPenalty;
	}

	if (weather.precipitationMm >= 1.5) {
		score = Math.min(score, 42);
	}
	if (weather.precipitationMm >= 3) {
		score = Math.min(score, 30);
	}
	if (weather.precipitationMm >= 6) {
		score = Math.min(score, 20);
	}
	if (weather.precipitationMm >= 10) {
		score = Math.min(score, 12);
	}
	if (weather.precipitationProbability >= 55) {
		score = Math.min(score, 48);
	}
	if (weather.precipitationProbability >= 75) {
		score = Math.min(score, 35);
	}

	return {
		score: clamp(score, 0, 100),
		label: labelFromScore(score),
		factors,
	};
}

/** Tons discrets type Apple pour l’UI */
export function scoreToColor(score: number): string {
	if (score >= 75) return "#34c759";
	if (score >= 60) return "#63c77b";
	if (score >= 45) return "#e5a800";
	if (score >= 30) return "#ff9f0a";
	return "#ff6961";
}
