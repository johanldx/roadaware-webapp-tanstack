import type { Map as MapLibreMap } from "maplibre-gl";

import { APP_NAME } from "#/config/app";
import { RADARS_HIT_LAYER_ID } from "#/features/layers/radars/layer";
import { RIDEABILITY_ZONES_HIT_LAYER } from "#/features/rideability/layer";
import {
	layerLabelsFromPayload,
	type MapShareState,
} from "#/lib/share/map-share-payload";

const CARD_W = 1080;
const CARD_H = 1350;
const CARD_RADIUS = 40;
const MAP_PREVIEW_W = CARD_W - 96;
const MAP_PREVIEW_H = 600;
const CONTENT_W = CARD_W - 96;

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function formatShareTime(iso?: string): string {
	if (!iso) return "Vue carte";
	const d = new Date(iso);
	return d.toLocaleString("fr-FR", {
		timeZone: "Europe/Paris",
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function basemapLabel(basemapId: MapShareState["basemapId"]): string {
	return basemapId === "satellite" ? "Satellite" : "Plan";
}

function centerLabel(state: MapShareState): string {
	return `${state.lat.toFixed(3)}, ${state.lng.toFixed(3)}`;
}

function ellipsizeText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (ctx.measureText(text).width <= maxWidth) return text;
	let value = text;
	while (value.length > 3) {
		value = value.slice(0, -1);
		const candidate = `${value}…`;
		if (ctx.measureText(candidate).width <= maxWidth) return candidate;
	}
	return "…";
}

function scoreSummaryLabel(scores: number[]): string {
	if (scores.length === 0) return "n/d";
	const avg = Math.round(
		scores.reduce((sum, value) => sum + value, 0) / scores.length,
	);
	return `${avg}/100`;
}

function visibleScoreSamples(map: MapLibreMap): number[] {
	if (!map.getLayer(RIDEABILITY_ZONES_HIT_LAYER)) return [];
	const features = map.queryRenderedFeatures({
		layers: [RIDEABILITY_ZONES_HIT_LAYER],
	});
	const scores: number[] = [];
	for (const feature of features) {
		const score = Number(feature.properties?.score);
		if (Number.isFinite(score)) scores.push(score);
	}
	return scores;
}

function visibleRadarCount(map: MapLibreMap): number {
	if (!map.getLayer(RADARS_HIT_LAYER_ID)) return 0;
	const features = map.queryRenderedFeatures({
		layers: [RADARS_HIT_LAYER_ID],
	});
	const seen = new Set<string>();
	for (const feature of features) {
		const id = String(feature.properties?.id ?? feature.id ?? "");
		if (id) seen.add(id);
	}
	return seen.size;
}

function drawInfoBlock(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	title: string,
	value: string,
) {
	roundRect(ctx, x, y, 468, 140, 24);
	ctx.fillStyle = "rgba(47, 66, 52, 0.05)";
	ctx.fill();
	ctx.strokeStyle = "rgba(47, 66, 52, 0.12)";
	ctx.lineWidth = 1;
	ctx.stroke();

	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 28px Inter, system-ui, sans-serif";
	ctx.fillText(title, x + 24, y + 48);
	ctx.fillStyle = "#2f4234";
	ctx.font = "700 54px Inter, system-ui, sans-serif";
	ctx.fillText(value, x + 24, y + 105);
}

export async function exportMapShareImage(
	map: MapLibreMap,
	state: MapShareState,
): Promise<Blob> {
	const mapCanvas = map.getCanvas();
	const canvas = document.createElement("canvas");
	canvas.width = CARD_W;
	canvas.height = CARD_H;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D indisponible");

	const drawMapSafe = (
		dx: number,
		dy: number,
		dw: number,
		dh: number,
		clipRadius = 0,
	) => {
		try {
			if (clipRadius > 0) {
				ctx.save();
				roundRect(ctx, dx, dy, dw, dh, clipRadius);
				ctx.clip();
			}
			ctx.drawImage(mapCanvas, dx, dy, dw, dh);
			if (clipRadius > 0) ctx.restore();
			// Détecte un canvas "tainted" immédiatement.
			ctx.getImageData(0, 0, 1, 1);
			return true;
		} catch {
			if (clipRadius > 0) ctx.restore();
			return false;
		}
	};

	roundRect(ctx, 0, 0, CARD_W, CARD_H, CARD_RADIUS);
	ctx.fillStyle = "#f6f7f5";
	ctx.fill();
	ctx.strokeStyle = "rgba(47, 66, 52, 0.14)";
	ctx.lineWidth = 2;
	ctx.stroke();

	const cardInnerX = 48;
	const brandY = 76;
	ctx.fillStyle = "#2f4234";
	ctx.font = "700 56px 'Instrument Serif', Georgia, serif";
	ctx.fillText(APP_NAME, cardInnerX + 58, brandY);
	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 28px Inter, system-ui, sans-serif";
	ctx.fillText("Snapshot roulabilite IDF", cardInnerX + 58, brandY + 44);

	// Logo mark simple aligné avec la landing
	ctx.beginPath();
	ctx.arc(cardInnerX + 24, brandY - 16, 22, 0, Math.PI * 2);
	ctx.fillStyle = "#2f4234";
	ctx.fill();
	ctx.beginPath();
	ctx.arc(cardInnerX + 24, brandY - 16, 10, 0, Math.PI * 2);
	ctx.fillStyle = "#f6f7f5";
	ctx.fill();

	const mapX = cardInnerX;
	const mapY = 156;
	const previewDrawn = drawMapSafe(
		mapX,
		mapY,
		MAP_PREVIEW_W,
		MAP_PREVIEW_H,
		14,
	);
	if (!previewDrawn) {
		roundRect(ctx, mapX, mapY, MAP_PREVIEW_W, MAP_PREVIEW_H, 14);
		const mapFallback = ctx.createLinearGradient(
			0,
			mapY,
			0,
			mapY + MAP_PREVIEW_H,
		);
		mapFallback.addColorStop(0, "#e9efe9");
		mapFallback.addColorStop(1, "#dce7dc");
		ctx.fillStyle = mapFallback;
		ctx.fill();
		ctx.strokeStyle = "rgba(47, 66, 52, 0.12)";
		ctx.stroke();
	}

	const overlay = ctx.createLinearGradient(0, mapY, 0, mapY + MAP_PREVIEW_H);
	overlay.addColorStop(0, "rgba(47, 66, 52, 0.00)");
	overlay.addColorStop(1, "rgba(47, 66, 52, 0.15)");
	ctx.fillStyle = overlay;
	ctx.fillRect(mapX, mapY, MAP_PREVIEW_W, MAP_PREVIEW_H);

	const visibleScores = visibleScoreSamples(map);
	const radarCount = visibleRadarCount(map);
	const layers = layerLabelsFromPayload(state);
	const time = formatShareTime(state.at);
	const scoreLabel = scoreSummaryLabel(visibleScores);
	const radarLabel = `${radarCount}`;
	const zoomLabel = `${state.zoom.toFixed(1)}x`;

	// Blocs infos utiles
	const infoY = mapY + MAP_PREVIEW_H + 36;
	drawInfoBlock(ctx, cardInnerX, infoY, "Score moyen visible", scoreLabel);
	drawInfoBlock(ctx, cardInnerX + 516, infoY, "Radars visibles", radarLabel);

	const row2Y = infoY + 200;
	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 26px Inter, system-ui, sans-serif";
	ctx.fillText("Fond", cardInnerX, row2Y);
	ctx.fillStyle = "#2f4234";
	ctx.font = "700 42px Inter, system-ui, sans-serif";
	ctx.fillText(basemapLabel(state.basemapId), cardInnerX, row2Y + 54);

	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 26px Inter, system-ui, sans-serif";
	ctx.fillText("Zoom", cardInnerX + 260, row2Y);
	ctx.fillStyle = "#2f4234";
	ctx.font = "700 42px Inter, system-ui, sans-serif";
	ctx.fillText(zoomLabel, cardInnerX + 260, row2Y + 54);

	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 26px Inter, system-ui, sans-serif";
	ctx.fillText("Centre", cardInnerX + 444, row2Y);
	ctx.fillStyle = "#2f4234";
	ctx.font = "600 34px Inter, system-ui, sans-serif";
	ctx.fillText(centerLabel(state), cardInnerX + 444, row2Y + 54);

	ctx.fillStyle = "#6d7c74";
	ctx.font = "500 26px Inter, system-ui, sans-serif";
	ctx.fillText(time, cardInnerX, row2Y + 110);

	const layerLine = layers.length > 0 ? layers.join(" · ") : "Carte seule";
	ctx.fillStyle = "#2f4234";
	ctx.font = "500 27px Inter, system-ui, sans-serif";
	const trimmedLayerLine = ellipsizeText(ctx, layerLine, CONTENT_W);
	ctx.fillText(trimmedLayerLine, cardInnerX, row2Y + 156);

	ctx.fillStyle = "rgba(47, 66, 52, 0.72)";
	ctx.font = "400 22px Inter, system-ui, sans-serif";
	ctx.fillText(
		"Outil d'information - pas de navigation GPS",
		cardInnerX,
		CARD_H - 38,
	);

	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error("Export PNG échoué (blob vide)"));
				},
				"image/png",
				0.92,
			);
		} catch (err) {
			reject(err);
		}
	});
}
