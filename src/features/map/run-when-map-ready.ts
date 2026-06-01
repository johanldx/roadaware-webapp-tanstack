import type { Map as MapLibreMap } from "maplibre-gl";

const MAX_FRAMES = 90;

/**
 * Exécute `fn` une fois quand le style MapLibre est prêt.
 * Réessaie sur load, idle, styledata et via rAF jusqu’à succès (navigation SPA).
 */
export function runWhenMapReady(map: MapLibreMap, fn: () => void): () => void {
	let cancelled = false;
	let rafId = 0;
	let frames = 0;
	let done = false;

	const exec = () => {
		if (cancelled || done) return true;
		if (!map.isStyleLoaded()) return false;
		fn();
		done = true;
		return true;
	};

	const tick = () => {
		if (cancelled) return;
		if (exec()) return;
		frames += 1;
		if (frames >= MAX_FRAMES) return;
		rafId = requestAnimationFrame(tick);
	};

	const schedule = () => {
		if (cancelled || done) return;
		cancelAnimationFrame(rafId);
		frames = 0;
		if (exec()) return;
		rafId = requestAnimationFrame(tick);
	};

	const onLoad = () => schedule();
	const onIdle = () => schedule();
	const onStyleData = () => {
		if (map.isStyleLoaded()) schedule();
	};

	if (map.loaded()) {
		schedule();
	} else {
		map.once("load", onLoad);
	}

	map.on("idle", onIdle);
	map.on("styledata", onStyleData);

	return () => {
		cancelled = true;
		cancelAnimationFrame(rafId);
		map.off("load", onLoad);
		map.off("idle", onIdle);
		map.off("styledata", onStyleData);
	};
}
