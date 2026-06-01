#!/usr/bin/env node
/**
 * Exporte les radars fixes IDF depuis le jeu data.gouv mis à jour (déc. 2025).
 * https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CSV_URL =
  'https://static.data.gouv.fr/resources/liste-des-radars-fixes-en-france/20251230-134204/jeu-de-donnees-liste-des-radars-fixes-en-france-12-2025.csv'

/** Radars de vitesse fixes (hors feux rouges, tronçon, passage à niveau). */
const FIXED_TYPES = new Set(['ETF', 'ETD', 'ETT', 'ETU'])

import { inWorkBbox, isInIdfWorkArea } from './lib/idf-zone.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/data/radars-idf.geojson')

function parseCoord(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.')
    .replace(/^\+/, '')
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error(`Coordonnée invalide: ${raw}`)
  return n
}

function parseCsvSemicolon(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(';').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = []
    let cur = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ';' && !inQuotes) {
        values.push(cur)
        cur = ''
      } else cur += ch
    }
    values.push(cur)
    const row = Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
    const lngKey = Object.keys(row).find((k) => k.toLowerCase().includes('longitude'))
    if (lngKey && lngKey !== 'Longitude') {
      row.Longitude = row[lngKey]
    }
    const vmaKey = Object.keys(row).find((k) => k.trim() === 'VMA' || k.startsWith('VMA'))
    if (vmaKey) row.VMA = row[vmaKey]
    return row
  })
}

const res = await fetch(CSV_URL)
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const buf = await res.arrayBuffer()
const text = new TextDecoder('latin1').decode(buf)
const rows = parseCsvSemicolon(text)

const features = []
for (const row of rows) {
  const radarType = row['Type de radar']
  if (!FIXED_TYPES.has(radarType)) continue

  const lat = parseCoord(row.Latitude)
  const lng = parseCoord(row.Longitude ?? row[' Longitude'])
  if (!inWorkBbox(lat, lng) || !isInIdfWorkArea(lng, lat)) continue

  const vmaRaw = String(row.VMA ?? '').trim()
  const speedLimit = /^\d+$/.test(vmaRaw) ? Number(vmaRaw) : null

  features.push({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      id: row['Numéro de radar'],
      radarType,
      speedLimit,
      inServiceSince: row['Date de mise en service'] || null,
    },
  })
}

mkdirSync(dirname(OUT), { recursive: true })
const collection = {
  type: 'FeatureCollection',
  metadata: {
    source: 'https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/',
    version: '2025-12',
    exportedAt: new Date().toISOString(),
    count: features.length,
  },
  features,
}

writeFileSync(OUT, JSON.stringify(collection), 'utf-8')
console.log(`✓ ${features.length} radars fixes IDF (déc. 2025) → ${OUT}`)
