import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";

import { TimeSlotPicker } from "#/components/panels/time-slot-picker";
import {
	GlassSheet,
	GlassSheetBody,
	GlassSheetContent,
	GlassSheetHeader,
} from "#/components/ui/glass-sheet";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import { isRideabilityGridLoading } from "#/features/rideability/loading";
import { rideabilityGridQueryOptions } from "#/features/rideability/queries";
import { useSheetSide } from "#/hooks/use-sheet-side";
import { cn } from "#/lib/utils";
import { setRideabilityPanelOpen } from "#/stores/rideability-store";

function formatSelectedTimeFull(d: Date) {
	return d.toLocaleString("fr-FR", {
		timeZone: "Europe/Paris",
		weekday: "long",
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function RideabilityPanel() {
	const open = useRideabilityStore((s) => s.panelOpen);
	const rideabilityOn = useLayersStore((s) => s.enabled.rideability);
	const weatherClassicOn = useLayersStore((s) => s.enabled.weatherClassic);
	const weatherModeOn = rideabilityOn || weatherClassicOn;
	const selectedAt = useRideabilityStore((s) => s.selectedAt);
	const { isFetching, isLoading, isError, data, isPlaceholderData } = useQuery({
		...rideabilityGridQueryOptions(selectedAt),
		enabled: weatherModeOn && open,
		placeholderData: (prev) => prev,
	});
	const hasData = Boolean(data?.samples?.length);
	const gridLoading = isRideabilityGridLoading(
		weatherModeOn,
		isLoading,
		isFetching,
		hasData,
		isPlaceholderData,
	);
	const sheetSide = useSheetSide();

	if (!weatherModeOn) return null;

	return (
		<GlassSheet open={open} onOpenChange={setRideabilityPanelOpen}>
			<GlassSheetContent
				side={sheetSide}
				showClose
				className={cn(
					"map-app__sheet",
					sheetSide === "bottom" && "map-app__sheet--bottom",
				)}
			>
				<GlassSheetHeader className="map-app__sheet-header">
					<p className="map-app__eyebrow">Météo & conditions</p>
					<h2 className="map-app__sheet-title">Roulabilité</h2>
					<p className="map-app__sheet-lead">
						Choisissez un créneau horaire pour mettre a jour la vue meteo.
					</p>
				</GlassSheetHeader>

				<GlassSheetBody className="map-app__sheet-body">
					{(gridLoading || isError) && (
						<output
							className={cn(
								"map-app__sheet-banner",
								isError && "map-app__sheet-banner--error",
							)}
							aria-live="polite"
						>
							{isError ? (
								"Météo indisponible — le dernier créneau affiché est conservé."
							) : (
								<>
									<Loader2
										className="map-app__sheet-banner-spinner"
										aria-hidden
									/>
									Mise à jour des prévisions…
								</>
							)}
						</output>
					)}

					<p className="map-app__sheet-current">
						<Clock
							className="map-app__sheet-current-icon"
							strokeWidth={2}
							aria-hidden
						/>
						<span>
							<span className="map-app__sheet-current-label">
								Créneau actif
							</span>
							{formatSelectedTimeFull(selectedAt)}
						</span>
					</p>

					<TimeSlotPicker selectedAt={selectedAt} />
				</GlassSheetBody>
			</GlassSheetContent>
		</GlassSheet>
	);
}
