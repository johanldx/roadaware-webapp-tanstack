import {
	LocateFixed,
	Map as MapIcon,
	Minus,
	Plus,
	Satellite,
	Share2,
} from "lucide-react";
import type { ReactNode } from "react";

import { BASEMAP_LABELS } from "#/config/map";
import { useBasemapStore } from "#/features/map/hooks/use-basemap-store";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { cn } from "#/lib/utils";
import { toggleBasemapId } from "#/stores/basemap-store";

function ToolbarBtn({
	label,
	onClick,
	active,
	children,
}: {
	label: string;
	onClick: () => void;
	active?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"map-app__toolbar-btn",
				active && "map-app__toolbar-btn--active",
			)}
		>
			{children}
		</button>
	);
}

interface MapToolbarProps {
	onShare?: () => void;
}

export function MapToolbar({ onShare }: MapToolbarProps) {
	const map = useMapStore((s) => s.map);
	const basemapId = useBasemapStore((s) => s.basemapId);
	const isSatellite = basemapId === "satellite";
	const basemapMeta = BASEMAP_LABELS[basemapId];

	const zoomIn = () => map?.zoomIn({ duration: 280 });
	const zoomOut = () => map?.zoomOut({ duration: 280 });
	const locate = () => {
		if (!map || !navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				map.flyTo({
					center: [pos.coords.longitude, pos.coords.latitude],
					zoom: 11,
					duration: 1400,
					essential: true,
				});
			},
			() => undefined,
			{ enableHighAccuracy: true, timeout: 8000 },
		);
	};

	return (
		<aside
			className="map-app__toolbar glass-rise pointer-events-auto"
			aria-label="Zoom et position"
		>
			<div className="map-app__toolbar-card">
				<ToolbarBtn label="Zoom avant" onClick={zoomIn}>
					<Plus className="size-5" strokeWidth={2.25} />
				</ToolbarBtn>
				<div className="map-app__toolbar-sep" role="presentation" />
				<ToolbarBtn label="Zoom arrière" onClick={zoomOut}>
					<Minus className="size-5" strokeWidth={2.25} />
				</ToolbarBtn>
				<div
					className={cn("map-app__toolbar-sep", "map-app__toolbar-sep--block")}
					role="presentation"
				/>
				<ToolbarBtn label="Ma position" onClick={locate}>
					<LocateFixed className="size-5" strokeWidth={2} />
				</ToolbarBtn>
				<div
					className={cn("map-app__toolbar-sep", "map-app__toolbar-sep--block")}
					role="presentation"
				/>
				<ToolbarBtn
					label={basemapMeta.switchTo}
					active={isSatellite}
					onClick={toggleBasemapId}
				>
					{isSatellite ? (
						<MapIcon className="size-5" strokeWidth={2} />
					) : (
						<Satellite className="size-5" strokeWidth={2} />
					)}
				</ToolbarBtn>
				<div
					className={cn("map-app__toolbar-sep", "map-app__toolbar-sep--block")}
					role="presentation"
				/>
				<ToolbarBtn label="Partager cette vue" onClick={() => onShare?.()}>
					<Share2 className="size-5" strokeWidth={2} />
				</ToolbarBtn>
			</div>
		</aside>
	);
}
