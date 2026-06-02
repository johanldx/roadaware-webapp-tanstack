import { Link } from "@tanstack/react-router";

import { MinimalHeader } from "#/components/layout/minimal-header";

interface SeoGuidePageProps {
	eyebrow: string;
	title: string;
	lead: string;
	highlights?: string[];
	ctaPrimary?: string;
	ctaSecondary?: string;
	relatedLinks?: Array<{
		label: string;
		to: string;
	}>;
	sections: Array<{
		title: string;
		paragraphs: string[];
	}>;
}

export function SeoGuidePage({
	eyebrow,
	title,
	lead,
	highlights = [],
	ctaPrimary = "Ouvrir la carte maintenant",
	ctaSecondary = "Voir la landing",
	relatedLinks = [],
	sections,
}: SeoGuidePageProps) {
	return (
		<div className="legal">
			<MinimalHeader />

			<main className="legal__main seo-page">
				<nav className="seo-page__breadcrumb" aria-label="Fil d'Ariane">
					<ol className="seo-page__breadcrumb-list">
						<li className="seo-page__breadcrumb-item">
							<Link to="/">Accueil</Link>
						</li>
						<li className="seo-page__breadcrumb-item" aria-current="page">
							{eyebrow}
						</li>
					</ol>
				</nav>

				<section className="seo-page__hero">
					<p className="legal__eyebrow">{eyebrow}</p>
					<h1 className="seo-page__title">{title}</h1>
					<p className="seo-page__lead">{lead}</p>

					{highlights.length > 0 ? (
						<ul className="seo-page__chips" aria-label="Points clés">
							{highlights.map((item) => (
								<li key={item} className="seo-page__chip">
									{item}
								</li>
							))}
						</ul>
					) : null}

					<div className="seo-page__cta-row">
						<Link to="/app" className="seo-page__btn seo-page__btn--primary">
							{ctaPrimary}
							<span aria-hidden>→</span>
						</Link>
						<Link to="/" className="seo-page__btn seo-page__btn--ghost">
							{ctaSecondary}
						</Link>
					</div>
				</section>

				<article className="seo-page__sections">
					{sections.map((section, index) => (
						<section key={section.title} className="seo-page__card">
							<p className="seo-page__card-kicker">
								Étape {String(index + 1).padStart(2, "0")}
							</p>
							<h2 className="seo-page__card-title">{section.title}</h2>
							{section.paragraphs.map((paragraph) => (
								<p key={paragraph} className="seo-page__card-text">
									{paragraph}
								</p>
							))}
						</section>
					))}
				</article>

				{relatedLinks.length > 0 ? (
					<section className="seo-page__related" aria-label="Guides associés">
						<h2 className="seo-page__related-title">Guides associés</h2>
						<ul className="seo-page__related-list">
							{relatedLinks.map((link) => (
								<li key={link.to}>
									<Link to={link.to} className="seo-page__related-link">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</section>
				) : null}
			</main>
		</div>
	);
}
