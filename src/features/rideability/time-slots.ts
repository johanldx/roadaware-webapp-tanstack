const PARIS_TZ = "Europe/Paris";

export interface TimeSlot {
	at: Date;
	iso: string;
	label: string;
	dayLabel: string;
	isNow: boolean;
}

function formatDay(d: Date, now: Date): string {
	const key = (x: Date) =>
		x.toLocaleDateString("sv-SE", { timeZone: PARIS_TZ });
	const today = key(now);
	const tomorrow = key(new Date(now.getTime() + 86_400_000));
	const slotDay = key(d);

	if (slotDay === today) return "Aujourd'hui";
	if (slotDay === tomorrow) return "Demain";
	return d.toLocaleDateString("fr-FR", {
		timeZone: PARIS_TZ,
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

function formatHour(d: Date): string {
	return d.toLocaleTimeString("fr-FR", {
		timeZone: PARIS_TZ,
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Créneaux horaires sur les 7 prochains jours */
export function buildTimeSlots(now = new Date()): TimeSlot[] {
	const start = new Date(now);
	start.setMinutes(0, 0, 0);

	const slots: TimeSlot[] = [];
	const end = new Date(start.getTime() + 7 * 24 * 3_600_000);
	const currentHour = start.getTime();

	for (let t = currentHour; t < end.getTime(); t += 3_600_000) {
		const at = new Date(t);
		const isNow =
			Math.abs(at.getTime() - now.getTime()) < 45 * 60_000 &&
			at.getHours() === now.getHours();

		slots.push({
			at,
			iso: at.toISOString(),
			label: formatHour(at),
			dayLabel: formatDay(at, now),
			isNow,
		});
	}

	return slots;
}
