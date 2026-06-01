import { Store } from "@tanstack/store";

import { LAYER_DEFINITIONS, type LayerId } from "#/types/layers";

function buildInitialEnabled(): Record<LayerId, boolean> {
	return Object.fromEntries(
		Object.values(LAYER_DEFINITIONS).map((l) => [l.id, l.defaultEnabled]),
	) as Record<LayerId, boolean>;
}

export interface LayersState {
	enabled: Record<LayerId, boolean>;
	panelOpen: boolean;
}

export const layersStore = new Store<LayersState>({
	enabled: buildInitialEnabled(),
	panelOpen: false,
});

export function toggleLayer(id: LayerId) {
	layersStore.setState((s) => ({
		...s,
		enabled: { ...s.enabled, [id]: !s.enabled[id] },
	}));
}

export function setLayerEnabled(id: LayerId, enabled: boolean) {
	layersStore.setState((s) => ({
		...s,
		enabled: { ...s.enabled, [id]: enabled },
	}));
}

export function setLayersPanelOpen(open: boolean) {
	layersStore.setState((s) => ({ ...s, panelOpen: open }));
}
