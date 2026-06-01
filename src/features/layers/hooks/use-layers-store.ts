import { useStore } from "@tanstack/react-store";

import { layersStore } from "#/stores/layers-store";

export function useLayersStore<T>(
	selector: (state: typeof layersStore.state) => T,
): T {
	return useStore(layersStore, selector);
}
