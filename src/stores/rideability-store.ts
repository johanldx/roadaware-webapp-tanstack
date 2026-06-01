import { Store } from "@tanstack/store";

import type { RideabilityGridCache } from "#/features/rideability/grid-cache";

export interface RideabilityState {
	/** Créneau sélectionné (heure pleine, Europe/Paris) */
	selectedAt: Date;
	/** Dernière grille chargée — popup zones alignée sur la carte */
	gridCache: RideabilityGridCache | null;
	panelOpen: boolean;
}

function startOfHour(d: Date) {
	const n = new Date(d);
	n.setMinutes(0, 0, 0);
	return n;
}

export const rideabilityStore = new Store<RideabilityState>({
	selectedAt: startOfHour(new Date()),
	gridCache: null,
	panelOpen: false,
});

export function setSelectedAt(at: Date) {
	rideabilityStore.setState({ selectedAt: startOfHour(at) });
}

export function setSelectedAtIso(iso: string) {
	setSelectedAt(new Date(iso));
}

export function setRideabilityGridCache(cache: RideabilityGridCache | null) {
	rideabilityStore.setState((s) => ({ ...s, gridCache: cache }));
}

export function setRideabilityPanelOpen(open: boolean) {
	rideabilityStore.setState((s) => ({ ...s, panelOpen: open }));
}
