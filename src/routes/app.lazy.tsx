import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "#/components/layout/app-shell";
import { MapAppPending } from "#/components/map/map-app-pending";
import { MapHud } from "#/components/map/map-hud";
import { MapShareMenu } from "#/components/map/map-share-menu";
import { MapToolbar } from "#/components/map/map-toolbar";
import { MapView } from "#/components/map/map-view";
import { LayerPanel } from "#/components/panels/layer-panel";
import { RideabilityPanel } from "#/components/panels/rideability-panel";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import { useMapShareUrlSync } from "#/hooks/use-map-share-url-sync";

export const Route = createLazyFileRoute("/app")({
	pendingComponent: MapAppPending,
	component: MapPage,
});

function MapPage() {
	useMapShareUrlSync();
	const layersOpen = useLayersStore((s) => s.panelOpen);
	const rideabilityOpen = useRideabilityStore((s) => s.panelOpen);
	const [shareOpen, setShareOpen] = useState(false);

	return (
		<AppShell
			overlay={
				<>
					<MapHud layersOpen={layersOpen} rideabilityOpen={rideabilityOpen} />
					<MapToolbar onShare={() => setShareOpen(true)} />
					<MapShareMenu open={shareOpen} onClose={() => setShareOpen(false)} />
					<LayerPanel />
					<RideabilityPanel />
				</>
			}
		>
			<MapView />
		</AppShell>
	);
}
