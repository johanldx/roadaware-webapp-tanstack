import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Camera, CloudSun, Mountain, Route } from "lucide-react";

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
	relief: Mountain,
};

const BETA_LAYER_IDS: LayerId[] = ["sinuosity", "risk", "relief"];

const ORDERED_LAYER_IDS: LayerId[] = [
	...Object.keys(LAYER_DEFINITIONS).filter(
		(id): id is LayerId => !BETA_LAYER_IDS.includes(id as LayerId),
	),
	...BETA_LAYER_IDS,
];

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
						{ORDERED_LAYER_IDS.map((layerId) => {
							const layer = LAYER_DEFINITIONS[layerId];
							return (
								<LayerCard
									key={layer.id}
									id={layer.id}
									label={layer.label}
									description={layer.description}
									checked={enabled[layer.id]}
									disabled={!layer.available}
									onCheckedChange={(v) => {
										setLayerEnabled(layer.id, v);
										// Relief et sinuosité affichent des infos proches : éviter la soupe visuelle.
										if (layer.id === "relief" && v) {
											setLayerEnabled("sinuosity", false);
										}
										if (layer.id === "sinuosity" && v) {
											setLayerEnabled("relief", false);
										}
										if (layer.id === "rideability" && !v) {
											setRideabilityPanelOpen(false);
										}
									}}
								/>
							);
						})}
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
						{BETA_LAYER_IDS.includes(id) && (
							<span className="map-app__layer-badge map-app__layer-badge--beta">
								BETA
							</span>
						)}
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
