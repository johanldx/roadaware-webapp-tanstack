# Données locales

- `raw/` — Sources brutes (BAAC, TMJA, OSM…)
- `processed/` — Fichiers intermédiaires du pipeline

Les gros fichiers ne sont en principe **pas versionnés** (voir `.gitignore`).  
Les exports légers pour le MVP sont copiés vers `public/data/` pour le front statique.

`data/processed/roads-idf.geojson` (~33 Mo) sert uniquement au script `data:risk` (snap BAAC) et ne doit **pas** être dans `public/` : Cloudflare Pages refuse les fichiers > 25 Mo.
