/**
 * Requête Overpass (fetch natif, retries).
 */

const DEFAULT_URL = 'https://overpass.private.coffee/api/interpreter'
const USER_AGENT = 'Roadaware/1.0 (maps-moto)'

export async function fetchOverpass(query, opts = {}) {
  const url = opts.url ?? DEFAULT_URL
  const timeoutSec = opts.timeoutSec ?? 300
  const maxRetries = opts.maxRetries ?? 3
  const body = `data=${encodeURIComponent(query)}`

  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body,
        signal: AbortSignal.timeout(timeoutSec * 1000),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      return await res.json()
    } catch (err) {
      lastErr = err
      if (attempt < maxRetries) {
        const wait = 4000 * attempt
        console.warn(`  Overpass tentative ${attempt}/${maxRetries} — nouvel essai dans ${wait / 1000}s`)
        await new Promise((r) => setTimeout(r, wait))
      }
    }
  }
  throw lastErr
}

export function highwaysQuery(bounds, timeoutSec = 300) {
  const { south, west, north, east } = bounds
  return `[out:json][timeout:${timeoutSec}];
(
  way["highway"~"^(motorway|trunk|motorway_link|trunk_link|primary|secondary|tertiary)$"]["access"!~"private"]
    (${south},${west},${north},${east});
);
out geom;`
}
