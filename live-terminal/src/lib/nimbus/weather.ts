/**
 * Free weather: Synoptic/MADIS (NOAA WRH) primary observed max +
 * aviationweather.gov METAR fallback + Iowa Mesonet (US) +
 * Open-Meteo ensembles (forecast only — never for lock).
 *
 * Observed max uses resolution-station temps with Math.round (whole) /
 * one_decimal — never Open-Meteo, never biasC on the resolution path.
 */
import { applyBiasC, cToF } from './buckets'
import { remainingHeatEstimate, type WeatherSnap } from './engine'
import {
  stationResolutionId,
  stationSourceRisk,
  type Station,
} from './stations'
import { ORIGIN, UA } from '../endpoints'

const APIKEY_JS = `${ORIGIN.gov}/source/wrh/apiKey.js`
const SYNOPTIC = `${ORIGIN.synoptic}/v2/stations/timeseries`
const METAR_URL = `${ORIGIN.metar}/api/data/metar`
const TAF_URL = `${ORIGIN.metar}/api/data/taf`
const ENSEMBLE_URL = `${ORIGIN.ensemble}/v1/ensemble`
const IOWA_ASOS = `${ORIGIN.iowa}/cgi-bin/request/asos.py`

export interface MetarObs {
  icao: string
  tempC: number | null
  observedMaxC: number | null
  raw?: string
  reportTime?: string
}

export interface EnsembleDay {
  date: string
  membersC: number[]
  meanC: number
  maxC: number
  minC: number
}

export type ObsSource =
  | 'synoptic'
  | 'metar'
  | 'iowa_mesonet'
  | 'none'
  | 'hko_stub'
  | 'wu_stub'

export type WeatherSnapExtra = WeatherSnap & {
  date: string
  ensembleMean: number | null
  warnings: string[]
  obsSource: ObsSource
  officialUrl?: string
  resolutionStationId?: string
  sourceRisk?: boolean
  heatingDone?: boolean
  soFarEqualsPred?: boolean
  climateClass?: string
}

let mesoTokenCache: { token: string; at: number } | null = null

async function fetchText(
  url: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 12_000,
): Promise<T> {
  return JSON.parse(await fetchText(url, init, timeoutMs)) as T
}

export async function fetchMesoToken(): Promise<string> {
  const now = Date.now()
  if (mesoTokenCache && now - mesoTokenCache.at < 3_600_000) {
    return mesoTokenCache.token
  }
  const js = await fetchText(APIKEY_JS, {
    headers: { 'User-Agent': UA, Accept: '*/*' },
  })
  const m =
    js.match(/mesoToken\s*=\s*'([^']+)'/) ||
    js.match(/mesoToken\s*=\s*"([^"]+)"/)
  if (!m) throw new Error('Could not parse mesoToken from weather.gov apiKey.js')
  mesoTokenCache = { token: m[1], at: now }
  return m[1]
}

function wrhReferer(stid: string): string {
  return `https://www.weather.gov/wrh/timeseries?site=${stid.toLowerCase()}`
}

function roundObs(temp: number, rounding: Station['rounding']): number {
  if (rounding === 'one_decimal') return Math.round(temp * 10) / 10
  return Math.round(temp)
}

function localParts(
  timezone: string,
  d = new Date(),
): { date: string; hour: number } {
  try {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }).format(d),
    )
    return { date, hour }
  } catch {
    return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() }
  }
}

function localDateOfIso(iso: string, timezone: string): string | null {
  try {
    let s = iso
    if (
      s.length >= 5 &&
      (s.at(-5) === '+' || s.at(-5) === '-') &&
      s.at(-3) !== ':'
    ) {
      s = `${s.slice(0, -2)}:${s.slice(-2)}`
    }
    const dt = new Date(s)
    if (Number.isNaN(dt.getTime())) return null
    return localParts(timezone, dt).date
  } catch {
    return null
  }
}

