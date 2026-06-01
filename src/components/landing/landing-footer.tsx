import { Link } from "@tanstack/react-router";

import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME } from "#/config/app";
import { CREATOR, FOOTER_NAV } from "#/config/landing";

import { RootageEmbeds } from "./rootage-embeds";

export function LandingFooter() {
	const year = new Date().getFullYear();

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
					</div>

					<nav className="landing__footer-nav" aria-label="Pied de page">
						{FOOTER_NAV.map(({ label, href }) =>
							href.startsWith("#") ? (
								<a key={href} href={href} className="landing__footer-nav-link">
									{label}
								</a>
							) : (
								<Link key={href} to={href} className="landing__footer-nav-link">
									{label}
								</Link>
							),
						)}
					</nav>
				</div>

				<RootageEmbeds />

				<p className="landing__footer-copy">
					© {year} {CREATOR.name} · {APP_NAME}
				</p>
			</div>
		</footer>
	);
}
