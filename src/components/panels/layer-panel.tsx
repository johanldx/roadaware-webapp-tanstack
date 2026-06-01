import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Camera, CloudSun, Route } from "lucide-react";

import {
	GlassSheet,
	GlassSheetBody,
	GlassSheetContent,
	GlassSheetHeader,
} from "#/components/ui/glass-sheet";
import { Switch } from "#/components/ui/switch";
import { useLayersStore } from "#/features/layers/hooks/use-layers-store";
import { useSheetSide } from "#/hooks/use-sheet-side";
import { cn } from "#/lib/utils";
import { setLayerEnabled, setLayersPanelOpen } from "#/stores/layers-store";
import { setRideabilityPanelOpen } from "#/stores/rideability-store";
import { LAYER_DEFINITIONS, type LayerId } from "#/types/layers";

const LAYER_ICONS: Record<LayerId, LucideIcon> = {
	sinuosity: Route,
	rideability: CloudSun,
	radars: Camera,
	risk: AlertTriangle,
};

export function LayerPanel() {
	const open = useLayersStore((s) => s.panelOpen);
	const enabled = useLayersStore((s) => s.enabled);
	const sheetSide = useSheetSide();

	return (
		<GlassSheet open={open} onOpenChange={setLayersPanelOpen}>
			<GlassSheetContent
				side={sheetSide}
				showClose
				className={cn(
					"map-app__sheet",
					sheetSide === "bottom" && "map-app__sheet--bottom",
				)}
			>
				<GlassSheetHeader className="map-app__sheet-header">
					<p className="map-app__eyebrow">Affichage</p>
					<h2 className="map-app__sheet-title">Calques</h2>
					<p className="map-app__sheet-lead">
						Activez les données superposées à la carte.
					</p>
				</GlassSheetHeader>

				<GlassSheetBody className="map-app__sheet-body">
					<ul className="map-app__layer-list">
						{Object.values(LAYER_DEFINITIONS).map((layer) => (
							<LayerCard
								key={layer.id}
								id={layer.id}
								label={layer.label}
								description={layer.description}
								checked={enabled[layer.id]}
								disabled={!layer.available}
								onCheckedChange={(v) => {
									setLayerEnabled(layer.id, v);
									if (layer.id === "rideability" && !v) {
										setRideabilityPanelOpen(false);
									}
								}}
							/>
						))}
					</ul>
				</GlassSheetBody>
			</GlassSheetContent>
		</GlassSheet>
	);
}

function LayerCard({
	id,
	label,
	description,
	checked,
	disabled,
	onCheckedChange,
}: {
	id: LayerId;
	label: string;
	description: string;
	checked: boolean;
	disabled: boolean;
	onCheckedChange: (v: boolean) => void;
}) {
	const Icon = LAYER_ICONS[id];

	return (
		<li>
			<label
				htmlFor={`layer-${id}`}
				className={cn(
					"map-app__layer-card",
					checked && !disabled && "map-app__layer-card--on",
					disabled && "map-app__layer-card--disabled",
				)}
			>
				<span className="map-app__layer-icon" aria-hidden>
					<Icon className="size-[1.15rem]" strokeWidth={2} />
				</span>

				<span className="map-app__layer-text">
					<span className="map-app__layer-head">
						<span className="map-app__layer-label">{label}</span>
						{disabled && <span className="map-app__layer-badge">Bientôt</span>}
					</span>
					<span className="map-app__layer-desc">{description}</span>
				</span>

				<Switch
					id={`layer-${id}`}
					checked={checked}
					disabled={disabled}
					onCheckedChange={onCheckedChange}
					className="map-app__layer-switch shrink-0"
				/>
			</label>
		</li>
	);
}
