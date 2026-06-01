/**
 * Métriques sinuosité v4 — virages « moto », y compris routes rapides (N118…).
 * Densifie la géométrie OSM (peu de nœuds) avant mesure des changements de cap.
 */

export const DISPLAY_MIN = 0.62
export const MOTORWAY_MIN = 0.68
export const MOTORWAY_TYPES = new Set([
  'motorway',
  'trunk',
  'motorway_link',
  'trunk_link',
])

const MAIN_ROAD_TYPES = new Set(['primary', 'secondary'])

const EARTH_RADIUS_M = 6_371_000
const MIN_SIGNIFICANT_TURNS = 2
const MIN_PATH_M = 200
const MIN_STRAIGHT_M = 80

export function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function pathLengthMeters(coords) {
  let sum = 0
  for (let i = 1; i < coords.length; i++) {
    sum += distanceMeters(coords[i - 1], coords[i])
  }
  return sum
}

function bearingDegrees(a, b) {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const y =
    Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lng2 - lng1) * Math.PI) / 180)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function densifyStepM(highway) {
  if (MOTORWAY_TYPES.has(highway ?? '')) return 12
  if (MAIN_ROAD_TYPES.has(highway ?? '')) return 15
  return 20
}

function significantTurnDeg(highway) {
  if (MOTORWAY_TYPES.has(highway ?? '')) return 10
  if (MAIN_ROAD_TYPES.has(highway ?? '')) return 12
  return 15
}

/** Interpolation le long des segments OSM (virages doux entre deux nœuds). */
export function densifyCoords(coords, stepM = 15) {
  if (coords.length < 2) return coords
  const out = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]
    const b = coords[i]
    const segLen = distanceMeters(a, b)
    const steps = Math.max(1, Math.ceil(segLen / stepM))
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  }
  return out
}

export function computeCurvatureMetrics(
  coords,
  minLengthM = MIN_PATH_M,
  highway,
) {
  if (coords.length < 2) return null

  const stepM = densifyStepM(highway)
  const dense = densifyCoords(coords, stepM)
  if (dense.length < 3) return null

  const pathM = pathLengthMeters(dense)
  const straight = distanceMeters(dense[0], dense[dense.length - 1])
  if (pathM < minLengthM || straight < MIN_STRAIGHT_M) return null

  const turnDeg = significantTurnDeg(highway)
  let significantTurnSum = 0
  let significantTurns = 0
  let maxTurn = 0
  let prev = null

  for (let i = 1; i < dense.length; i++) {
    const b = bearingDegrees(dense[i - 1], dense[i])
    if (prev != null) {
      let d = Math.abs(b - prev)
      if (d > 180) d = 360 - d
      if (d >= turnDeg) {
        significantTurnSum += d
        significantTurns++
        if (d > maxTurn) maxTurn = d
      }
    }
    prev = b
  }

  const pathKm = pathM / 1000
  if (pathKm < 0.05 || significantTurns < MIN_SIGNIFICANT_TURNS) return null

  return {
    ratio: pathM / Math.max(straight, 1),
    turnDensity: significantTurnSum / pathKm,
    pathM,
    significantTurns,
    maxTurn,
  }
}

export function metricsToScore(metrics) {
  const ratioPart = Math.min(
    1,
    Math.max(0, (metrics.ratio - 1.06) / 0.34),
  )
  const turnPart = Math.min(
    1,
    Math.max(0, (metrics.turnDensity - 32) / 60),
  )
  return Math.round((ratioPart * 0.3 + turnPart * 0.7) * 1000) / 1000
}

export function scoreForCoords(coords, minLengthM = MIN_PATH_M, highway) {
  const m = computeCurvatureMetrics(coords, minLengthM, highway)
  if (!m) return null
  return metricsToScore(m)
}

export function passesQualityGate(metrics, highway) {
  if (metrics.significantTurns < MIN_SIGNIFICANT_TURNS) return false
  if (metrics.pathM < MIN_PATH_M) return false

  const minDensity = MOTORWAY_TYPES.has(highway ?? '') ? 32 : 40
  if (metrics.turnDensity < minDensity) return false

  const minMaxTurn = MOTORWAY_TYPES.has(highway ?? '') ? 14 : 18
  if (metrics.maxTurn < minMaxTurn && metrics.turnDensity < 48) return false

  if (metrics.ratio < 1.04 && metrics.turnDensity < 45) return false

  return true
}

export function shouldKeep(score, highway) {
  const min =
    highway && MOTORWAY_TYPES.has(highway) ? MOTORWAY_MIN : DISPLAY_MIN
  return score >= min
}

export function segmentizeAndScore(coords, highway) {
  const maxSegmentM = 1000
  const minSegmentM = 200
  const minLengthM = MIN_PATH_M
  if (coords.length < 2) return []

  const out = []
  let startIdx = 0
  let acc = 0

  for (let i = 1; i < coords.length; i++) {
    acc += distanceMeters(coords[i - 1], coords[i])
    const isLast = i === coords.length - 1
    if (acc >= maxSegmentM || isLast) {
      const seg = coords.slice(startIdx, i + 1)
      const metrics = computeCurvatureMetrics(seg, minLengthM, highway)
      const score = metrics ? metricsToScore(metrics) : null
      if (
        score != null &&
        metrics &&
        pathLengthMeters(seg) >= minSegmentM &&
        shouldKeep(score, highway) &&
        passesQualityGate(metrics, highway)
      ) {
        out.push({ coords: seg, score })
      }
      startIdx = i
      acc = 0
    }
  }
  return out
}
