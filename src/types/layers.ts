export type LayerId =
	| "sinuosity"
	| "rideability"
	| "radars"
	| "risk"
	| "relief";

export interface LayerDefinition {
	id: LayerId;
	label: string;
	description: string;
	/** Activé par défaut au chargement */
	defaultEnabled: boolean;
	/** Zoom minimum pour afficher le calque */
	minZoom: number;
	/** Disponible dans la version courante (feuille de route) */
	available: boolean;
}

export const LAYER_DEFINITIONS: Record<LayerId, LayerDefinition> = {
	sinuosity: {
		id: "sinuosity",
		label: "Sinuosité",
		description: "Virages sinueux en violet (routes principales OSM)",
		defaultEnabled: false,
		minZoom: 9,
		available: true,
	},
	rideability: {
		id: "rideability",
		label: "Roulabilité",
		description: "Carte colorée selon météo, lumière et conditions de ride",
		defaultEnabled: true,
		minZoom: 0,
		available: true,
	},
	radars: {
		id: "radars",
		label: "Radars",
		description: "Radars fixes officiels (VMA déc. 2025) — Île-de-France",
		defaultEnabled: false,
		minZoom: 7,
		available: true,
	},
	risk: {
		id: "risk",
		label: "Risque accident",
		description:
			"Historique BAAC moto : densité acc./km ; ratio TMJA si comptage proche",
		defaultEnabled: false,
		minZoom: 9,
		available: true,
	},
	relief: {
		id: "relief",
		label: "Relief",
		description:
			"Filtre relief : virages avec pente/dénivelé notable (gris clair → gris foncé)",
		defaultEnabled: false,
		minZoom: 9,
		available: true,
	},
};
