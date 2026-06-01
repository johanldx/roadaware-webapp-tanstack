import { useMemo } from "react";

import { buildTimeSlots } from "#/features/rideability/time-slots";
import { cn } from "#/lib/utils";
import { setSelectedAt } from "#/stores/rideability-store";

interface TimeSlotPickerProps {
	selectedAt: Date;
}

/** Créneaux des prochaines 36 h seulement — moins de scroll */
export function TimeSlotPicker({ selectedAt }: TimeSlotPickerProps) {
	const selectedKey = selectedAt.toISOString();

	const slots = useMemo(() => {
		const all = buildTimeSlots();
		const end = Date.now() + 36 * 3_600_000;
		return all.filter((s) => s.at.getTime() <= end);
	}, []);

	const nowSlot = slots.find((s) => s.isNow);

	return (
		<div className="map-app__time-picker">
			{nowSlot && (
				<button
					type="button"
					className="map-app__pill map-app__pill--primary map-app__pill--block"
					onClick={() => setSelectedAt(nowSlot.at)}
				>
					Maintenant
				</button>
			)}

			<div
				className="map-app__time-scroll"
				role="listbox"
				aria-label="Créneaux horaires"
			>
				{slots.map((slot) => {
					const active = slot.iso === selectedKey;
					return (
						<button
							key={slot.iso}
							type="button"
							role="option"
							aria-selected={active}
							onClick={() => setSelectedAt(slot.at)}
							className={cn(
								"map-app__time-slot",
								active && "map-app__time-slot--active",
							)}
						>
							<span className="map-app__time-slot-day">{slot.dayLabel}</span>
							<span className="map-app__time-slot-hour">{slot.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
