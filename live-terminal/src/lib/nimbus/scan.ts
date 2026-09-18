/**
 * Scan pipeline (browser): Gamma weather events → snaps → score.
 * Ported from Nimbus src/lib/server/scan.ts — no server persist.
 */
import { planTick, type PlanTickResult, type CityScanInput } from './autopilot'
import { STRATEGY, type EngineBookState } from './engine'
import { fetchWeatherEvents } from './polymarket'
import { buildWeatherSnap } from './weather'

export interface CityScanRow {
  cityKey: string
  city: string
  icao: string
  slug: string
  title: string
  eventDate?: string
  unit: 'C' | 'F'
  metarIsResolution: boolean
  warnings: string[]
  observedMax: number | null
  ensembleMax: number | null
  ensembleMean: number | null
  remainingHeat: number | null
  localHour: number
  peakHour: number
  locked: boolean
  obsSource?: string
  officialUrl?: string
  resolutionStationId?: string
  sourceRisk?: boolean
  buckets: Array<{
    label: string
    yesPrice: number
    noPrice: number
    yesTokenId: string
    noTokenId: string
    tickSize?: string
    negRisk?: boolean
    modelP: number
    edgeYes: number
    edgeNo: number
    side: string | null
    reason: string
    veto: boolean
    lockYes: boolean
    kellyStake: number
  }>
  ladder: {
    reason: string
    basketCost: number
    combinedP: number
    edge: number
    legs: Array<{ label: string; stakeUsd: number; modelP: number }>
  } | null
  bestEdge: number
}

export interface ScanResult {
  at: string
  durationMs: number
  cities: CityScanRow[]
  plan: PlanTickResult
  error?: string
}

let inflight: Promise<ScanResult> | null = null
let cached: ScanResult | null = null

export function getCachedScan(): ScanResult | null {
  return cached
}

export async function runScan(opts?: {
  book?: EngineBookState
  force?: boolean
}): Promise<ScanResult> {
  if (inflight && !opts?.force) return inflight
  inflight = doScan(opts?.book)
  try {
    cached = await inflight
    return cached
  } finally {
    inflight = null
  }
}

async function doScan(book?: EngineBookState): Promise<ScanResult> {
  const t0 = Date.now()
  const budgetMs = 18_000
  try {
    const events = await fetchWeatherEvents(80)
    const withStation = events.filter((e) => e.station)
    const picked = pickEvents(withStation, 16)

    const bookState: EngineBookState = book ?? {
      cashUsd: STRATEGY.hardCapUsd,
      deployedUsd: 0,
      cityDeployedUsd: {},
    }

    const cityInputs: CityScanInput[] = []
    const rows: CityScanRow[] = []

    for (const ev of picked) {
      if (Date.now() - t0 > budgetMs) break
      const station = ev.station!
      try {
        const snapExtra = await buildWeatherSnap(station, ev.eventDate)
        const {
          date,
          ensembleMean,
          warnings,
          observedMax,
          ensembleMax,
          ensembleMembers,
          remainingHeat,
          localHour,
          peakHour,
          metarIsResolution,
          locked,
          obsSource,
          officialUrl,
          resolutionStationId,
          sourceRisk,
          heatingDone,
          soFarEqualsPred,
          climateClass,
        } = snapExtra

        cityInputs.push({
          cityKey: station.slug,
          eventSlug: ev.slug,
          markets: ev.markets,
          snap: {
            observedMax,
            ensembleMax,
            ensembleMembers,
            remainingHeat,
            localHour,
            peakHour,
            metarIsResolution,
            locked,
            sourceRisk,
            obsSource,
            heatingDone,
            soFarEqualsPred,
            climateClass,
          },
        })

        rows.push({
          cityKey: station.slug,
          city: station.city,
          icao: station.icao,
          slug: ev.slug,
          title: ev.title,
          eventDate: ev.eventDate || date,
          unit: station.unit,
          metarIsResolution,
          warnings: [...warnings, ...(station.note ? [station.note] : [])],
          observedMax,
          ensembleMax,
          ensembleMean,
          remainingHeat,
          localHour,
          peakHour,
          locked,
          obsSource,
          officialUrl: officialUrl ?? station.officialUrl,
          resolutionStationId:
            resolutionStationId ?? station.resolutionStationId ?? station.icao,
          sourceRisk: sourceRisk ?? station.sourceRisk,
          buckets: [],
          ladder: null,
          bestEdge: 0,
        })
      } catch {
        /* city failed — skip */
      }
    }

    const plan = planTick(cityInputs, bookState)

    for (const row of rows) {
      const scored = plan.scored[row.cityKey] || []
      row.buckets = scored.map((s) => ({
        label: s.market.label,
        yesPrice: s.market.yesPrice,
        noPrice: s.market.noPrice,
        yesTokenId: s.market.yesTokenId,
        noTokenId: s.market.noTokenId,
        tickSize: s.market.tickSize,
        negRisk: s.market.negRisk,
        modelP: s.modelP,
        edgeYes: s.edgeYes,
        edgeNo: s.edgeNo,
        side: s.side,
        reason: s.reason,
        veto: s.veto,
        lockYes: s.lockYes,
        kellyStake: s.kellyStake,
      }))
      const ladder = plan.ladders[row.cityKey]
      row.ladder = ladder
        ? {
            reason: ladder.reason,
            basketCost: ladder.basketCost,
            combinedP: ladder.combinedP,
            edge: ladder.edge,
            legs: ladder.legs.map((l) => ({
              label: l.market.label,
              stakeUsd: l.stakeUsd,
              modelP: l.modelP,
            })),
          }
        : null
      row.bestEdge = Math.max(
        0,
        ...scored.map((s) => Math.max(s.edgeYes, s.edgeNo)),
        ladder?.edge ?? 0,
      )
    }

    rows.sort((a, b) => b.bestEdge - a.bestEdge)

    return {
      at: new Date().toISOString(),
      durationMs: Date.now() - t0,
      cities: rows,
      plan,
    }
  } catch (e) {
    return {
      at: new Date().toISOString(),
      durationMs: Date.now() - t0,
      cities: [],
      plan: { intents: [], scored: {}, ladders: {}, skips: [] },
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

function pickEvents<T extends { station?: { slug: string }; eventDate?: string }>(
  events: T[],
  n: number,
): T[] {
  const bySlug = new Map<string, T>()
  const sorted = [...events].sort((a, b) =>
    String(a.eventDate || '').localeCompare(String(b.eventDate || '')),
  )
  for (const ev of sorted) {
    const key = ev.station!.slug
    if (!bySlug.has(key)) bySlug.set(key, ev)
  }
  return [...bySlug.values()].slice(0, n)
}
