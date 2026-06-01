import { Loader2 } from "lucide-react";

import { useMapDataLoading } from "#/hooks/use-map-data-loading";
import { cn } from "#/lib/utils";

export function MapDataLoader() {
	const { visible, error, message } = useMapDataLoading();

	if (!visible && !error) return null;

	return (
		<output
			className={cn(
				"map-app__data-loader",
				visible && "map-app__data-loader--visible",
				error && "map-app__data-loader--error",
			)}
			aria-live="polite"
			aria-busy={visible}
		>
			{error ? (
				<>
					<span className="map-app__data-loader-dot" aria-hidden />
					<span>Météo indisponible</span>
				</>
			) : (
				<>
					<Loader2
						className="map-app__data-loader-spinner"
						strokeWidth={2.25}
						aria-hidden
					/>
					<span>{message}</span>
				</>
			)}
		</output>
	);
}
