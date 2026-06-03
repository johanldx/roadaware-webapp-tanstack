# Scripts de préparation des données (offline)

Pipeline Python exécuté **en local**, hors navigateur. Produit les fichiers servis dans `public/data/`.

## Étapes prévues

1. **ingest/** — Téléchargement BAAC, TMJA département pilote, extract OSM
2. **Radars fixes IDF** — `pnpm data:radars` → `public/data/radars-idf.geojson` ([liste déc. 2025](https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/), VMA à jour)
3. **Sinuosité IDF** — `pnpm data:sinuosity` → `public/data/sinuosity-idf.geojson` (1 requête Overpass, ~2–5 min ; cache dans `.sinuosity-tiles/`)
4. **Relief IDF** — `pnpm data:relief` → `public/data/relief-idf.geojson` (grille altitudes OpenTopoData + réseau routier ; cache `.elevation-grid-idf.json`)
   - `pnpm data:sinuosity:merge` — regénère le GeoJSON depuis le cache sans réseau
   - `node scripts/export-sinuosity-geojson.mjs --tiled` — 4 tuiles parallèles si la requête unique échoue
4. **Réseau routier IDF** (snap) — `pnpm data:roads` → `data/processed/roads-idf.geojson` (nécessite tuiles `data:sinuosity`, non déployé)
5. **Risque accident moto IDF** — `pnpm data:risk` → `public/data/risk-idf.geojson` ([BAAC 2019–2024](https://www.data.gouv.fr/datasets/bases-de-donnees-annuelles-des-accidents-corporels-de-la-circulation-routiere-annees-de-2005-a-2024/), tronçons OSM)
   - Score carte : percentile **accidents/km** (proxy uniforme)
   - Ratio **TMJA** si section de comptage à ≤ 500 m ([TMJA national](https://www.data.gouv.fr/datasets/trafic-moyen-journalier-annuel-sur-le-reseau-routier-national/))
   - Cache TMJA : `public/data/tmja-idf-index.json` — `pnpm data:risk -- --refresh-tmja` pour forcer le retéléchargement
2. **process/** — Sinuosité, clustering accidents (DBSCAN), jointure trafic
3. **export/** — GeoJSON / tuiles vectorielles par département

## Stack recommandée

- Python 3.11+
- geopandas, pandas, scikit-learn
- overpy / osmium pour OSM

Voir [scope §6](../docs/scope-projet-balade-moto.md) pour les principes d'architecture données.
