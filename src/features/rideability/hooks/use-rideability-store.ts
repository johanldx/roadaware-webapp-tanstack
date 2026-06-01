import { useStore } from "@tanstack/react-store";

import { rideabilityStore } from "#/stores/rideability-store";

export function useRideabilityStore<T>(
	selector: (state: typeof rideabilityStore.state) => T,
): T {
	return useStore(rideabilityStore, selector);
}
