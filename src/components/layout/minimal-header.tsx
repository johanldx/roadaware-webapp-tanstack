import { Link } from "@tanstack/react-router";

import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME } from "#/config/app";

export function MinimalHeader() {
	return (
		<header className="minimal-header">
			<div className="minimal-header__inner">
				<Link to="/" className="minimal-header__logo">
					<span className="landing__logo-mark" aria-hidden />
					{APP_NAME}
					<BetaBadge variant="nav" />
				</Link>
				<nav className="minimal-header__nav" aria-label="Navigation secondaire">
					<Link to="/app" className="minimal-header__link">
						Carte
					</Link>
					<Link to="/" className="minimal-header__link">
						Accueil
					</Link>
				</nav>
			</div>
		</header>
	);
}
