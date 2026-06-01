import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { AppShell } from "#/components/layout/app-shell";
import { MapAppPending } from "#/components/map/map-app-pending";
import { MapHud } from "#/components/map/map-hud";
import { MapToolbar } from "#/components/map/map-toolbar";
import { MapView } from "#/components/map/map-view";
import { LayerPanel } from "#/components/panels/layer-panel";
import { RideabilityPanel } from "#/components/panels/rideability-panel";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import { useMapUrlSync } from "#/hooks/use-map-url-sync";

export const Route = createLazyFileRoute("/app")({
	pendingComponent: MapAppPending,
	component: MapPage,
});

function MapPage() {
	useMapUrlSync();
	useRideabilityUrlSync();
	const layersOpen = useLayersStore((s) => s.panelOpen);
	const rideabilityOpen = useRideabilityStore((s) => s.panelOpen);

	return (
		<AppShell
			overlay={
				<>
					<MapHud layersOpen={layersOpen} rideabilityOpen={rideabilityOpen} />
					<MapToolbar />
					<LayerPanel />
					<RideabilityPanel />
				</>
			}
		>
			<MapView />
		</AppShell>
	);
}

function useRideabilityUrlSync() {
	const selectedAt = useRideabilityStore((s) => s.selectedAt);
	const navigate = Route.useNavigate();
	const searchAt = Route.useSearch({ select: (s) => s.at });
	const skip = useRef(false);

	useEffect(() => {
		if (searchAt) skip.current = true;
	}, [searchAt]);

	useEffect(() => {
		if (skip.current) {
			skip.current = false;
			return;
		}
		navigate({
			search: (prev) => ({ ...prev, at: selectedAt.toISOString() }),
			replace: true,
		});
	}, [selectedAt, navigate]);
}
