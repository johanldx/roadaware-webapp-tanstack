import { z } from "zod";

const forecastSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
	timezone: z.string(),
	hourly: z.object({
		time: z.array(z.string()),
		temperature_2m: z.array(z.number()),
		precipitation_probability: z.array(z.number()),
		precipitation: z.array(z.number()),
		wind_speed_10m: z.array(z.number()),
		cloud_cover: z.array(z.number()),
		is_day: z.array(z.number()),
		shortwave_radiation: z.array(z.number()).optional(),
	}),
	daily: z.object({
		time: z.array(z.string()),
		sunrise: z.array(z.string()),
		sunset: z.array(z.string()),
	}),
});

export type OpenMeteoForecast = z.infer<typeof forecastSchema>;

export async function fetchOpenMeteoForecast(
	lat: number,
	lng: number,
): Promise<OpenMeteoForecast> {
	const url = new URL("https://api.open-meteo.com/v1/forecast");
	url.searchParams.set("latitude", String(lat));
	url.searchParams.set("longitude", String(lng));
	url.searchParams.set(
		"hourly",
		[
			"temperature_2m",
			"precipitation_probability",
			"precipitation",
			"wind_speed_10m",
			"cloud_cover",
			"is_day",
			"shortwave_radiation",
		].join(","),
	);
	url.searchParams.set("daily", "sunrise,sunset");
	url.searchParams.set("timezone", "Europe/Paris");
	url.searchParams.set("forecast_days", "7");

	const res = await fetch(url);
	if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
	return forecastSchema.parse(await res.json());
}
