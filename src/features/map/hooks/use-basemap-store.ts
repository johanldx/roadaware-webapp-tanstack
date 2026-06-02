import { useStore } from "@tanstack/react-store";

import { basemapStore } from "#/stores/basemap-store";

export function useBasemapStore<T>(
	selector: (state: typeof basemapStore.state) => T,
): T {
	return useStore(basemapStore, selector);
}
