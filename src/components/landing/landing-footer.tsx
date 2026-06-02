import { Link } from "@tanstack/react-router";

import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME } from "#/config/app";
import { CREATOR, FOOTER_NAV } from "#/config/landing";

import { RootageEmbeds } from "./rootage-embeds";

type FooterHref = (typeof FOOTER_NAV)[number]["href"];

function isAnchorLink(
	href: FooterHref,
): href is Extract<FooterHref, `#${string}` | `${string}#${string}`> {
	return href.includes("#");
}

export function LandingFooter() {
	const year = new Date().getFullYear();
	const anchorItems = FOOTER_NAV.filter(({ href }) => {
		if (isAnchorLink(href)) return true;
		return false;
	});

	const appItems = FOOTER_NAV.filter(({ href }) => {
		if (href === "/app") return true;
		return false;
	});

	const legalItems = FOOTER_NAV.filter(({ href }) => {
		if (href.startsWith("/legal")) return true;
		return false;
	});

	const guideItems = FOOTER_NAV.filter(({ href }) => {
		if (isAnchorLink(href)) return false;
		if (href === "/app") return false;
		if (href.startsWith("/legal")) return false;
		return true;
	});

	const renderItems = (items: (typeof FOOTER_NAV)[number][]) =>
		items.map(({ label, href }) => {
			if (isAnchorLink(href)) {
				return (
					<li key={href} className="landing__footer-nav-item">
						<a href={href} className="landing__footer-nav-link">
							{label}
						</a>
					</li>
				);
			}

			return (
				<li key={href} className="landing__footer-nav-item">
					<Link to={href} className="landing__footer-nav-link">
						{label}
					</Link>
				</li>
			);
		});

	return (
		<footer className="landing__footer">
			<div className="landing__footer-inner">
				<div className="landing__footer-main">
					<div className="landing__footer-brand">
						<Link to="/" className="landing__footer-logo-link">
							<span className="landing__footer-logo">{APP_NAME}</span>
							<BetaBadge variant="nav" />
						</Link>
						<p className="landing__footer-tagline">
							Carte d’exploration moto — Île-de-France, sans GPS.
						</p>
						<Link to="/app" className="landing__footer-cta">
							Ouvrir la carte
						</Link>
					</div>

					<div className="landing__footer-links-grid">
						<div className="landing__footer-links">
							<p className="landing__footer-links-title">Explorer</p>
							<nav
								className="landing__footer-nav"
								aria-label="Explorer le site"
							>
								<ul className="landing__footer-nav-list">
									{renderItems([...anchorItems, ...appItems])}
								</ul>
							</nav>
						</div>

						<div className="landing__footer-links">
							<p className="landing__footer-links-title">Guides</p>
							<nav className="landing__footer-nav" aria-label="Guides moto">
								<ul className="landing__footer-nav-list">
									{renderItems(guideItems)}
								</ul>
							</nav>
						</div>

						<div className="landing__footer-links">
							<p className="landing__footer-links-title">Légal</p>
							<nav
								className="landing__footer-nav"
								aria-label="Informations légales"
							>
								<ul className="landing__footer-nav-list">
									{renderItems(legalItems)}
								</ul>
							</nav>
						</div>
					</div>
				</div>

				<div className="landing__footer-bottom">
					<RootageEmbeds />
					<p className="landing__footer-copy">
						© {year} {CREATOR.name} · {APP_NAME}
					</p>
				</div>
			</div>
		</footer>
	);
}
