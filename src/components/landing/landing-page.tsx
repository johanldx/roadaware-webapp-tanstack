import { Link } from "@tanstack/react-router";
import { Github, Linkedin } from "lucide-react";
import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME, APP_TAGLINE } from "#/config/app";
import {
	CREATOR,
	DATA_SOURCES,
	HERO_COPY,
	HOW_IT_WORKS,
	MAP_LAYERS,
	RISK_DATA_COVERAGE,
	RISK_TMJA_NOTE,
} from "#/config/landing";

import { CreatorPhoto } from "./creator-photo";
import { LandingFooter } from "./landing-footer";

const NAV = [
	{ label: "Produit", href: "#produit" },
	{ label: "Fonctionnement", href: "#fonctionnement" },
	{ label: "Données", href: "#donnees" },
	{ label: "Projet", href: "#projet" },
] as const;

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
				<section id="fonctionnement" className="landing__section">
					<div className="landing__section-intro">
						<p className="landing__eyebrow">Fonctionnement</p>
						<h2 className="landing__section-title">
							Trois étapes, une seule question
						</h2>
						<p className="landing__section-lead">
							{APP_NAME} ne trace pas votre route. Il vous aide à décider si la
							zone que vous regardez mérite le détour — maintenant ou plus tard.
						</p>
					</div>

					<ol className="landing__steps">
						{HOW_IT_WORKS.map(({ title, description }, index) => (
							<li key={title} className="landing__step">
								<span className="landing__step-num" aria-hidden>
									{index + 1}
								</span>
								<div className="landing__step-body">
									<h3 className="landing__step-title">{title}</h3>
									<p className="landing__step-desc">{description}</p>
								</div>
							</li>
						))}
					</ol>
				</section>

				<section id="donnees" className="landing__section">
					<div className="landing__section-intro">
						<p className="landing__eyebrow">Sur la carte</p>
						<h2 className="landing__section-title">Calques et sources</h2>
						<p className="landing__section-lead">
							Chaque calque est optionnel. Données ouvertes (OSM, BAAC, TMJA,
							météo) : le calque risque combine densité d’accidents par km et
							ratio trafic là où un comptage officiel existe — pas partout.
						</p>
					</div>

					<div className="landing__panel">
						<ul className="landing__layer-list">
							{MAP_LAYERS.map((layer) => (
								<li key={layer.name} className="landing__layer-row">
									<div className="landing__layer-main">
										<span className="landing__layer-name">{layer.name}</span>
										<span className="landing__layer-tag">{layer.tag}</span>
									</div>
									<p className="landing__layer-desc">{layer.description}</p>
									{"detail" in layer && layer.detail ? (
										<p className="landing__layer-detail">{layer.detail}</p>
									) : null}
								</li>
							))}
						</ul>

						<div className="landing__panel-foot">
							<p className="landing__panel-foot-label">Sources ouvertes</p>
							<ul className="landing__source-links">
								{DATA_SOURCES.map(({ name, href }) => (
									<li key={name}>
										<a href={href} target="_blank" rel="noopener noreferrer">
											{name}
										</a>
									</li>
								))}
							</ul>
						</div>
					</div>

					<aside
						className="landing__callout"
						aria-labelledby="landing-tmja-note-title"
					>
						<p className="landing__callout-eyebrow">Transparence données</p>
						<h3 id="landing-tmja-note-title" className="landing__callout-title">
							{RISK_TMJA_NOTE.title}
						</h3>
						<p className="landing__callout-lead">{RISK_TMJA_NOTE.lead}</p>
						<ul className="landing__callout-list">
							{RISK_TMJA_NOTE.bullets.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
						<p className="landing__callout-meta">
							Chiffres export IDF ({RISK_DATA_COVERAGE.years}) :{" "}
							{RISK_DATA_COVERAGE.tmjaMatchedSegments} tronçons avec TMJA sur{" "}
							{RISK_DATA_COVERAGE.riskSegments} affichés.
						</p>
					</aside>

					<p className="landing__note">
						Outil d’information — pas de navigation, pas de guidage vocal.
						Tendance historique BAAC, pas un danger absolu ; précision
						géographique et couverture trafic limitées, rappelées dans chaque
						popup.
					</p>

					<div className="landing__section-cta">
						<Link to="/app" className="landing__pill landing__pill--primary">
							{HERO_COPY.ctaTry}
							<span className="landing__arrow" aria-hidden>
								→
							</span>
						</Link>
					</div>
				</section>

				<section
					id="projet"
					className="landing__section landing__section--about"
				>
					<div className="landing__about">
						<CreatorPhoto
							src={CREATOR.photo}
							name={CREATOR.name}
							initials={CREATOR.initials}
						/>
						<div className="landing__about-body">
							<p className="landing__about-story">{CREATOR.story}</p>
							<footer className="landing__about-meta">
								<span className="landing__about-name">{CREATOR.name}</span>
								<span className="landing__about-sep" aria-hidden>
									·
								</span>
								<a
									href={CREATOR.github}
									target="_blank"
									rel="noopener noreferrer"
									className="landing__about-link"
								>
									<Github className="size-3.5" strokeWidth={1.75} aria-hidden />
									GitHub
								</a>
								<a
									href={CREATOR.linkedin}
									target="_blank"
									rel="noopener noreferrer"
									className="landing__about-link"
								>
									<Linkedin
										className="size-3.5"
										strokeWidth={1.75}
										aria-hidden
									/>
									LinkedIn
								</a>
							</footer>
						</div>
					</div>
				</section>
			</main>

			<LandingFooter />
		</div>
	);
}
