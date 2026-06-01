import { useQuery } from "@tanstack/react-query";

import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import {
	isRideabilityGridLoading,
	rideabilityLoadingMessage,
} from "#/features/rideability/loading";
import { rideabilityGridQueryOptions } from "#/features/rideability/queries";

export function useMapDataLoading() {
	const mapReady = useMapStore((s) => s.isReady);
	const rideabilityOn = useLayersStore((s) => s.enabled.rideability);
	const selectedAt = useRideabilityStore((s) => s.selectedAt);

	const { isFetching, isLoading, isError, data, isPlaceholderData } = useQuery({
		...rideabilityGridQueryOptions(selectedAt),
		enabled: rideabilityOn,
		placeholderData: (prev) => prev,
	});

	const hasData = Boolean(data?.samples?.length);
	const rideabilityLoading = isRideabilityGridLoading(
		rideabilityOn,
		isLoading,
		isFetching,
		hasData,
		isPlaceholderData,
	);

	const visible = !mapReady || rideabilityLoading;

	return {
		visible,
		error: mapReady && rideabilityOn && isError && !rideabilityLoading,
		message: rideabilityLoadingMessage(
			mapReady,
			isLoading,
			hasData,
			isPlaceholderData,
		),
	};
}
