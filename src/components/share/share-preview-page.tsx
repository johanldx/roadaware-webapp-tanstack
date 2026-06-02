import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { BetaBadge } from "#/components/ui/beta-badge";
import { APP_NAME } from "#/config/app";
import { BASEMAP_LABELS } from "#/config/map";
import {
	decodeMapSharePayload,
	layerLabelsFromPayload,
} from "#/lib/share/map-share-payload";

import { ShareMapPreview } from "./share-map-preview";

interface SharePreviewPageProps {
	encoded: string | undefined;
}

function formatTime(iso?: string) {
	if (!iso) return null;
	return new Date(iso).toLocaleString("fr-FR", {
		timeZone: "Europe/Paris",
		weekday: "long",
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function SharePreviewPage({ encoded }: SharePreviewPageProps) {
	const state = encoded ? decodeMapSharePayload(encoded) : null;

	if (!state) {
		return (
			<div className="share-preview share-preview--error">
				<p className="share-preview__error-title">Lien invalide ou expiré</p>
				<Link to="/app" className="landing__pill landing__pill--primary">
					Ouvrir la carte
				</Link>
			</div>
		);
	}

	const layers = layerLabelsFromPayload(state);
	const timeLabel = formatTime(state.at);
	const basemapMeta = BASEMAP_LABELS[state.basemapId];
	return (
		<div className="share-preview">
			<header className="share-preview__header">
				<Link to="/" className="share-preview__brand">
					<span className="landing__logo-mark" aria-hidden />
					<span>{APP_NAME}</span>
					<BetaBadge variant="nav" />
				</Link>
			</header>

			<main className="share-preview__main">
				<article className="share-preview__card glass-rise">
					<div className="share-preview__map-wrap">
						<ShareMapPreview state={state} />
					</div>

					<div className="share-preview__encart">
						<p className="share-preview__eyebrow">Vue partagée</p>
						<h1 className="share-preview__title">
							{timeLabel ?? "Exploration Île-de-France"}
						</h1>
						<div className="share-preview__chips">
							<span className="share-preview__chip">
								Fond {basemapMeta.label}
							</span>
							<span className="share-preview__chip">
								{layers.length > 0 ? `${layers.length} calques` : "Carte seule"}
							</span>
						</div>
						<p className="share-preview__meta">
							{layers.length > 0 ? layers.join(" · ") : "Aucun calque actif"}
						</p>
						<p className="share-preview__disclaimer">
							Outil d’information — pas de navigation GPS. Données ouvertes,
							lecture indicative.
						</p>
						<Link
							to="/app"
							search={{ s: encoded }}
							className="landing__pill landing__pill--primary share-preview__cta"
						>
							Ouvrir dans la carte
							<ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
						</Link>
					</div>
				</article>
			</main>
		</div>
	);
}
