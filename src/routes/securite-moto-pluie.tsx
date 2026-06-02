import { createFileRoute } from "@tanstack/react-router";

import { SeoGuidePage } from "#/components/seo/seo-guide-page";
import { buildGuideHead } from "#/config/seo";

export const Route = createFileRoute("/securite-moto-pluie")({
	head: () =>
		buildGuideHead({
			path: "/securite-moto-pluie",
			title: "Sécurité moto pluie : lire les conditions avant de rouler",
			description:
				"Améliorez votre sécurité moto sous la pluie en consultant les indicateurs météo, vent et visibilité avant de partir en IDF.",
			articleTitle: "Sécurité moto pluie : vérifier avant de partir",
		}),
	component: SecuriteMotoPluiePage,
});

function SecuriteMotoPluiePage() {
	return (
		<SeoGuidePage
			eyebrow="Guide sécurité moto"
			title="Sécurité moto pluie : vérifier avant de partir"
			lead="Sous la pluie, anticiper les conditions est essentiel. Roadaware vous aide à choisir un créneau plus sûr en Île-de-France."
			highlights={[
				"Lecture pluie + vent + lumière",
				"Comparaison de créneaux",
				"Aide à la décision avant départ",
			]}
			ctaPrimary="Vérifier les conditions maintenant"
			ctaSecondary="Retour à l’accueil"
			relatedLinks={[
				{ label: "Météo pour motard", to: "/meteo-pour-motard" },
				{ label: "Sortie moto week-end IDF", to: "/sortie-moto-weekend-idf" },
				{ label: "Balade moto IDF", to: "/balade-moto-idf" },
				{ label: "Virage moto IDF", to: "/virage-moto-idf" },
				{ label: "Carte radars Paris", to: "/carte-radars-paris" },
			]}
			sections={[
				{
					title: "Anticiper au lieu de subir",
					paragraphs: [
						"La sécurité moto pluie commence avant de monter en selle : pluie active, vent latéral et faible luminosité peuvent rapidement dégrader le confort et la vigilance.",
						"Comparer les créneaux permet souvent d’éviter la pire fenêtre météo et de rouler dans de meilleures conditions.",
					],
				},
				{
					title: "Ce que la carte vous apporte concrètement",
					paragraphs: [
						"Roadaware agrège les signaux utiles à moto pour donner une lecture claire de la zone affichée.",
						"En pratique, vous choisissez un horaire plus stable, puis vous adaptez votre rythme et votre équipement en conséquence.",
					],
				},
				{
					title: "Rester prudent sur le terrain",
					paragraphs: [
						"La carte est une aide à la préparation, pas un système de guidage. Les conditions locales peuvent évoluer vite, surtout sous pluie intermittente.",
						"Gardez des marges, vérifiez l’état de la chaussée et adaptez la conduite à la visibilité réelle.",
					],
				},
			]}
		/>
	);
}