export async function fetchSynopticDayMax(
  station: Station,
  targetDate: string,
): Promise<{ max: number; rawMax: number; n: number } | null> {
  const stid = stationResolutionId(station)
  const token = await fetchMesoToken()
  const units = station.unit === 'F' ? 'english' : 'metric'
  const url =
    `${SYNOPTIC}?STID=${encodeURIComponent(stid)}` +
    `&showemptystations=1&recent=4320&complete=1` +
    `&token=${encodeURIComponent(token)}&obtimezone=local` +
    `&units=${units}`
  const data = await fetchJson<{
    SUMMARY?: { RESPONSE_CODE?: number }
    STATION?: Array<{
      OBSERVATIONS?: {
        date_time?: string[]
        air_temp_set_1?: Array<number | null>
      }
    }>
  }>(
    url,
    {
      headers: {
        'User-Agent': UA,
        Referer: wrhReferer(stid),
        Origin: 'https://www.weather.gov',
        Accept: 'application/json, text/javascript, */*; q=0.01',
      },
    },
    30_000,
  )
  const summary = data.SUMMARY || {}
  if (summary.RESPONSE_CODE != 1 || !data.STATION?.length) {
    throw new Error(`Synoptic error ${stid}: ${JSON.stringify(summary)}`)
  }
  const ob = data.STATION[0].OBSERVATIONS || {}
  const times = ob.date_time || []
  const temps = ob.air_temp_set_1 || []
  let rawMax = -Infinity
  let n = 0
  for (let i = 0; i < times.length; i++) {
    const temp = temps[i]
    if (temp == null || Number.isNaN(Number(temp))) continue
    const day = localDateOfIso(String(times[i]), station.timezone)
    if (day !== targetDate) continue
    const raw = Number(temp)
    n++
    if (raw > rawMax) rawMax = raw
  }
  if (n === 0 || !Number.isFinite(rawMax)) return null
  return {
    rawMax,
    max: roundObs(rawMax, station.rounding ?? 'whole'),
    n,
  }
}

