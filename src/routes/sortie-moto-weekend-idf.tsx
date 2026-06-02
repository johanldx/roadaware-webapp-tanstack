import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/sortie-moto-weekend-idf")({
	head: () =>
		buildGuideHead({
			path: "/sortie-moto-weekend-idf",
			title: "Sortie moto week-end IDF : où et quand rouler",
			description:
				"Trouvez une sortie moto week-end en Île-de-France avec une carte qui combine météo, routes à virages, relief et radars.",
			articleTitle: "Sortie moto week-end IDF : plan simple et efficace",
		}),
	component: SortieMotoWeekendIdfPage,
});

function SortieMotoWeekendIdfPage() {
	return (
		<SeoGuidePage
			eyebrow="Guide week-end moto"
			title="Sortie moto week-end IDF : plan simple et efficace"
			lead="Choisissez rapidement une zone de sortie pour le week-end avec les bons indicateurs météo et route, sans perdre du temps."
			highlights={[
				"Filtrer les créneaux favorables",
				"Identifier les routes intéressantes",
				"Décision rapide avant départ",
			]}
			ctaPrimary="Planifier ma sortie week-end"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Météo pour motard", to: "/meteo-pour-motard" },
				{ label: "Balade moto IDF", to: "/balade-moto-idf" },
				{ label: "Virage moto IDF", to: "/virage-moto-idf" },
				{ label: "Carte radars Paris", to: "/carte-radars-paris" },
				{ label: "Sécurité moto pluie", to: "/securite-moto-pluie" },
			]}
			sections={[
				{
					title: "Un rituel de préparation en quelques clics",
					paragraphs: [
						"Pour une sortie moto week-end en IDF, l’objectif est de gagner du temps : comparer 2-3 zones, valider la météo, puis partir.",
						"Avec les calques de la carte, vous évitez les mauvaises surprises de dernière minute et vous gardez une préparation légère.",
					],
				},
				{
					title: "Météo, virages, relief : le trio utile",
					paragraphs: [
						"La météo motard vous aide à choisir l’heure. La sinuosité et le relief permettent ensuite de viser des routes qui correspondent à votre envie du jour.",
						"Vous adaptez facilement votre plan selon la durée disponible et les conditions réelles du week-end.",
					],
				},
				{
					title: "Conserver une marge de sécurité",
					paragraphs: [
						"Le contexte radars et historique d’accidents complète la préparation pour rouler plus sereinement.",
						"L’idée n’est pas de compliquer la sortie, mais de partir avec une vision claire et actionnable.",
					],
				},
			]}
		/>
	);
}
