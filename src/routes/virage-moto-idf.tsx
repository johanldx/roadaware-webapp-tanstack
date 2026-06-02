import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/virage-moto-idf")({
	head: () =>
		buildGuideHead({
			path: "/virage-moto-idf",
			title: "Virage moto IDF : routes sinueuses en Île-de-France",
			description:
				"Trouvez des zones à virages moto en Île-de-France grâce au calque sinuosité et au filtre relief pour préparer vos balades.",
			articleTitle: "Virage moto IDF : repérer les routes sinueuses",
		}),
	component: VirageMotoIdfPage,
});

function VirageMotoIdfPage() {
	return (
		<SeoGuidePage
			eyebrow="Guide routes à virages"
			title="Virage moto IDF : repérer les routes sinueuses"
			lead="Trouvez rapidement des zones à virages en IDF avec une lecture claire de la sinuosité, du relief et des conditions météo."
			highlights={[
				"Calque sinuosité ciblé moto",
				"Relief pour les portions techniques",
				"Choix de créneau météo intégré",
			]}
			ctaPrimary="Trouver des virages en IDF"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Météo pour motard", to: "/meteo-pour-motard" },
				{ label: "Carte radars Paris", to: "/carte-radars-paris" },
				{ label: "Balade moto IDF", to: "/balade-moto-idf" },
				{ label: "Sortie moto week-end IDF", to: "/sortie-moto-weekend-idf" },
				{ label: "Sécurité moto pluie", to: "/securite-moto-pluie" },
			]}
			sections={[
				{
					title: "Repérer les bonnes zones avant de tracer",
					paragraphs: [
						"Le calque sinuosité met en avant les routes qui tournent vraiment. Parfait pour identifier des secteurs plaisir avant même de lancer un itinéraire.",
						"Vous comparez facilement plusieurs zones d’Île-de-France pour choisir celle qui vous donne envie de rouler aujourd’hui.",
					],
				},
				{
					title: "Ajoutez le relief pour monter en précision",
					paragraphs: [
						"Le relief complète la sinuosité pour repérer les sections avec pente ou dénivelé. Résultat : une sélection plus fine des portions intéressantes.",
						"Le duo sinuosité + relief vous aide à choisir une zone adaptée à votre niveau, à votre moto et au temps disponible.",
					],
				},
				{
					title: "Plaisir de route, avec le bon contexte",
					paragraphs: [
						"Croisez les virages avec la météo motard et les radars pour préparer une sortie plus cohérente : plaisir, timing, vigilance.",
						"La carte reste un outil d’aide à la décision, pensé pour mieux préparer vos balades sans alourdir votre routine.",
					],
				},
			]}
		/>
	);
}
