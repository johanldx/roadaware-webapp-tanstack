import { Link } from "@tanstack/react-router";
import { MinimalHeader } from "#/components/layout/minimal-header";
import { APP_NAME } from "#/config/app";
import {
	LEGAL_HOST,
	LEGAL_LAST_UPDATED,
	LEGAL_PUBLISHER,
} from "#/config/legal";

const SECTIONS = [
	{ id: "mentions-legales", label: "Mentions légales" },
	{ id: "conditions", label: "Conditions d'utilisation" },
] as const;

export function LegalPage() {
	return (
		<div className="legal">
			<MinimalHeader />

			<main className="legal__main">
				<div className="legal__intro">
					<p className="legal__eyebrow">Informations légales</p>
					<h1 className="legal__title">Mentions légales & conditions</h1>
					<p className="legal__lead">
						Documents relatifs à {APP_NAME}, service d’information
						cartographique pour motards (version bêta). Dernière mise à jour :{" "}
						{LEGAL_LAST_UPDATED}.
					</p>
					<nav className="legal__toc" aria-label="Sommaire">
						{SECTIONS.map(({ id, label }) => (
							<a key={id} href={`#${id}`} className="legal__toc-link">
								{label}
							</a>
						))}
					</nav>
				</div>

				<article id="mentions-legales" className="legal__section">
					<h2 className="legal__section-title">Mentions légales</h2>

					<section className="legal__block">
						<h3 className="legal__block-title">Éditeur du site</h3>
						<dl className="legal__dl">
							<div>
								<dt>Nom</dt>
								<dd>
									{LEGAL_PUBLISHER.name}
									{LEGAL_PUBLISHER.tradeName
										? ` (${LEGAL_PUBLISHER.tradeName})`
										: null}
								</dd>
							</div>
							<div>
								<dt>Statut</dt>
								<dd>{LEGAL_PUBLISHER.status}</dd>
							</div>
							<div>
								<dt>Adresse</dt>
								<dd>{LEGAL_PUBLISHER.address}</dd>
							</div>
							<div>
								<dt>E-mail</dt>
								<dd>
									<a href={`mailto:${LEGAL_PUBLISHER.email}`}>
										{LEGAL_PUBLISHER.email}
									</a>
								</dd>
							</div>
							<div>
								<dt>Téléphone</dt>
								<dd>Non communiqué</dd>
							</div>
							<div>
								<dt>SIRET</dt>
								<dd>{LEGAL_PUBLISHER.siret}</dd>
							</div>
							<div>
								<dt>N° TVA intracommunautaire</dt>
								<dd>{LEGAL_PUBLISHER.vat}</dd>
							</div>
						</dl>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">Directeur de la publication</h3>
						<p>{LEGAL_PUBLISHER.name}, en qualité d’entrepreneur individuel.</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">Hébergement</h3>
						<p>
							Le site et l’application sont hébergés par{" "}
							<a
								href={LEGAL_HOST.website}
								target="_blank"
								rel="noopener noreferrer"
							>
								{LEGAL_HOST.name}
							</a>
							.
						</p>
						<dl className="legal__dl">
							<div>
								<dt>Hébergeur</dt>
								<dd>{LEGAL_HOST.name}</dd>
							</div>
							<div>
								<dt>Adresse</dt>
								<dd>{LEGAL_HOST.address}</dd>
							</div>
						</dl>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">Propriété intellectuelle</h3>
						<p>
							L’interface, les textes originaux, la charte graphique et le code
							source de {APP_NAME} sont la propriété de {LEGAL_PUBLISHER.name},
							sauf mention contraire. Les données cartographiques et open data
							restent soumises à leurs licences respectives (OpenStreetMap ODbL,
							licences data.gouv.fr, etc.).
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">Données personnelles</h3>
						<p>
							{APP_NAME} ne requiert pas de compte utilisateur. La
							géolocalisation (« Ma position ») n’est utilisée que si vous
							l’activez, directement dans votre navigateur, sans conservation
							côté serveur par l’éditeur. Pour toute question relative à vos
							données, contactez{" "}
							<a href={`mailto:${LEGAL_PUBLISHER.email}`}>
								{LEGAL_PUBLISHER.email}
							</a>
							.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">Cookies et traceurs</h3>
						<p>
							Le service ne dépose pas de cookies publicitaires. Seuls des
							stockages techniques strictement nécessaires au fonctionnement de
							l’application dans votre navigateur peuvent être utilisés
							(préférences d’affichage, cache local).
						</p>
					</section>
				</article>

				<article id="conditions" className="legal__section">
					<h2 className="legal__section-title">Conditions d’utilisation</h2>

					<section className="legal__block">
						<h3 className="legal__block-title">1. Objet</h3>
						<p>
							Les présentes conditions régissent l’accès et l’utilisation de{" "}
							{APP_NAME} (site vitrine et carte interactive), édités par{" "}
							{LEGAL_PUBLISHER.name}. En accédant au service, vous acceptez ces
							conditions dans leur intégralité.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">2. Description du service</h3>
						<p>
							{APP_NAME} est un <strong>outil d’information</strong> permettant
							d’explorer une zone géographique (actuellement l’Île-de-France)
							via des calques optionnels : sinuosité des routes, roulabilité
							météo, radars fixes, historique d’accidents moto, etc.
						</p>
						<p>
							Le service <strong>ne constitue pas</strong> un outil de
							navigation, de guidage GPS, ni un dispositif d’aide à la conduite
							au sens réglementaire. Il ne remplace pas votre jugement, le code
							de la route, ni les panneaux officiels.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">3. Version bêta</h3>
						<p>
							Le service est proposé en version bêta : des anomalies,
							interruptions ou évolutions peuvent survenir sans préavis. Les
							fonctionnalités et la zone couverte peuvent changer.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">4. Données et limites</h3>
						<p>
							Les informations affichées proviennent de sources tierces
							(OpenStreetMap, fichiers BAAC, TMJA, Open-Meteo, etc.). Elles
							peuvent être incomplètes, approximatives ou décalées dans le
							temps. Notamment :
						</p>
						<ul className="legal__list">
							<li>
								le calque risque repose sur des agrégats historiques, pas sur un
								danger en temps réel ;
							</li>
							<li>
								le ratio trafic (TMJA) n’est disponible que sur une partie des
								tronçons ;
							</li>
							<li>
								la météo est indicative pour le créneau choisi, pas une garantie
								sur la route réelle.
							</li>
						</ul>
						<p>
							Vous restez seul responsable de vos choix de trajet et de votre
							sécurité sur la route.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">5. Accès et disponibilité</h3>
						<p>
							L’accès au service est gratuit. L’éditeur s’efforce d’en assurer
							la disponibilité mais ne garantit pas un fonctionnement continu ni
							l’absence d’erreurs.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">6. Utilisation acceptable</h3>
						<p>Il est interdit notamment de :</p>
						<ul className="legal__list">
							<li>
								utiliser le service de manière illicite ou contraire à l’ordre
								public ;
							</li>
							<li>
								tenter d’extraire massivement les données ou de surcharger
								l’infrastructure ;
							</li>
							<li>
								reproduire l’interface ou le code sans autorisation, hors droits
								accordés par les licences open source applicables.
							</li>
						</ul>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">7. Responsabilité</h3>
						<p>
							Dans les limites autorisées par la loi, {LEGAL_PUBLISHER.name} ne
							saurait être tenu responsable des dommages directs ou indirects
							résultant de l’utilisation ou de l’impossibilité d’utiliser le
							service, y compris en cas d’erreur d’interprétation des cartes ou
							des scores affichés.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">8. Liens externes</h3>
						<p>
							Le site peut contenir des liens vers des sites tiers (sources de
							données, réseaux sociaux). L’éditeur n’exerce aucun contrôle sur
							ces sites et décline toute responsabilité quant à leur contenu.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">9. Modifications</h3>
						<p>
							Les présentes conditions et les mentions légales peuvent être
							modifiées à tout moment. La date de mise à jour figure en tête de
							page. Nous vous invitons à les consulter régulièrement.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">10. Droit applicable</h3>
						<p>
							Les présentes conditions sont soumises au droit français. En cas
							de litige, et à défaut de résolution amiable, les tribunaux
							français seront seuls compétents.
						</p>
					</section>

					<section className="legal__block">
						<h3 className="legal__block-title">11. Contact</h3>
						<p>
							Pour toute question :{" "}
							<a href={`mailto:${LEGAL_PUBLISHER.email}`}>
								{LEGAL_PUBLISHER.email}
							</a>
							.
						</p>
					</section>
				</article>

				<p className="legal__back">
					<Link to="/">← Retour à l’accueil</Link>
				</p>
			</main>
		</div>
	);
}
