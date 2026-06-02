import { Link } from "@tanstack/react-router";
import { Clock, Home, Layers } from "lucide-react";

import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME } from "#/config/app";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useRideabilityStore } from "#/features/rideability/hooks/use-rideability-store";
import { cn } from "#/lib/utils";
import { openLayersPanel, openRideabilityPanel } from "#/stores/map-panels";

function formatSelectedTimeShort(d: Date) {
	const date = new Intl.DateTimeFormat("fr-FR", {
		timeZone: "Europe/Paris",
		day: "numeric",
		month: "short",
	}).format(d);
	const time = new Intl.DateTimeFormat("fr-FR", {
		timeZone: "Europe/Paris",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(d);
	return `${date} · ${time}`;
}

interface MapMenuProps {
	layersOpen: boolean;
	rideabilityOpen: boolean;
}

export function MapMenu({ layersOpen, rideabilityOpen }: MapMenuProps) {
	const rideabilityOn = useLayersStore((s) => s.enabled.rideability);
	const weatherClassicOn = useLayersStore((s) => s.enabled.weatherClassic);
	const weatherModeOn = rideabilityOn || weatherClassicOn;
	const selectedAt = useRideabilityStore((s) => s.selectedAt);

	return (
		<nav
			className="map-app__float-menu glass-rise pointer-events-auto"
			aria-label="Menu carte"
		>
			<Link
				to="/"
				className="map-app__float-brand"
				title={`${APP_NAME} — accueil`}
			>
				<span className="brand-logo-mark" aria-hidden />
				<span className="map-app__float-brand-name">{APP_NAME}</span>
				<BetaBadge variant="map" />
			</Link>

			<span className="map-app__float-sep" aria-hidden />

			{weatherModeOn && (
				<>
					<button
						type="button"
						className={cn(
							"map-app__float-btn",
							rideabilityOpen && "map-app__float-btn--active",
						)}
						aria-pressed={rideabilityOpen}
						title={`Meteo · ${formatSelectedTimeShort(selectedAt)}`}
						onClick={openRideabilityPanel}
					>
						<Clock className="size-[1.05rem]" strokeWidth={2} aria-hidden />
						<span className="sr-only">
							Meteo, {formatSelectedTimeShort(selectedAt)}
						</span>
					</button>
					<span className="map-app__float-time" aria-live="polite">
						{formatSelectedTimeShort(selectedAt)}
					</span>
				</>
			)}

			<button
				type="button"
				className={cn(
					"map-app__float-btn",
					layersOpen && "map-app__float-btn--active",
				)}
				aria-pressed={layersOpen}
				title="Calques de la carte"
				onClick={openLayersPanel}
			>
				<Layers className="size-[1.05rem]" strokeWidth={2} aria-hidden />
				<span className="sr-only">Calques</span>
			</button>

			<Link to="/" className="map-app__float-btn" title="Retour à l'accueil">
				<Home className="size-[1.05rem]" strokeWidth={2} aria-hidden />
				<span className="sr-only">Accueil</span>
			</Link>
		</nav>
	);
}
