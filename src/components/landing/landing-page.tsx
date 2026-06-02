import { Link } from "@tanstack/react-router";
import {
	CircleCheck,
	ExternalLink,
	Github,
	Layers3,
	Linkedin,
	MapPin,
} from "lucide-react";
import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME, APP_TAGLINE } from "#/config/app";
import {
	CREATOR,
	DATA_SOURCES,
	HERO_COPY,
	HOW_IT_WORKS,
	MAP_LAYERS,
} from "#/config/landing";

import { CreatorPhoto } from "./creator-photo";

const NAV = [
	{ label: "Produit", href: "#produit" },
	{ label: "Fonctionnement", href: "#fonctionnement" },
	{ label: "Données", href: "#donnees" },
	{ label: "Projet", href: "#projet" },
] as const;

const STEP_ICONS = [MapPin, Layers3, CircleCheck] as const;
const LAYER_BETA_NAMES = new Set(["Sinuosité", "Relief", "Risque accident"]);

export function LandingPage() {
	return (
		<div className="landing">
			<div className="landing__hero-wrap">
				<div className="landing__scene" aria-hidden>
					<img
						className="landing__scene-img"
						src="/background.png"
						alt=""
						width={1920}
						height={1080}
						fetchPriority="high"
					/>
					<div className="landing__scene-fade" />
				</div>

				<header className="landing__nav">
					<div className="landing__nav-bar">
						<Link to="/" className="landing__logo">
							<span className="landing__logo-mark" aria-hidden />
							{APP_NAME}
							<BetaBadge variant="nav" className="landing__logo-beta" />
						</Link>

						<nav className="landing__menu" aria-label="Navigation principale">
							{NAV.map(({ label, href }) => (
								<a key={href} href={href} className="landing__menu-link">
									{label}
								</a>
							))}
						</nav>

						<Link to="/app" className="landing__nav-cta">
							Carte
						</Link>
					</div>
				</header>

				<section id="produit" className="landing__hero">
					<div className="landing__hero-badges">
						<span className="landing__badge">
							Île-de-France · Sinuosité, météo, radars, historique BAAC
						</span>
						<BetaBadge variant="glass" />
					</div>

					<h1 className="landing__headline">{APP_TAGLINE}</h1>

					<p className="landing__subline">{HERO_COPY.subline}</p>

					<div className="landing__actions">
						<Link to="/app" className="landing__pill landing__pill--primary">
							{HERO_COPY.ctaPrimary}
							<span className="landing__arrow" aria-hidden>
								→
							</span>
						</Link>
						<a
							href="#fonctionnement"
							className="landing__pill landing__pill--ghost"
						>
							{HERO_COPY.ctaSecondary}
						</a>
					</div>
				</section>
			</div>

			<main className="landing__main">
				<section id="fonctionnement" className="landing-band">
					<div className="landing-band__inner">
						<header className="landing-band__header">
							<p className="landing-band__eyebrow">Fonctionnement</p>
							<h2 className="landing-band__title">
								Trois étapes, une seule question
							</h2>
							<p className="landing-band__lead">
								{APP_NAME} ne trace pas votre route. Il vous aide à décider si
								la zone que vous regardez mérite le détour — maintenant ou plus
								tard.
							</p>
						</header>

						<ol className="landing-steps">
							{HOW_IT_WORKS.map(({ title, description }, index) => {
								const Icon = STEP_ICONS[index] ?? MapPin;
								return (
									<li key={title} className="landing-step-card">
										<div className="landing-step-card__icon" aria-hidden>
											<Icon className="size-5" strokeWidth={1.75} />
										</div>
										<span className="landing-step-card__index">
											{String(index + 1).padStart(2, "0")}
										</span>
										<h3 className="landing-step-card__title">{title}</h3>
										<p className="landing-step-card__desc">{description}</p>
									</li>
								);
							})}
						</ol>
					</div>
				</section>

				<section id="donnees" className="landing-band landing-band--tinted">
					<div className="landing-band__inner landing-band__inner--wide">
						<header className="landing-band__header">
							<p className="landing-band__eyebrow">Sur la carte</p>
							<h2 className="landing-band__title">
								Calques et sources, une seule question
							</h2>
							<p className="landing-band__lead">
								Ce que vous voyez à l’écran est-il fiable pour décider si cette
								zone vaut le détour ?
							</p>
						</header>

						<div className="landing-data-simple">
							<article className="landing-data-simple__card">
								<div className="landing-step-card__icon" aria-hidden>
									<Layers3 className="size-5" strokeWidth={1.75} />
								</div>
								<h3 className="landing-step-card__title">Calques clairs</h3>
								<p className="landing-step-card__desc">
									Activez un calque à la fois pour garder une lecture simple de
									la zone.
								</p>
								<ul className="landing-data-simple__list">
									{MAP_LAYERS.map((layer) => (
										<li key={layer.name} className="landing-data-simple__item">
											<span>{layer.name}</span>
											<div className="landing-showcase-layer-card__badges">
												<span
													className="landing-layer-card__tag"
													data-tag={layer.tag}
												>
													{layer.tag}
												</span>
												{LAYER_BETA_NAMES.has(layer.name) ? (
													<span className="landing-layer-card__tag landing-layer-card__tag--beta">
														BETA
													</span>
												) : null}
											</div>
										</li>
									))}
								</ul>
							</article>

							<article className="landing-data-simple__card">
								<div className="landing-step-card__icon" aria-hidden>
									<ExternalLink className="size-5" strokeWidth={1.75} />
								</div>
								<h3 className="landing-step-card__title">Sources publiques</h3>
								<p className="landing-step-card__desc">
									Données open data et officielles, consultables en un clic.
								</p>
								<ul className="landing-sources-card__list landing-sources-card__list--inline">
									{DATA_SOURCES.map(({ name, href }) => (
										<li key={name}>
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="landing-source-chip"
											>
												{name}
												<ExternalLink
													className="size-3.5 shrink-0 opacity-60"
													strokeWidth={2}
													aria-hidden
												/>
											</a>
										</li>
									))}
								</ul>
								<p className="landing-data-simple__note">
									Outil d’information : pas de GPS, pas de guidage vocal.
								</p>
							</article>
						</div>

						<div className="landing-band__cta">
							<Link to="/app" className="landing__pill landing__pill--primary">
								{HERO_COPY.ctaTry}
								<span className="landing__arrow" aria-hidden>
									→
								</span>
							</Link>
						</div>

						<div className="landing-band__cta">
							<ul className="landing-sources-card__list landing-sources-card__list--inline">
								<li>
									<Link to="/meteo-pour-motard" className="landing-source-chip">
										Guide météo motard
									</Link>
								</li>
								<li>
									<Link
										to="/carte-radars-paris"
										className="landing-source-chip"
									>
										Guide carte radars Paris
									</Link>
								</li>
								<li>
									<Link to="/virage-moto-idf" className="landing-source-chip">
										Guide virage moto IDF
									</Link>
								</li>
								<li>
									<Link to="/balade-moto-idf" className="landing-source-chip">
										Guide balade moto IDF
									</Link>
								</li>
								<li>
									<Link
										to="/sortie-moto-weekend-idf"
										className="landing-source-chip"
									>
										Guide sortie week-end
									</Link>
								</li>
								<li>
									<Link
										to="/securite-moto-pluie"
										className="landing-source-chip"
									>
										Guide sécurité sous pluie
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</section>

				<section id="projet" className="landing-band landing-band--about">
					<div className="landing-band__inner">
						<header className="landing-band__header">
							<p className="landing-band__eyebrow">Projet</p>
							<h2 className="landing-band__title">Derrière la carte</h2>
						</header>

						<article className="landing-about-card">
							<CreatorPhoto
								src={CREATOR.photo}
								name={CREATOR.name}
								initials={CREATOR.initials}
							/>
							<div className="landing-about-card__body">
								<p className="landing-about-card__story">{CREATOR.story}</p>
								<footer className="landing-about-card__footer">
									<p className="landing-about-card__name">{CREATOR.name}</p>
									<div className="landing-about-card__links">
										<a
											href={CREATOR.github}
											target="_blank"
											rel="noopener noreferrer"
											className="landing-about-card__link"
										>
											<Github
												className="size-4"
												strokeWidth={1.75}
												aria-hidden
											/>
											GitHub
										</a>
										<a
											href={CREATOR.linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="landing-about-card__link"
										>
											<Linkedin
												className="size-4"
												strokeWidth={1.75}
												aria-hidden
											/>
											LinkedIn
										</a>
									</div>
								</footer>
							</div>
						</article>
					</div>
				</section>
			</main>
		</div>
	);
}
