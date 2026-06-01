#!/usr/bin/env node
/**
 * Recalcule les scores (sinuosité v3) et ne garde que les vrais virages moto.
 *
 * Usage : node scripts/refine-sinuosity-geojson.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isInIdfWorkArea } from './lib/idf-zone.mjs'
import {
  computeCurvatureMetrics,
  DISPLAY_MIN,
  metricsToScore,
  passesQualityGate,
  shouldKeep,
} from './lib/sinuosity-metrics.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const IN = join(ROOT, 'public/data/sinuosity-idf.geojson')
const OUT = IN

console.log('Lecture', IN)
const raw = JSON.parse(readFileSync(IN, 'utf-8'))
const features = []

for (const f of raw.features) {
  if (f.geometry?.type !== 'LineString') continue
  const highway = f.properties?.highway ?? ''
  const metrics = computeCurvatureMetrics(f.geometry.coordinates)
  if (!metrics) continue
  const score = metricsToScore(metrics)
  if (!shouldKeep(score, highway) || !passesQualityGate(metrics, highway)) {
    continue
  }
  const coords = f.geometry.coordinates
  const mid = coords[Math.floor(coords.length / 2)] ?? coords[0]
  if (!mid || !isInIdfWorkArea(mid[0], mid[1])) continue
  features.push({
    type: 'Feature',
    properties: { sinuosity: score, highway },
    geometry: f.geometry,
  })
}

const collection = {
  type: 'FeatureCollection',
  metadata: {
    ...raw.metadata,
    refinedAt: new Date().toISOString(),
    algorithm: 'curvature-v3',
    displayMin: DISPLAY_MIN,
    segments: features.length,
  },
  features,
}

writeFileSync(OUT, JSON.stringify(collection))
const mb = (Buffer.byteLength(JSON.stringify(collection)) / 1e6).toFixed(2)
console.log(
  `✓ ${features.length} tronçons sinueux (sur ${raw.features.length}) → ${OUT} (${mb} Mo)`,
)