export async function fetchMetars(icaos: string[]): Promise<MetarObs[]> {
  if (!icaos.length) return []
  const ids = [...new Set(icaos)].join(',')
  const url = `${METAR_URL}?ids=${encodeURIComponent(ids)}&format=json&hours=30`
  try {
    const rows = await fetchJson<any[]>(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    const byIcao = new Map<string, MetarObs>()
    for (const r of rows || []) {
      const icao = String(r.icaoId || r.stationId || '').toUpperCase()
      if (!icao) continue
      const tempC =
        typeof r.temp === 'number'
          ? r.temp
          : typeof r.tempC === 'number'
            ? r.tempC
            : null
      const prev = byIcao.get(icao)
      const observedMaxC =
        tempC == null
          ? (prev?.observedMaxC ?? null)
          : Math.max(prev?.observedMaxC ?? tempC, tempC)
      byIcao.set(icao, {
        icao,
        tempC,
        observedMaxC,
        raw: r.rawOb || r.rawText,
        reportTime: r.reportTime || r.obsTime,
      })
    }
    return [...byIcao.values()]
  } catch (e) {
    console.warn('[weather] METAR failed', e)
    return []
  }
}

export async function fetchMetarDayMax(
  station: Station,
  targetDate: string,
): Promise<{ max: number; rawMax: number; n: number } | null> {
  const icao = station.icao.toUpperCase()
  const url = `${METAR_URL}?ids=${encodeURIComponent(icao)}&format=json&hours=36`
  try {
    const rows = await fetchJson<any[]>(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    let rawMax = -Infinity
    let n = 0
    for (const r of rows || []) {
      const tempC =
        typeof r.temp === 'number'
          ? r.temp
          : typeof r.tempC === 'number'
            ? r.tempC
            : null
      if (tempC == null) continue
      const rt = r.reportTime || r.obsTime
      let day: string | null = null
      if (rt) {
        try {
          const iso = String(rt).endsWith('Z')
            ? String(rt).replace('Z', '+00:00')
            : String(rt)
          day = localParts(station.timezone, new Date(iso)).date
        } catch {
          day = null
        }
      }
      if (day && day !== targetDate) continue
      const raw = station.unit === 'F' ? cToF(tempC) : tempC
      n++
      if (raw > rawMax) rawMax = raw
    }
    if (n === 0 || !Number.isFinite(rawMax)) return null
    return {
      rawMax,
      max: roundObs(rawMax, station.rounding ?? 'whole'),
      n,
    }
  } catch (e) {
    console.warn('[weather] METAR day-max failed', e)
    return null
  }
}

export async function fetchIowaDayMax(
  station: Station,
  targetDate: string,
): Promise<{ max: number; rawMax: number; n: number } | null> {
  if (!station.icao.startsWith('K') || station.icao.length !== 4) return null
  const st = station.icao.slice(1).toUpperCase()
  const varName = station.unit === 'F' ? 'tmpf' : 'tmpc'
  const y = targetDate.slice(0, 4)
  const mo = targetDate.slice(5, 7)
  const d = targetDate.slice(8, 10)
  const url =
    `${IOWA_ASOS}?station=${st}&data=${varName}` +
    `&year1=${y}&month1=${mo}&day1=${d}&year2=${y}&month2=${mo}&day2=${d}` +
    `&tz=Etc/UTC&format=onlycomma&latlon=no&elev=no&missing=null&trace=null&direct=no`
  try {
    const text = await fetchText(url, {
      headers: { 'User-Agent': UA, Accept: 'text/plain' },
    })
    let rawMax = -Infinity
    let n = 0
    for (const line of text.split('\n')) {
      if (!line || line.startsWith('station') || line.startsWith('#')) continue
      const parts = line.split(',')
      if (parts.length < 3) continue
      const v = Number(parts[parts.length - 1])
      if (!Number.isFinite(v)) continue
      n++
      if (v > rawMax) rawMax = v
    }
    if (n === 0 || !Number.isFinite(rawMax)) return null
    return {
      rawMax,
      max: roundObs(rawMax, station.rounding ?? 'whole'),
      n,
    }
  } catch (e) {
    console.warn('[weather] Iowa Mesonet failed', e)
    return null
  }
}

export async function fetchTaf(icao: string): Promise<string | null> {
  try {
    const url = `${TAF_URL}?ids=${encodeURIComponent(icao)}&format=json`
    const rows = await fetchJson<any[]>(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    return rows?.[0]?.rawTAF || rows?.[0]?.rawText || null
  } catch {
    return null
  }
}

export async function fetchEnsembleMax(
  lat: number,
  lon: number,
  timezone: string,
): Promise<EnsembleDay[]> {
  const url =
    `${ENSEMBLE_URL}?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max&models=ecmwf_ifs025,gfs025` +
    `&timezone=${encodeURIComponent(timezone)}`
  try {
    const data = await fetchJson<any>(
      url,
      { headers: { Accept: 'application/json', 'User-Agent': UA } },
      15_000,
    )
    const days: EnsembleDay[] = []
    const dateList: string[] =
      data?.daily?.time ||
      data?.ecmwf_ifs025?.daily?.time ||
      data?.gfs025?.daily?.time ||
      []

    const collectMembers = (idx: number): number[] => {
      const out: number[] = []
      const pushArr = (arr: unknown) => {
        if (Array.isArray(arr) && typeof arr[idx] === 'number') {
          out.push(arr[idx] as number)
        }
      }
      if (data?.daily) {
        for (const [k, v] of Object.entries(data.daily)) {
          if (k.startsWith('temperature_2m_max')) pushArr(v)
        }
      }
      for (const model of ['ecmwf_ifs025', 'gfs025']) {
        const daily = data?.[model]?.daily
        if (!daily) continue
        for (const [k, v] of Object.entries(daily)) {
          if (k.startsWith('temperature_2m_max')) pushArr(v)
        }
      }
      return out
    }

    for (let i = 0; i < dateList.length; i++) {
      const membersC = collectMembers(i)
      if (!membersC.length) continue
      const meanC = membersC.reduce((a, b) => a + b, 0) / membersC.length
      days.push({
        date: dateList[i],
        membersC,
        meanC,
        maxC: Math.max(...membersC),
        minC: Math.min(...membersC),
      })
    }
    return days
  } catch (e) {
    console.warn('[weather] ensemble failed', e)
    return []
  }
}

/**
 * Observed max chain: Synoptic → METAR → Iowa (US).
 * Open-Meteo is forecast-only and never drives lock.
 */
export async function buildWeatherSnap(
  station: Station,
  targetDate?: string,
): Promise<WeatherSnapExtra> {
  const warnings: string[] = []
  const { date: today, hour: localHour } = localParts(station.timezone)
  const date = targetDate || today
  const metarIsResolution = station.metarIsResolution !== false
  const sourceRisk = stationSourceRisk(station)
  const resolutionStationId = stationResolutionId(station)
  const officialUrl = station.officialUrl
  const rounding = station.rounding ?? 'whole'
  const primary = station.primaryFetch || 'synoptic_madis'

  if (!metarIsResolution || sourceRisk) {
    warnings.push(
      `${station.city}: METAR ${station.icao} is NOT lock-authoritative` +
        (station.resolutionSource
          ? ` (resolution=${station.resolutionSource}:${resolutionStationId})`
          : ''),
    )
  }

  let observedMax: number | null = null
  let obsSource: ObsSource = 'none'

  if (primary === 'hko_daily_extract') {
    obsSource = 'hko_stub'
    warnings.push(
      `${station.city}: HKO Absolute Daily Max not fetched here — source_risk, no METAR lock`,
    )
  } else if (primary === 'wu_daily_observations') {
    obsSource = 'wu_stub'
    warnings.push(
      `${station.city}: WU Daily Observations not scraped here — source_risk, no METAR lock`,
    )
  }

  if (primary === 'synoptic_madis' || station.resolutionSource === 'noaa') {
    try {
      const syn = await fetchSynopticDayMax(station, date)
      if (syn) {
        observedMax = syn.max
        obsSource = 'synoptic'
      } else {
        warnings.push(
          `${station.city}: Synoptic empty for ${date} @ ${resolutionStationId}`,
        )
      }
    } catch (e) {
      warnings.push(
        `${station.city}: Synoptic failed (${e instanceof Error ? e.message : String(e)})`,
      )
    }
  } else if (station.resolutionSource !== 'hko') {
    try {
      const syn = await fetchSynopticDayMax(station, date)
      if (syn && observedMax == null) {
        observedMax = syn.max
        obsSource = 'synoptic'
        warnings.push(
          `${station.city}: Synoptic soft cross-check only (resolution=${station.resolutionSource})`,
        )
      }
    } catch {
      /* soft fail */
    }
  }

  if (observedMax == null) {
    const metarMax = await fetchMetarDayMax(station, date)
    if (metarMax) {
      observedMax = metarMax.max
      obsSource = 'metar'
      if (station.resolutionSource === 'noaa') {
        warnings.push(
          `${station.city}: METAR-only observed max while resolution is NOAA — lock disabled until Synoptic`,
        )
      }
    }
  }

  if (observedMax == null && station.icao.startsWith('K')) {
    const iowa = await fetchIowaDayMax(station, date)
    if (iowa) {
      observedMax = iowa.max
      obsSource = 'iowa_mesonet'
      warnings.push(`${station.city}: Iowa Mesonet ASOS fallback`)
    }
  }

  const ensemble = await fetchEnsembleMax(
    station.lat,
    station.lon,
    station.timezone,
  )
  const day = ensemble.find((d) => d.date === date) || ensemble[0]
  const toUnit = (c: number) => applyBiasC(c, station.biasC, station.unit)
  const members = (day?.membersC || []).map(toUnit)
  const ensembleMax =
    members.length > 0
      ? Math.max(...members)
      : day
        ? toUnit(day.maxC)
        : null
  const ensembleMean =
    members.length > 0
      ? members.reduce((a, b) => a + b, 0) / members.length
      : day
        ? toUnit(day.meanC)
        : null

  let predictedMax: number | null = null
  if (ensembleMax != null) {
    predictedMax =
      rounding === 'one_decimal'
        ? Math.round(ensembleMax * 10) / 10
        : Math.round(ensembleMax)
  }

  const remainingHeat = remainingHeatEstimate(
    observedMax,
    ensembleMax,
    localHour,
    station.peakHour,
  )

  const heatingDone =
    localHour >= station.peakHour &&
    remainingHeat != null &&
    remainingHeat <= 0.4 &&
    (station.climateClass !== 'US_F' ||
      (observedMax != null &&
        predictedMax != null &&
        observedMax >= predictedMax - 0.5))

  const soFarEqualsPred =
    observedMax != null &&
    predictedMax != null &&
    (rounding === 'one_decimal'
      ? Math.abs(observedMax - predictedMax) < 0.05
      : Math.round(observedMax) === Math.round(predictedMax))

  const obsOkForLock =
    obsSource === 'synoptic' ||
    obsSource === 'iowa_mesonet' ||
    (obsSource === 'metar' &&
      metarIsResolution &&
      !sourceRisk &&
      station.resolutionSource !== 'noaa')

  const locked =
    metarIsResolution &&
    !sourceRisk &&
    obsOkForLock &&
    observedMax != null &&
    remainingHeat != null &&
    remainingHeat <= 0.3 &&
    localHour >= station.peakHour &&
    (station.climateClass !== 'US_F' || heatingDone || soFarEqualsPred)

  return {
    date,
    observedMax,
    ensembleMax,
    ensembleMembers: members,
    ensembleMean,
    remainingHeat,
    localHour,
    peakHour: station.peakHour,
    metarIsResolution,
    locked,
    warnings,
    obsSource,
    officialUrl,
    resolutionStationId,
    sourceRisk,
    heatingDone,
    soFarEqualsPred,
    climateClass: station.climateClass,
  }
}
