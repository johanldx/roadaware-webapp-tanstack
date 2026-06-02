#!/usr/bin/env node
/**
 * Relief / pentes IDF — grille altitude + segments sinuosité.
 * Sortie optimisée : uniquement les virages avec relief notable.
 *
 * Usage: node scripts/export-relief-geojson.mjs [--force]
 * Sortie: public/data/relief-idf.geojson
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadElevationGrid } from './lib/elevation-grid.mjs'
import { loadSegmentsFromTileDir } from './lib/road-segment-index.mjs'
import {
  reliefScoreForCoords,
  RELIEF_DISPLAY_MIN,
  simplifyCoords,
} from './lib/relief-metrics.mjs'
import { scoreForCoords } from './lib/sinuosity-metrics.mjs'

const FORCE = process.argv.includes('--force')
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TILE_DIR = join(ROOT, 'public/data/.sinuosity-tiles')
const OUT = join(ROOT, 'public/data/relief-idf.geojson')

async function main() {
  console.log('Grille altitudes IDF…')
  const grid = await loadElevationGrid({ force: FORCE })

  console.log('Lecture segments routiers OSM…')
  const roads = loadSegmentsFromTileDir(TILE_DIR)
  if (!roads?.length) {
    throw new Error('Segments introuvables. Lancez d’abord : npm run data:sinuosity')
  }
  const features = []

  for (const road of roads) {
    const coords = road.coords
    if (!coords?.length) continue
    const highway = road.highway ?? ''
    const sinuosity = Number(scoreForCoords(coords, 160, highway) ?? 0)

    const relief = reliefScoreForCoords(grid, coords, sinuosity)
    if (relief < RELIEF_DISPLAY_MIN) continue

    features.push({
      type: 'Feature',
      properties: {
        relief: Math.round(relief * 1000) / 1000,
        sinuosity: Math.round(sinuosity * 1000) / 1000,
        highway,
        name: road.name || undefined,
      },
      geometry: {
        type: 'LineString',
        coordinates: simplifyCoords(coords),
      },
    })
  }

  const collection = {
    type: 'FeatureCollection',
    metadata: {
      region: 'Île-de-France',
      source: 'OpenStreetMap (tronçons bruts) + OpenTopoData (ASTER30m)',
      displayMin: RELIEF_DISPLAY_MIN,
      segments: features.length,
      exportedAt: new Date().toISOString(),
    },
    features,
  }

  writeFileSync(OUT, JSON.stringify(collection))
  const kb = Math.round((JSON.stringify(collection).length / 1024) * 10) / 10
  console.log(`Écrit ${OUT} — ${features.length} tronçons (${kb} Ko JSON)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
