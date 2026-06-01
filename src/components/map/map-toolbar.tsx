import { LocateFixed, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { useMapStore } from "#/features/map/hooks/use-map-store";
import { cn } from "#/lib/utils";

function ToolbarBtn({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			onClick={onClick}
			className="map-app__toolbar-btn"
		>
			{children}
		</button>
	);
}

export function MapToolbar() {
	const map = useMapStore((s) => s.map);

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
			</div>
		</aside>
	);
}
