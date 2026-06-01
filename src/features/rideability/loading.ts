/** Loader HUD : carte pas prête, chargement initial ou changement de créneau. */
export function isRideabilityGridLoading(
	enabled: boolean,
	isLoading: boolean,
	isFetching: boolean,
	hasData: boolean,
	isPlaceholderData: boolean,
): boolean {
	if (!enabled) return false;
	if (isLoading) return true;
	if (!hasData && isFetching) return true;
	if (isFetching && isPlaceholderData) return true;
	return false;
}

export function rideabilityLoadingMessage(
	mapReady: boolean,
	isLoading: boolean,
	hasData: boolean,
	isPlaceholderData: boolean,
): string {
	if (!mapReady) return "Chargement de la carte…";
	if (isLoading || !hasData) return "Chargement des prévisions…";
	if (isPlaceholderData) return "Mise à jour du créneau…";
	return "Chargement des prévisions…";
}

/** Masquer le calque seulement avant la première grille (pas pendant un refetch avec cache). */
export function shouldHideRideabilityLayer(
	enabled: boolean,
	isLoading: boolean,
	hasData: boolean,
): boolean {
	return !enabled || (isLoading && !hasData);
}
