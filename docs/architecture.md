# Architecture du projet — Carte balade moto

> Structure cible alignée sur [scope-projet-balade-moto.md](./scope-projet-balade-moto.md).  
> Stack front : **TanStack Start / Router / Query / Store / Form** + **MapLibre GL JS** + **shadcn/ui**.

## Arborescence

```
maps-moto/
├── docs/                          # Cadrage produit & technique
│   ├── scope-projet-balade-moto.md
│   └── architecture.md            # ← ce fichier
│
├── scripts/                       # Pipeline offline (Python, hors navigateur)
│   ├── README.md
│   ├── ingest/                    # Téléchargement sources brutes
│   ├── process/                   # Sinuosité, clustering BAAC, jointure TMJA
│   └── export/                    # GeoJSON / tuiles vectorielles
│
├── data/                          # Données locales (non versionnées si volumineux)
│   ├── raw/                       # BAAC, TMJA, OSM extracts…
│   ├── processed/                 # Sorties intermédiaires
│   └── README.md
│
├── public/
│   └── data/                      # Fichiers statiques servis au front (département pilote)
│       └── .gitkeep
│
└── src/
    ├── config/                    # Constantes app & carte
    ├── types/                     # Types TypeScript partagés
    ├── stores/                    # État global (TanStack Store)
    ├── lib/                       # Utilitaires purs (map, geo, api)
    ├── features/                  # Logique métier par domaine
    │   ├── map/
    │   ├── layers/
    │   │   ├── sinuosity/
    │   │   ├── risk/
    │   │   ├── radars/
    │   │   └── rideability/
    │   └── viewport/
    ├── components/
    │   ├── ui/                    # shadcn
    │   ├── layout/                # Shell plein écran
    │   ├── map/                   # MapLibre
    │   └── panels/                # Panneaux flottants (style Google Maps)
    ├── hooks/                     # Hooks React transverses
    ├── integrations/              # Providers TanStack
    └── routes/                      # TanStack Router (file-based)
```

## Principes

| Principe | Implémentation |
|---|---|
| Statique d'abord | GeoJSON dans `public/data/`, chargés par bbox visible |
| Pas de backend | APIs live uniquement : météo, soleil |
| Calques optionnels | `layers-store` + panneau latéral |
| Gating zoom | Config dans `config/map.ts` |
| État carte | TanStack Store (`map-store`) |
| Données async | TanStack Query (`features/*/queries`) |

## Feuille de route technique (alignée scope §8)

| Version | Dossier feature principal |
|---|---|
| v0.1 MVP | `features/layers/sinuosity/` |
| v0.2 | `features/layers/rideability/` |
| v0.3 | `features/layers/radars/` |
| v0.4 | `features/layers/risk/` |

## Conventions de nommage

- **Composants** : PascalCase, un fichier par composant
- **Hooks** : `use-*` dans le feature concerné ou `src/hooks/`
- **Stores** : `*-store.ts`, export d'une instance `Store`
- **Types** : `src/types/`, pas de types métier dans les composants UI
- **Calques MapLibre** : préfixe `layer-` (ex. `layer-sinuosity`, `source-sinuosity`)
