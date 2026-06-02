import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/meteo-pour-motard")({
	head: () =>
		buildGuideHead({
			path: "/meteo-pour-motard",
			title: "Météo pour motard en IDF : pluie, vent, créneau",
			description:
				"Consultez une météo pour motard en Île-de-France : pluie, vent, température et luminosité par créneau pour choisir quand rouler.",
			articleTitle: "Météo pour motard en Île-de-France",
		}),
	component: MeteoPourMotardPage,
});

function MeteoPourMotardPage() {
	return (
		<SeoGuidePage
			eyebrow="Guide météo moto"
			title="Météo pour motard en Île-de-France"
			lead="Préparez vos sorties moto avec une météo orientée terrain : pluie, vent, température et luminosité, zone par zone en IDF."
			highlights={[
				"Pluie et vent en un coup d’oeil",
				"Créneaux horaires comparables",
				"Vue Paris + grande couronne",
			]}
			ctaPrimary="Voir la météo moto en direct"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Carte radars Paris", to: "/carte-radars-paris" },
				{ label: "Virage moto IDF", to: "/virage-moto-idf" },
				{ label: "Balade moto IDF", to: "/balade-moto-idf" },
				{ label: "Sortie moto week-end IDF", to: "/sortie-moto-weekend-idf" },
				{ label: "Sécurité moto pluie", to: "/securite-moto-pluie" },
			]}
			sections={[
				{
					title: "Rouler au bon moment, pas au hasard",
					paragraphs: [
						"La météo pour motard de Roadaware répond à la vraie question avant de démarrer : est-ce un bon créneau pour cette zone ?",
						"Vous n’avez pas besoin de préparer un itinéraire complet : zoomez sur votre secteur, comparez les heures et partez quand les conditions deviennent favorables.",
					],
				},
				{
					title: "Une lecture utile sur la route",
					paragraphs: [
						"Le score météo combine pluie, vent, température, luminosité et moment de la journée. L’objectif : comparer des fenêtres de roulage rapidement.",
						"Ce n’est pas une promesse absolue, c’est un avantage pratique pour choisir un départ plus serein et éviter les créneaux les plus pénibles.",
					],
				},
				{
					title: "Paris, petite couronne et balades plus loin",
					paragraphs: [
						"La carte couvre toute l’Île-de-France : Paris, petite couronne, Vallée de Chevreuse, Vexin, Brie et axes de liaison.",
						"En 30 secondes, vous pouvez identifier une heure plus sèche, moins ventée et mieux éclairée pour profiter de la route.",
					],
				},
			]}
		/>
	);
}
