// Windvoorspelling voor de locatie van de zeilschool (Uitgeest), via Open-Meteo
// (gratis, geen API-key nodig). Faalt de aanroep of ligt de datum buiten het
// voorspelbereik (~16 dagen), dan geven we gewoon null terug — het weer is
// altijd een leuk extraatje, nooit iets waar de rest van de kaart op wacht.
const LAT = 52.5316
const LON = 4.7256

export interface DagWeer {
  windBft: number
  windRichting: string
}

let cache: { opgehaaldOp: number; perDatum: Record<string, DagWeer> } | null = null
const CACHE_GELDIG_MS = 30 * 60 * 1000

function gradenNaarRichting(graden: number): string {
  const richtingen = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
  return richtingen[Math.round(graden / 45) % 8]
}

// Beaufortschaal, drempels in km/u.
const BEAUFORT_DREMPELS_KMH = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]

function kmhNaarBeaufort(kmh: number): number {
  let kracht = 0
  for (const drempel of BEAUFORT_DREMPELS_KMH) {
    if (kmh < drempel) return kracht
    kracht += 1
  }
  return kracht
}

export async function haalWeerVoorDatum(datum: string): Promise<DagWeer | null> {
  const nu = Date.now()
  if (!cache || nu - cache.opgehaaldOp > CACHE_GELDIG_MS) {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=wind_speed_10m_max,wind_direction_10m_dominant&timezone=Europe%2FAmsterdam&forecast_days=16`,
      )
      if (!res.ok) return null
      const json = await res.json()
      const dagen: string[] = json?.daily?.time ?? []
      const perDatum: Record<string, DagWeer> = {}
      dagen.forEach((dag, i) => {
        perDatum[dag] = {
          windBft: kmhNaarBeaufort(json.daily.wind_speed_10m_max[i]),
          windRichting: gradenNaarRichting(json.daily.wind_direction_10m_dominant[i]),
        }
      })
      cache = { opgehaaldOp: nu, perDatum }
    } catch {
      return null
    }
  }
  return cache?.perDatum[datum] ?? null
}
