/**
 * Index TMJA (sections nationales) pour jointure aux tronçons OSM.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { IDF_DEPS } from './idf-zone.mjs'
import { distanceMeters, pointToPolylineMeters } from './geo-distance.mjs'
import { lambert93ToLngLat, parseFrenchNumber } from './lambert93.mjs'
import { parseCsvSemicolon } from './csv-semicolon.mjs'

const GRID_DEG = 0.02
const TMJA_SOURCES = [
  {
    year: 2019,
    url: 'https://static.data.gouv.fr/resources/trafic-moyen-journalier-annuel-sur-le-reseau-routier-national/20211222-165040/tmja-2019.csv',
  },
  {
    year: 2023,
    url: 'https://static.data.gouv.fr/resources/trafic-moyen-journalier-annuel-sur-le-reseau-routier-national/20250818-095712/tmja-rrnc-2023.csv',
  },
]

function segmentMidLngLat(xD, yD, xF, yF) {
  const [lngD, latD] = lambert93ToLngLat(xD, yD)
  const [lngF, latF] = lambert93ToLngLat(xF, yF)
  return {
    mid: [(lngD + lngF) / 2, (latD + latF) / 2],
    line: [
      [lngD, latD],
      [lngF, latF],
    ],
  }
}

function rowInIdf(row) {
  const depD = String(row.depPrD ?? row.depprd ?? '').padStart(2, '0')
  const depF = String(row.depPrF ?? row.depprf ?? '').padStart(2, '0')
  return IDF_DEPS.has(depD) || IDF_DEPS.has(depF)
}

function rowToSection(row, fallbackYear) {
  const tmja = parseFrenchNumber(row.TMJA ?? row.tmja)
  if (tmja == null || tmja <= 0) return null

  const xD = parseFrenchNumber(row.xD ?? row.xd)
  const yD = parseFrenchNumber(row.yD ?? row.yd)
  const xF = parseFrenchNumber(row.xF ?? row.xf)
  const yF = parseFrenchNumber(row.yF ?? row.yf)
  if (xD == null || yD == null || xF == null || yF == null) return null

  const { mid, line } = segmentMidLngLat(xD, yD, xF, yF)
  const measureYear =
    parseFrenchNumber(row.anneeMesureTrafic ?? row.anneemesuretrafic) ??
    fallbackYear

  return {
    route: String(row.route ?? '').trim(),
    tmja: Math.round(tmja),
    measureYear: Math.round(measureYear),
    mid,
    line,
  }
}

async function fetchCsv(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder('latin1').decode(buf)
}

function parseTmjaCsv(text, fallbackYear) {
  const rows = parseCsvSemicolon(text)
  const sections = []
  for (const row of rows) {
    if (!rowInIdf(row)) continue
    const s = rowToSection(row, fallbackYear)
    if (s) sections.push(s)
  }
  return sections
}

function gridKey(lng, lat) {
  return `${Math.floor(lat / GRID_DEG)}:${Math.floor(lng / GRID_DEG)}`
}

export function buildTmjaIndex(sections) {
  const grid = new Map()
  for (const s of sections) {
    const key = gridKey(s.mid[0], s.mid[1])
    let bucket = grid.get(key)
    if (!bucket) {
      bucket = []
      grid.set(key, bucket)
    }
    bucket.push(s)
  }
  return { sections, grid, gridDeg: GRID_DEG }
}

async function loadTmjaSectionsFromNetwork() {
  const all = []
  for (const src of TMJA_SOURCES) {
    console.log(`  → TMJA ${src.year}`)
    const text = await fetchCsv(src.url)
    const part = parseTmjaCsv(text, src.year)
    console.log(`    ${part.length} sections IDF`)
    all.push(...part)
  }
  return all
}

export async function loadTmjaIndex(cachePath, { refresh = false } = {}) {
  if (!refresh && existsSync(cachePath)) {
    const raw = JSON.parse(readFileSync(cachePath, 'utf8'))
    return buildTmjaIndex(raw.sections)
  }

  console.log('Téléchargement TMJA (data.gouv)…')
  const sections = await loadTmjaSectionsFromNetwork()
  mkdirSync(dirname(cachePath), { recursive: true })
  writeFileSync(
    cachePath,
    JSON.stringify({
      source: 'TMJA national / RRNc — data.gouv.fr',
      exportedAt: new Date().toISOString(),
      sections,
    }),
  )
  console.log(`  cache → ${cachePath} (${sections.length} sections)`)
  return buildTmjaIndex(sections)
}

/**
 * Section TMJA la plus proche du tronçon (milieu + distance à la polyligne TMJA).
 * @param {ReturnType<typeof buildTmjaIndex>} index
 * @param {[number,number][]} coords tronçon OSM [lng,lat]
 * @param {number} maxM
 */
export function matchTmjaToSegment(index, coords, maxM = 500) {
  if (!coords.length) return null

  const midIdx = Math.floor(coords.length / 2)
  const mid = coords[midIdx] ?? coords[0]

  const gi = Math.floor(mid[1] / index.gridDeg)
  const gj = Math.floor(mid[0] / index.gridDeg)

  let best = null
  for (let di = -2; di <= 2; di++) {
    for (let dj = -2; dj <= 2; dj++) {
      const bucket = index.grid.get(`${gi + di}:${gj + dj}`)
      if (!bucket) continue
      for (const s of bucket) {
        const distMid = distanceMeters(mid, s.mid)
        const distLine = pointToPolylineMeters(mid, s.line)
        const dist = Math.min(distMid, distLine)
        if (dist > maxM) continue
        if (!best || dist < best.distM || (dist === best.distM && s.measureYear > best.measureYear)) {
          best = { ...s, distM: Math.round(dist) }
        }
      }
    }
  }

  return best
}
