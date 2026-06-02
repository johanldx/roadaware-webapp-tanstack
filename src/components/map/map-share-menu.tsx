import { Link } from "@tanstack/react-router";
import { Copy, Download, Share2, X } from "lucide-react";
import type maplibregl from "maplibre-gl";
import { useCallback, useState } from "react";
import { useMapStore } from "#/features/map/hooks/use-map-store";
import { collectMapShareState } from "#/features/share/collect-map-share-state";
import { exportMapShareImage } from "#/features/share/export-map-share-image";
import {
	encodeMapSharePayload,
	layerLabelsFromPayload,
	sharePageUrl,
} from "#/lib/share/map-share-payload";

interface MapShareMenuProps {
	open: boolean;
	onClose: () => void;
}

async function waitMapReadyForExport(map: maplibregl.Map, timeoutMs = 1200) {
	if (map.loaded() && map.isStyleLoaded()) return;
	await new Promise<void>((resolve) => {
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			map.off("idle", finish);
			resolve();
		};
		map.on("idle", finish);
		setTimeout(finish, timeoutMs);
	});
}

export function MapShareMenu({ open, onClose }: MapShareMenuProps) {
	const map = useMapStore((s) => s.map);
	const [status, setStatus] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const buildShare = useCallback(() => {
		const state = collectMapShareState();
		if (!state) return null;
		const encoded = encodeMapSharePayload(state);
		return { state, encoded, url: sharePageUrl(encoded) };
	}, []);

	const copyLink = async () => {
		const pack = buildShare();
		if (!pack) return;
		try {
			await navigator.clipboard.writeText(pack.url);
			setStatus("Lien copié");
		} catch {
			setStatus("Copie impossible");
		}
	};

	const downloadImage = async () => {
		if (!map) return;
		const pack = buildShare();
		if (!pack) return;
		setBusy(true);
		try {
			await waitMapReadyForExport(map);
			map.triggerRepaint();
			await new Promise((r) => requestAnimationFrame(() => r(undefined)));
			const blob = await exportMapShareImage(map, pack.state);
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `roadaware-${Date.now()}.png`;
			a.click();
			URL.revokeObjectURL(a.href);
			setStatus("Image enregistrée");
		} catch (err) {
			console.error("[share] export image failed", err);
			setStatus("Export impossible");
		} finally {
			setBusy(false);
		}
	};

	const nativeShare = async () => {
		if (!map) return;
		const pack = buildShare();
		if (!pack) return;
		setBusy(true);
		try {
			await waitMapReadyForExport(map);
			map.triggerRepaint();
			await new Promise((r) => requestAnimationFrame(() => r(undefined)));
			const blob = await exportMapShareImage(map, pack.state);
			const file = new File([blob], "roadaware.png", { type: "image/png" });
			const layers = layerLabelsFromPayload(pack.state).join(", ");
			if (navigator.share) {
				await navigator.share({
					title: "Roadaware",
					text: layers ? `Calques : ${layers}` : "Carte moto IDF",
					url: pack.url,
					files: [file],
				});
				setStatus("Partagé");
				onClose();
			} else {
				await downloadImage();
			}
		} catch (err) {
			console.error("[share] native share failed", err);
			if ((err as Error).name !== "AbortError") setStatus("Partage annulé");
		} finally {
			setBusy(false);
		}
	};

	if (!open) return null;

	const pack = buildShare();

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: fermeture au clic hors panneau
		<div
			className="map-share-backdrop"
			role="dialog"
			aria-modal="true"
			onClick={onClose}
		>
			<div
				className="map-share-panel glass-rise"
				role="dialog"
				aria-labelledby="map-share-title"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<div className="map-share-panel__brand">
					<span className="landing__logo-mark" aria-hidden />
					<span>Roadaware</span>
				</div>
				<header className="map-share-panel__head">
					<h2 id="map-share-title" className="map-share-panel__title">
						Partager cette vue
					</h2>
					<button
						type="button"
						className="map-share-panel__close"
						aria-label="Fermer"
						onClick={onClose}
					>
						<X className="size-5" strokeWidth={2} />
					</button>
				</header>

				<p className="map-share-panel__lead">
					Style landing : lien compact + image prête a partager.
				</p>

				{pack ? (
					<p className="map-share-panel__url" title={pack.url}>
						{pack.url}
					</p>
				) : null}

				<div className="map-share-panel__actions">
					<button
						type="button"
						className="map-share-panel__btn"
						onClick={() => void copyLink()}
					>
						<Copy className="size-4" strokeWidth={2} aria-hidden />
						Copier le lien
					</button>
					<button
						type="button"
						className="map-share-panel__btn"
						disabled={busy || !map}
						onClick={() => void downloadImage()}
					>
						<Download className="size-4" strokeWidth={2} aria-hidden />
						Image PNG
					</button>
					<button
						type="button"
						className="map-share-panel__btn map-share-panel__btn--primary"
						disabled={busy || !map}
						onClick={() => void nativeShare()}
					>
						<Share2 className="size-4" strokeWidth={2} aria-hidden />
						Partager…
					</button>
				</div>

				{pack ? (
					<Link
						to="/share"
						search={{ s: pack.encoded }}
						className="map-share-panel__preview-link"
						target="_blank"
						rel="noopener noreferrer"
					>
						Voir l’aperçu
					</Link>
				) : null}

				{status ? (
					<output className="map-share-panel__status">{status}</output>
				) : null}
			</div>
		</div>
	);
}
