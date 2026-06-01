import { useStore } from "@tanstack/react-store";

import { mapStore } from "#/stores/map-store";

export function useMapStore<T>(
	selector: (state: typeof mapStore.state) => T,
): T {
	return useStore(mapStore, selector);
}
