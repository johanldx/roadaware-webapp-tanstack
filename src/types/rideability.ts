export interface RideabilitySlot {
	hour: string;
	score: number;
	label: "poor" | "fair" | "good" | "great";
}

export interface RideabilityForecast {
	locationLabel: string;
	now: RideabilitySlot;
	bestWindow: { from: string; to: string; score: number } | null;
	slots: RideabilitySlot[];
	sunrise: string;
	sunset: string;
	goldenHourEnd?: string;
}
