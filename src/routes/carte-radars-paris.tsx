import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/carte-radars-paris")({
	head: () =>
		buildGuideHead({
			path: "/carte-radars-paris",
			title: "Carte radars Paris et IDF pour motards",
			description:
				"Affichez une carte des radars à Paris et en Île-de-France pour anticiper vos trajets moto avec des données officielles.",
			articleTitle:
				"Carte radars Paris : visualiser les radars en Île-de-France",
		}),
	component: CarteRadarsParisPage,
});

function CarteRadarsParisPage() {
	return (
		<SeoGuidePage
			eyebrow="Guide radars moto"
			title="Carte radars Paris : visualiser les radars en Île-de-France"
			lead="Repérez les radars fixes autour de Paris et en IDF pour préparer des trajets plus fluides, plus lisibles et plus sereins."
			highlights={[
				"Calque radars fixes officiel",
				"Lecture instantanée autour de Paris",
				"Croisement avec météo et virages",
			]}
			ctaPrimary="Afficher la carte radars Paris"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Météo pour motard", to: "/meteo-pour-motard" },
				{ label: "Virage moto IDF", to: "/virage-moto-idf" },
				{ label: "Balade moto IDF", to: "/balade-moto-idf" },
				{ label: "Sortie moto week-end IDF", to: "/sortie-moto-weekend-idf" },
				{ label: "Sécurité moto pluie", to: "/securite-moto-pluie" },
			]}
			sections={[
				{
					title: "Une carte claire avant de sortir",
					paragraphs: [
						"La carte radars Paris affiche les radars fixes sur la zone visible, sans surcharge inutile. Vous savez immédiatement où l’attention doit rester maximale.",
						"Le but est simple : améliorer la lecture du contexte routier pour rouler proprement, pas chercher des raccourcis.",
					],
				},
				{
					title: "Un vrai combo pour préparer vos sorties",
					paragraphs: [
						"Le calque radars prend toute sa valeur quand vous le combinez avec la météo motard, la sinuosité et le relief.",
						"Vous construisez une vision complète : conditions, plaisir de route et vigilance, sans changer d’outil.",
					],
				},
				{
					title: "De Paris aux routes de balade IDF",
					paragraphs: [
						"La couverture s’étend de Paris à la grande couronne : utile en urbain comme sur les axes de sortie vers les routes plus roulantes.",
						"Activez simplement le calque radars et zoomez sur votre zone pour préparer votre trajet en quelques clics.",
					],
				},
			]}
		/>
	);
}
