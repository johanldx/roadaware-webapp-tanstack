/**
 * Grille fixe sans fusion (évite les méga-zones à 1000+ accidents).
 * Score affiché = percentile IDF, pas le brut Paris-centrique.
 */

const EARTH_RADIUS_M = 6_371_000
const MAX_PER_CELL = 48

function toRad(d) {
  return (d * Math.PI) / 180
}

function aggregateCell(points, cellM) {
  let latSum = 0
  let lngSum = 0
  const years = new Set()
  for (const p of points) {
    latSum += p.lat
    lngSum += p.lng
    if (p.year) years.add(p.year)
  }
  const n = points.length
  return {
    lat: latSum / n,
    lng: lngSum / n,
    count: n,
    years: [...years].sort(),
    cellM,
    killed: 0,
    injured: 0,
  }
}

/** Subdivise une cellule trop grosse en 4 quartiers. */
function subdivideCell(points, cellM, minPoints, depth = 0) {
  if (points.length <= MAX_PER_CELL || depth >= 3) {
    return points.length >= minPoints ? [aggregateCell(points, cellM)] : []
  }

  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const subM = cellM / 2

  const quads = [[], [], [], []]
  for (const p of points) {
    const i = (p.lat >= midLat ? 0 : 2) + (p.lng >= midLng ? 0 : 1)
    quads[i].push(p)
  }

  return quads.flatMap((q) => subdivideCell(q, subM, minPoints, depth + 1))
}

export function gridCluster(points, cellM = 850, minPoints = 6) {
  if (points.length === 0) return []

  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length
  const cosLat = Math.cos(toRad(lat0))
  const dLat = cellM / 111_320
  const dLng = cellM / (111_320 * cosLat)

  const cells = new Map()

  for (const p of points) {
    const row = Math.floor(p.lat / dLat)
    const col = Math.floor(p.lng / dLng)
    const key = `${row}:${col}`
    let cell = cells.get(key)
    if (!cell) {
      cell = { points: [] }
      cells.set(key, cell)
    }
    cell.points.push(p)
  }

  const clusters = []
  for (const cell of cells.values()) {
    if (cell.points.length < minPoints) continue
    clusters.push(...subdivideCell(cell.points, cellM, minPoints))
  }

  return clusters.sort((a, b) => b.count - a.count)
}

export function enrichPercentiles(clusters) {
  const sorted = [...clusters].sort((a, b) => a.count - b.count)
  const n = sorted.length
  const rank = new Map()
  sorted.forEach((c, i) => {
    rank.set(c, n <= 1 ? 1 : (i + 1) / n)
  })
  return clusters.map((c) => ({
    ...c,
    percentile: Math.round(rank.get(c) * 1000) / 1000,
  }))
}

export function riskLevelFromPercentile(percentile) {
  if (percentile >= 0.9) return 3
  if (percentile >= 0.75) return 2
  return 1
}

export function riskScoreFromPercentile(percentile) {
  if (percentile < 0.55) return 0.3
  return Math.round((0.35 + (percentile - 0.55) * 1.15) * 1000) / 1000
}

export function clusterRadiusM(cellM) {
  return Math.round(cellM * 0.55)
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
