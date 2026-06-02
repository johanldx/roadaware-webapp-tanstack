#!/usr/bin/env node
/**
 * Risque moto IDF — BAAC agrégé par tronçon OSM (snap ≤ 45 m).
 * Scores : accidents/km (partout) + ratio TMJA si section de comptage ≤ 500 m.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCsvSemicolon } from "./lib/csv-semicolon.mjs";
import {
	accidentsPer100MVehKm,
	accidentsPerKm,
	enrichPercentiles,
	enrichPercentilesBy,
	riskLevelFromPercentile,
	riskScoreFromPercentile,
} from "./lib/risk-scoring.mjs";
import {
	buildSegmentIndex,
	loadSegmentsFromGeoJson,
	loadSegmentsFromTileDir,
	snapPointToSegment,
} from "./lib/road-segment-index.mjs";
import { loadTmjaIndex, matchTmjaToSegment } from "./lib/tmja-index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/data/risk-idf.geojson");
const ROADS_GEOJSON = join(ROOT, "public/data/roads-idf.geojson");
const TILE_DIR = join(ROOT, "public/data/.sinuosity-tiles");
const TMJA_CACHE = join(ROOT, "public/data/tmja-idf-index.json");

import { IDF_DEPS, inWorkBbox, isInIdfWorkArea } from "./lib/idf-zone.mjs";

const MOTO_CATV = new Set([
	"2",
	"3",
	"4",
	"6",
	"30",
	"31",
	"32",
	"33",
	"34",
	"42",
	"43",
]);

const SNAP_MAX_M = 45;
const TMJA_MAX_M = 500;
const MIN_ACCIDENTS = 3;
const MIN_PERCENTILE = 0.72;

const REFRESH_TMJA = process.argv.includes("--refresh-tmja");

const YEARS_ARG = process.argv.find((a) => a.startsWith("--years="));
const YEARS = YEARS_ARG
	? YEARS_ARG.replace("--years=", "")
			.split(",")
			.map((y) => y.trim())
	: ["2019", "2020", "2021", "2022", "2023", "2024"];

const BAAC_RESOURCES = {
	2019: {
		caract:
			"https://static.data.gouv.fr/resources/base-de-donnees-accidents-corporels-de-la-circulation/20201105-104400/caracteristiques-2019.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/base-de-donnees-accidents-corporels-de-la-circulation/20201105-104310/vehicules-2019.csv",
	},
	2020: {
		caract:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2019/20211110-111202/caracteristiques-2020.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2019/20211110-111722/vehicules-2020.csv",
	},
	2021: {
		caract:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2020/20221024-113743/carcteristiques-2021.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2020/20221024-113925/vehicules-2021.csv",
	},
	2022: {
		caract:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2021/20231005-093927/carcteristiques-2022.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2021/20231005-094147/vehicules-2022.csv",
	},
	2023: {
		caract:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2023/20241028-103125/caract-2023.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2023/20241023-153253/vehicules-2023.csv",
	},
	2024: {
		caract:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2024/20251021-115900/caract-2024.csv",
		vehicules:
			"https://static.data.gouv.fr/resources/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2024/20251107-100240/vehicules-2024.csv",
	},
};

function parseCoord(raw) {
	const n = Number(
		String(raw ?? "")
			.trim()
			.replace(",", "."),
	);
	return Number.isFinite(n) ? n : null;
}

async function fetchCsv(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
	const buf = await res.arrayBuffer();
	return new TextDecoder("latin1").decode(buf);
}

async function loadMotoAccidentIds(year) {
	const urls = BAAC_RESOURCES[year];
	console.log(`  → vehicules-${year}`);
	const rows = parseCsvSemicolon(await fetchCsv(urls.vehicules));
	const ids = new Set();
	for (const row of rows) {
		const catv = String(row.catv ?? "").trim();
		if (!MOTO_CATV.has(catv)) continue;
		const id = row.Num_Acc ?? row.num_acc ?? row.Accident_Id ?? row.accident_id;
		if (id) ids.add(String(id));
	}
	return ids;
}

async function loadAccidentPoints(year, motoIds) {
	const urls = BAAC_RESOURCES[year];
	console.log(`  → caract-${year}`);
	const rows = parseCsvSemicolon(await fetchCsv(urls.caract));
	const points = [];

	for (const row of rows) {
		const numAcc = String(row.Num_Acc ?? row.num_acc ?? row.Accident_Id ?? "");
		if (!numAcc || !motoIds.has(numAcc)) continue;

		const dep = String(row.dep ?? "").padStart(2, "0");
		if (dep && !IDF_DEPS.has(dep)) continue;

		const lat = parseCoord(row.lat);
		const lng = parseCoord(row.long ?? row.lon);
		if (lat == null || lng == null) continue;
		if (lat < 41 || lat > 52 || lng < -6 || lng > 10) continue;
		if (!inWorkBbox(lat, lng) || !isInIdfWorkArea(lng, lat)) continue;

		points.push({ lat, lng, year });
	}
	return points;
}

function loadRoadSegments() {
	if (existsSync(ROADS_GEOJSON)) {
		console.log("Réseau routier : roads-idf.geojson");
		return loadSegmentsFromGeoJson(ROADS_GEOJSON);
	}
	const fromTiles = loadSegmentsFromTileDir(TILE_DIR);
	if (fromTiles?.length) {
		console.log(
			`Réseau routier : ${fromTiles.length} tronçons (tuiles Overpass)`,
		);
		return fromTiles;
	}
	return null;
}

function simplifyCoords(coords, maxPts = 14) {
	if (coords.length <= maxPts) return coords;
	const out = [coords[0]];
	const step = (coords.length - 1) / (maxPts - 1);
	for (let i = 1; i < maxPts - 1; i++) {
		out.push(coords[Math.round(i * step)]);
	}
	out.push(coords[coords.length - 1]);
	return out;
}

// ——— Réseau routier ———
console.log("Chargement du réseau routier IDF…");
const roadSegmentsRaw = loadRoadSegments();
const roadSegments = roadSegmentsRaw?.filter((seg) => {
	const mid = seg.coords[Math.floor(seg.coords.length / 2)] ?? seg.coords[0];
	return mid && isInIdfWorkArea(mid[0], mid[1]);
});
if (!roadSegments?.length) {
	console.error(
		"Réseau introuvable. Lancez : pnpm data:sinuosity  puis  pnpm data:roads",
	);
	process.exit(1);
}

console.log(`Index spatial (${roadSegments.length} tronçons)…`);
const roadIndex = buildSegmentIndex(roadSegments);

console.log("Index TMJA IDF…");
const tmjaIndex = await loadTmjaIndex(TMJA_CACHE, { refresh: REFRESH_TMJA });

// ——— Accidents ———
const allPoints = [];

for (const year of YEARS) {
	console.log(`Année ${year}…`);
	const motoIds = await loadMotoAccidentIds(year);
	console.log(`  ${motoIds.size} accidents avec 2-roues motorisé`);
	const pts = await loadAccidentPoints(year, motoIds);
	console.log(`  ${pts.length} points géolocalisés IDF`);
	allPoints.push(...pts);
}

console.log(
	`Total : ${allPoints.length} accidents moto IDF (${YEARS.join(", ")})`,
);

// ——— Snap + agrégation par tronçon ———
const bySegment = new Map();
let snapped = 0;
let missed = 0;

for (const p of allPoints) {
	const segId = snapPointToSegment(roadIndex, p.lat, p.lng, SNAP_MAX_M);
	if (!segId) {
		missed++;
		continue;
	}
	snapped++;
	let agg = bySegment.get(segId);
	if (!agg) {
		const seg = roadIndex.byId.get(segId);
		agg = {
			segmentId: segId,
			count: 0,
			years: new Set(),
			highway: seg?.highway ?? "",
			name: seg?.name ?? "",
			lengthM: seg?.lengthM ?? 0,
			coords: seg?.coords ?? [],
		};
		bySegment.set(segId, agg);
	}
	agg.count++;
	agg.years.add(p.year);
}

console.log(
	`Snap : ${snapped} / ${allPoints.length} (${Math.round((100 * snapped) / allPoints.length)} %), hors route : ${missed}`,
);

const rawClusters = [...bySegment.values()]
	.filter((a) => a.count >= MIN_ACCIDENTS)
	.map((a) => {
		const years = [...a.years].sort();
		const yearsFrom = Math.min(...years.map(Number));
		const yearsTo = Math.max(...years.map(Number));
		const yearSpan = yearsTo - yearsFrom + 1;
		const perKm = accidentsPerKm(a.count, a.lengthM);
		const tmja = matchTmjaToSegment(tmjaIndex, a.coords, TMJA_MAX_M);

		let trafficSource = "none";
		let tmjaValue;
		let tmjaDistM;
		let tmjaMeasureYear;
		let per100M;

		if (tmja) {
			trafficSource = "tmja";
			tmjaValue = tmja.tmja;
			tmjaDistM = tmja.distM;
			tmjaMeasureYear = tmja.measureYear;
			per100M = accidentsPer100MVehKm(a.count, tmja.tmja, a.lengthM, yearSpan);
		}

		return {
			...a,
			years,
			yearsFrom,
			yearsTo,
			yearSpan,
			accidentsPerKm: perKm,
			trafficSource,
			tmja: tmjaValue,
			tmjaDistM,
			tmjaMeasureYear,
			accidentsPer100MVehKm: per100M,
		};
	});

const withCountPct = enrichPercentiles(
	rawClusters.map((c) => ({ ...c, count: c.count })),
);
const countPctById = new Map(
	withCountPct.map((c) => [c.segmentId, c.percentile]),
);

const withDensity = enrichPercentilesBy(rawClusters, (c) => c.accidentsPerKm);

const tmjaClusters = withDensity.filter((c) => c.trafficSource === "tmja");
const withTmjaPct =
	tmjaClusters.length > 1
		? enrichPercentilesBy(tmjaClusters, (c) => c.accidentsPer100MVehKm ?? 0)
		: [];
const tmjaPctById = new Map(
	withTmjaPct.map((c) => [c.segmentId, c.percentile]),
);

const clusters = withDensity
	.map((c) => ({
		...c,
		countPercentile: countPctById.get(c.segmentId) ?? c.percentile,
		tmjaPercentile: tmjaPctById.get(c.segmentId),
	}))
	.filter((c) => c.percentile >= MIN_PERCENTILE);

let tmjaMatched = 0;
for (const c of clusters) {
	if (c.trafficSource === "tmja") tmjaMatched++;
}

const features = clusters.map((c, i) => {
	const level = riskLevelFromPercentile(c.percentile);
	const score = riskScoreFromPercentile(c.percentile);
	const props = {
		segmentId: c.segmentId,
		accidentCount: c.count,
		accidentsPerKm: c.accidentsPerKm,
		percentile: c.percentile,
		countPercentile: c.countPercentile,
		riskLevel: level,
		riskScore: score,
		highway: c.highway,
		name: c.name || undefined,
		lengthM: c.lengthM,
		yearsFrom: c.yearsFrom,
		yearsTo: c.yearsTo,
		metric: "density",
		trafficSource: c.trafficSource,
	};

	if (c.trafficSource === "tmja") {
		props.tmja = c.tmja;
		props.tmjaDistM = c.tmjaDistM;
		props.tmjaMeasureYear = c.tmjaMeasureYear;
		props.accidentsPer100MVehKm = c.accidentsPer100MVehKm;
		if (c.tmjaPercentile != null) {
			props.tmjaPercentile = c.tmjaPercentile;
		}
	}

	return {
		type: "Feature",
		id: `risk-${i}`,
		properties: props,
		geometry: {
			type: "LineString",
			coordinates: simplifyCoords(c.coords),
		},
	};
});

const collection = {
	type: "FeatureCollection",
	metadata: {
		source: "BAAC / ONISR via data.gouv.fr",
		region: "Île-de-France",
		years: YEARS,
		accidents: allPoints.length,
		snappedAccidents: snapped,
		segments: features.length,
		metric:
			"Percentile IDF sur accidents/km (carte) ; ratio TMJA si comptage ≤ 500 m",
		tmjaSections: tmjaIndex.sections.length,
		tmjaMatchedSegments: tmjaMatched,
		tmjaMaxDistM: TMJA_MAX_M,
		snapMaxM: SNAP_MAX_M,
		minAccidents: MIN_ACCIDENTS,
		minPercentile: MIN_PERCENTILE,
		exportedAt: new Date().toISOString(),
	},
	features,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(collection));
const mb = (Buffer.byteLength(JSON.stringify(collection)) / 1e6).toFixed(2);
console.log(
	`✓ ${features.length} tronçons à risque (${tmjaMatched} avec TMJA) → ${OUT} (${mb} Mo)`,
);
