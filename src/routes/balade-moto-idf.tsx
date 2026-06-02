import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/balade-moto-idf")({
	head: () =>
		buildGuideHead({
			path: "/balade-moto-idf",
			title: "Balade moto IDF : zones et créneaux recommandés",
			description:
				"Préparez votre balade moto en Île-de-France avec une carte météo, sinuosité, relief et radars pour choisir la bonne zone au bon moment.",
			articleTitle: "Balade moto IDF : choisir la bonne zone de sortie",
		}),
	component: BaladeMotoIdfPage,
});

function BaladeMotoIdfPage() {
	return (
		<SeoGuidePage
			eyebrow="Guide balade moto"
			title="Balade moto IDF : choisir la bonne zone de sortie"
			lead="Préparez une balade plus agréable en combinant météo motard, virages, relief et contexte routier sur la même carte."
			highlights={[
				"Préparation rapide en 2 minutes",
				"Comparaison de zones IDF",
				"Vision météo + route unifiée",
			]}
			ctaPrimary="Préparer ma balade maintenant"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Météo pour motard", to: "/meteo-pour-motard" },
				{ label: "Virage moto IDF", to: "/virage-moto-idf" },
				{ label: "Carte radars Paris", to: "/carte-radars-paris" },
				{ label: "Sortie moto week-end IDF", to: "/sortie-moto-weekend-idf" },
				{ label: "Sécurité moto pluie", to: "/securite-moto-pluie" },
			]}
			sections={[
				{
					title: "Repérer une zone qui donne envie de rouler",
					paragraphs: [
						"Une bonne balade moto en IDF commence par la zone, pas par un trajet figé. Zoomez sur plusieurs secteurs et comparez l’intérêt des routes en un coup d’oeil.",
						"Le calque sinuosité aide à trouver les routes plus tournantes, puis le relief permet d’identifier les portions un peu plus techniques.",
					],
				},
				{
					title: "Choisir le bon créneau météo",
					paragraphs: [
						"Avant de partir, vérifiez pluie, vent et luminosité. Vous évitez ainsi les créneaux les plus pénibles et ciblez une fenêtre de roulage plus confortable.",
						"Cette lecture rapide est utile pour les sorties courtes comme pour une demi-journée en grande couronne.",
					],
				},
				{
					title: "Rouler serein avec un contexte complet",
					paragraphs: [
						"Ajoutez les radars et les zones d’accidents historiques pour garder une vision plus complète de la route.",
						"La carte reste un outil de préparation : elle vous aide à décider, puis la conduite reste entre vos mains.",
					],
				},
			]}
		/>
	);
}
