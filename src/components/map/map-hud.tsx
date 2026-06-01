import { MapDataLoader } from "#/components/map/map-data-loader";
import { MapMenu } from "#/components/map/map-menu";

interface MapHudProps {
	layersOpen: boolean;
	rideabilityOpen: boolean;
}

export function MapHud({ layersOpen, rideabilityOpen }: MapHudProps) {
	return (
		<div className="map-app__hud-top pointer-events-none">
			<MapMenu layersOpen={layersOpen} rideabilityOpen={rideabilityOpen} />
			<MapDataLoader />
		</div>
	);
}
