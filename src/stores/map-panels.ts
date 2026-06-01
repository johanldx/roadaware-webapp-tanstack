import { setLayersPanelOpen } from "#/stores/layers-store";
import { setRideabilityPanelOpen } from "#/stores/rideability-store";

export function openLayersPanel() {
	setRideabilityPanelOpen(false);
	setLayersPanelOpen(true);
}

export function openRideabilityPanel() {
	setLayersPanelOpen(false);
	setRideabilityPanelOpen(true);
}
