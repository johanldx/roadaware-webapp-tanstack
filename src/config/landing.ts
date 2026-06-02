/** Contenu éditorial de la landing — à personnaliser */

export const HERO_COPY = {
	subline:
		"Zoomez sur une zone : les belles routes, la météo et le bon créneau — en un coup d’œil. Pas de GPS, pas de compte, juste la carte.",
	ctaPrimary: "Partir voir la carte",
	ctaSecondary: "Comment ça marche",
	ctaTry: "Tester maintenant",
} as const;

export const CREATOR = {
	name: "Johan Ledoux",
	initials: "JL",
	/** Avatar GitHub (stable tant que le compte existe — lié à l’id, pas au pseudo) */
	photo: "https://avatars.githubusercontent.com/u/78117073?s=160",
	story:
		"Motard et développeur. J’ai construit Roadaware pour savoir quand et où sortir — avant de prendre la route. Je le partage avec mon asso moto, et avec tous ceux qui veulent la même chose : regarder une zone, pas un itinéraire.",
	github: "https://github.com/johanldx",
	linkedin: "https://www.linkedin.com/in/johanldx",
} as const;

export const HOW_IT_WORKS = [
	{
		title: "Ciblez une zone",
		description:
			"Pas d’adresse de départ ni d’arrivée. Vous explorez la carte comme sur un plan, l’app analyse le cadre visible.",
	},
	{
		title: "Lisez les calques",
		description:
			"Sinuosité, météo, radars ou historique d’accidents : un calque à la fois pour garder la carte lisible.",
	},
	{
		title: "Tranchez",
		description:
			"La question reste la même : est-ce le bon moment pour rouler ici — pas « comment y aller ».",
	},
] as const;

export const MAP_LAYERS = [
	{
		name: "Sinuosité",
		description:
			"Routes en nuances de violet : plus foncé = plus de virages (routes principales OSM).",
		tag: "Précalculé",
	},
	{
		name: "Relief",
		description:
			"Filtre relief : virages avec pente/dénivelé notable (niveau en nuances de gris).",
		tag: "Précalculé",
	},
	{
		name: "Roulabilité",
		description: "Pluie, vent, température et lumière — créneau par créneau.",
		tag: "Temps réel",
	},
	{
		name: "Radars",
		description: "Radars fixes officiels sur la zone affichée.",
		tag: "Officiel",
	},
	{
		name: "Risque accident",
		description:
			"Accidents moto déclarés (BAAC 2019–2024), agrégés par tronçon de route.",
		detail:
			"Couleur de la carte : densité en accidents par km (comparable sur tout l’IDF). Au clic : volume brut, densité, et — seulement sur une minorité de tronçons — ratio pondéré par le trafic TMJA.",
		tag: "BAAC",
	},
] as const;

/** Dernière export `pnpm data:risk` — affiché sur la landing pour être transparent. */
export const RISK_DATA_COVERAGE = {
	riskSegments: 1082,
	tmjaMatchedSegments: 131,
	tmjaMaxDistM: 500,
	years: "2019–2024",
} as const;

export const RISK_TMJA_NOTE = {
	title: "Pourquoi le trafic (TMJA) manque souvent",
	lead: "Le TMJA national ne couvre que les axes où l’État compte le trafic (autoroutes, nationales, rocades). Les routes de balade — celles qui nous intéressent le plus — sont rarement équipées.",
	bullets: [
		`Environ ${Math.round((RISK_DATA_COVERAGE.tmjaMatchedSegments / RISK_DATA_COVERAGE.riskSegments) * 100)} % des tronçons « risque » affichés ont un ratio TMJA (comptage à ≤ ${RISK_DATA_COVERAGE.tmjaMaxDistM} m).`,
		"Sans TMJA, la carte reste utile via la densité accidents/km — pas via un ratio trafic inventé.",
		"Dans l’app, le popup le dit clairement : « ratio trafic non disponible » sur la majorité des tronçons.",
	],
} as const;

export const DATA_SOURCES = [
	{
		name: "OpenStreetMap",
		href: "https://www.openstreetmap.org",
	},
	{
		name: "BAAC / ONISR",
		href: "https://www.data.gouv.fr/fr/datasets/bases-annuelles-des-accidents-corporels-routiers-baac/",
	},
	{
		name: "TMJA",
		href: "https://www.data.gouv.fr/fr/datasets/trafic-moyen-journalier-annuel-sur-le-reseau-routier-national/",
	},
	{
		name: "data.gouv",
		href: "https://www.data.gouv.fr",
	},
	{
		name: "Open-Meteo",
		href: "https://open-meteo.com",
	},
] as const;

export const FOOTER_NAV = [
	{ label: "Produit", href: "#produit" },
	{ label: "Fonctionnement", href: "#fonctionnement" },
	{ label: "Données", href: "#donnees" },
	{ label: "Projet", href: "#projet" },
	{ label: "Carte", href: "/app" },
	{ label: "Mentions légales", href: "/legal" },
	{ label: "CGU", href: "/legal#conditions" },
] as const;
