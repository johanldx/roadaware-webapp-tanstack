/** Affiché pendant le chargement différé de la route /app (MapLibre, calques). */
export function MapAppPending() {
	return (
		<div className="map-app map-app--pending relative h-dvh w-full overflow-hidden">
			<div className="map-app__vignette" aria-hidden />
			<output className="map-app__pending" aria-live="polite">
				<span className="map-app__pending-spinner" aria-hidden />
				<span>Chargement de la carte…</span>
			</output>
		</div>
	);
}
