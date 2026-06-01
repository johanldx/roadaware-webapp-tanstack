export const queryKeys = {
	rideability: {
		all: ["rideability"] as const,
		at: (lat: number, lng: number, atKey: string) =>
			[...queryKeys.rideability.all, "point", lat, lng, atKey] as const,
	},
	weather: {
		all: ["weather"] as const,
		at: (lat: number, lng: number) =>
			[...queryKeys.weather.all, lat, lng] as const,
	},
	sun: {
		all: ["sun"] as const,
		at: (lat: number, lng: number) => [...queryKeys.sun.all, lat, lng] as const,
	},
	staticLayer: {
		sinuosity: (bboxKey: string) => ["layer", "sinuosity", bboxKey] as const,
		risk: (bboxKey: string) => ["layer", "risk", bboxKey] as const,
		radars: (bboxKey: string) => ["layer", "radars", bboxKey] as const,
	},
} as const;
