/**
 * Nimbus scoring engine: edge, Kelly, remaining heat, ladder, lock, veto, tail fade.
 */
import {
  type ParsedBucket,
  areAdjacent,
  bucketContains,
  sortByMid,
} from './buckets'

export const STRATEGY = {
  minEdge: 0.08,
  feeHaircut: 0.02,
  kellyFrac: 0.25,
  maxStakePct: 0.08,
  maxCityPct: 0.16,
  maxBookPct: 0.8,
  hardCapUsd: 100,
  minTicketUsd: 5,
  maxTicketUsd: 8,
  vetoYesPrice: 0.85,
  ladderMinLegs: 3,
  ladderMaxLegs: 4,
  ladderMinBasket: 0.12,
  ladderMaxBasket: 0.8,
  ladderMinCombinedP: 0.5,
  lateCertainYes: 0.7,
  /** Skip YES buys below this ask (stale / dust books). */
  minYesPrice: 0.02,
  /** Skip NO buys below this ask. */
  minNoPrice: 0.02,
} as const

export type Side = 'YES' | 'NO'

export interface BucketMarket {
  label: string
  parsed: ParsedBucket
  yesPrice: number
  noPrice: number
  yesTokenId: string
  noTokenId: string
  tickSize?: string
  negRisk?: boolean
  conditionId?: string
}

export interface WeatherSnap {
  observedMax: number | null
  ensembleMax: number | null
  ensembleMembers: number[]
  remainingHeat: number | null
  localHour: number
  peakHour: number
  metarIsResolution: boolean
  locked: boolean
  /** METAR/WU/HKO cannot authorize lock-YES when true. */
  sourceRisk?: boolean
  /** Where observedMax came from. */
  obsSource?:
    | 'synoptic'
    | 'metar'
    | 'iowa_mesonet'
    | 'none'
    | 'hko_stub'
    | 'wu_stub'
  heatingDone?: boolean
  soFarEqualsPred?: boolean
  climateClass?: string
}

export interface ScoredBucket {
  market: BucketMarket
  modelP: number
  edgeYes: number
  edgeNo: number
  side: Side | null
  reason: string
  veto: boolean
  lockYes: boolean
  kellyStake: number
}

export interface LadderPlan {
  legs: Array<{
    market: BucketMarket
    modelP: number
    stakeUsd: number
    weight: number
  }>
  basketCost: number
  combinedP: number
  edge: number
  reason: string
}

export interface EngineBookState {
  cashUsd: number
  deployedUsd: number
  cityDeployedUsd: Record<string, number>
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

export function modelBucketProbability(
  bucket: ParsedBucket,
  snap: WeatherSnap,
): number {
  const members = snap.ensembleMembers
  if (members.length > 0) {
    let hits = 0
    for (const m of members) {
      const v =
        snap.observedMax != null ? Math.max(m, snap.observedMax) : m
      if (bucketContains(bucket, v, true)) hits++
    }
    let p = hits / members.length
        if (
      snap.metarIsResolution &&
      !snap.sourceRisk &&
      snap.obsSource !== 'metar' &&
      snap.obsSource !== 'hko_stub' &&
      snap.obsSource !== 'wu_stub' &&
      snap.observedMax != null &&
      bucketContains(bucket, snap.observedMax, true) &&
      (snap.remainingHeat == null || snap.remainingHeat <= 0.3)
    ) {
      p = Math.max(p, 0.92)
    }
    return clamp01(p)
  }

  if (snap.ensembleMax == null) return 0.05
  const mu = Math.max(snap.ensembleMax, snap.observedMax ?? -Infinity)
  const sigma = 1.5
  const lo =
    bucket.kind === 'ge'
      ? (bucket.lo ?? mu)
      : bucket.kind === 'le'
        ? -Infinity
        : (bucket.lo ?? mu) - 0.5
  const hi =
    bucket.kind === 'le'
      ? (bucket.hi ?? mu)
      : bucket.kind === 'ge'
        ? Infinity
        : (bucket.hi ?? mu) + 0.5
  const pHi = hi === Infinity ? 1 : normCdf((hi + 0.5 - mu) / sigma)
  const pLo = lo === -Infinity ? 0 : normCdf((lo - 0.5 - mu) / sigma)
  return clamp01(pHi - pLo)
}

export function edgeAfterFee(modelP: number, price: number): number {
  return modelP - price - STRATEGY.feeHaircut
}

export function kellyStakeUsd(
  modelP: number,
  price: number,
  book: EngineBookState,
  cityKey: string,
): number {
  if (price <= 0 || price >= 1 || modelP <= price) return 0
  const b = (1 - price) / price
  const q = 1 - modelP
  const fStar = (modelP * b - q) / b
  if (fStar <= 0) return 0
  const bankroll = STRATEGY.hardCapUsd
  let stake = fStar * STRATEGY.kellyFrac * bankroll
  stake = Math.min(
    stake,
    STRATEGY.maxStakePct * bankroll,
    STRATEGY.maxTicketUsd,
  )
  stake = Math.max(stake, 0)
  if (stake > 0 && stake < STRATEGY.minTicketUsd) {
    if (book.cashUsd >= STRATEGY.minTicketUsd) stake = STRATEGY.minTicketUsd
    else return 0
  }
  const cityUsed = book.cityDeployedUsd[cityKey] ?? 0
  const cityRoom = STRATEGY.maxCityPct * bankroll - cityUsed
  const bookRoom = STRATEGY.maxBookPct * bankroll - book.deployedUsd
  stake = Math.min(stake, cityRoom, bookRoom, book.cashUsd)
  if (stake < STRATEGY.minTicketUsd) return 0
  return Math.round(stake * 100) / 100
}

export function isLockYes(market: BucketMarket, snap: WeatherSnap): boolean {
  if (!snap.metarIsResolution) return false
  if (snap.sourceRisk) return false
  // Prefer Synoptic/Iowa for NOAA; METAR-only is race signal, not lock.
  if (
    snap.obsSource === 'metar' ||
    snap.obsSource === 'hko_stub' ||
    snap.obsSource === 'wu_stub' ||
    snap.obsSource === 'none'
  ) {
    return false
  }
  if (snap.observedMax == null) return false
  if (!bucketContains(market.parsed, snap.observedMax, true)) return false
  if (snap.remainingHeat != null && snap.remainingHeat > 0.4) return false
  if (snap.localHour < snap.peakHour) return false
  // US_F wrong-bucket / early-peak: need heating done or so_far≈pred
  if (snap.climateClass === 'US_F') {
    if (!(snap.heatingDone || snap.soFarEqualsPred)) return false
  }
  return true
}

export function isMetarRaceVeto(
  yesPrice: number,
  snap: WeatherSnap,
  lockYes: boolean,
): boolean {
  if (lockYes) return false
  if (yesPrice < STRATEGY.vetoYesPrice) return false
  if (snap.locked) return false
  return true
}

export function scoreBuckets(
  markets: BucketMarket[],
  snap: WeatherSnap,
  book: EngineBookState,
  cityKey: string,
): ScoredBucket[] {
  return markets.map((market) => {
    const modelP = modelBucketProbability(market.parsed, snap)
    const edgeYes = edgeAfterFee(modelP, market.yesPrice)
    const edgeNo = edgeAfterFee(1 - modelP, market.noPrice)
    const lockYes = isLockYes(market, snap)
    const veto = isMetarRaceVeto(market.yesPrice, snap, lockYes)

    let side: Side | null = null
    let reason = 'no edge'
    if (lockYes && edgeYes >= STRATEGY.minEdge * 0.5) {
      side = 'YES'
      reason = 'lock-YES: printed in bucket, heat cannot leave'
    } else if (veto && edgeYes >= edgeNo) {
      side = null
      reason = `VETO YES≥${STRATEGY.vetoYesPrice} before lock (METAR-race trap)`
    } else if (edgeYes >= STRATEGY.minEdge && edgeYes >= edgeNo) {
      side = 'YES'
      reason = `YES edge ${(edgeYes * 100).toFixed(1)}¢`
    } else if (edgeNo >= STRATEGY.minEdge) {
      side = 'NO'
      reason = `fade tail NO edge ${(edgeNo * 100).toFixed(1)}¢`
    }

    const price = side === 'YES' ? market.yesPrice : market.noPrice
    const pSide = side === 'YES' ? modelP : 1 - modelP
    let kellyStake =
      side && !veto ? kellyStakeUsd(pSide, price, book, cityKey) : 0
    if (side === 'YES' && market.yesPrice < STRATEGY.minYesPrice) {
      kellyStake = 0
      if (!veto) {
        side = null
        reason = `skip YES ask ${(market.yesPrice * 100).toFixed(2)}¢ < min`
      }
    } else if (side === 'NO' && market.noPrice < STRATEGY.minNoPrice) {
      kellyStake = 0
      side = null
      reason = `skip NO ask ${(market.noPrice * 100).toFixed(2)}¢ < min`
    }

    return {
      market,
      modelP,
      edgeYes,
      edgeNo,
      side: kellyStake > 0 ? side : veto ? null : side,
      reason:
        kellyStake === 0 && side && !veto ? 'size=0 (caps/cash)' : reason,
      veto,
      lockYes,
      kellyStake,
    }
  })
}

export function buildLadder(
  markets: BucketMarket[],
  snap: WeatherSnap,
  book: EngineBookState,
  cityKey: string,
): LadderPlan | null {
  if (snap.ensembleMax == null && snap.ensembleMembers.length === 0) return null

  const parsedSorted = sortByMid(markets.map((m) => m.parsed))
  const byMid = new Map(markets.map((m) => [m.parsed.mid, m]))
  const center =
    snap.ensembleMax ??
    snap.ensembleMembers.reduce((a, b) => a + b, 0) /
      Math.max(1, snap.ensembleMembers.length)

  let bestIdx = 0
  let bestDist = Infinity
  parsedSorted.forEach((b, i) => {
    const d = Math.abs(b.mid - center)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  })

  for (const width of [STRATEGY.ladderMaxLegs, STRATEGY.ladderMinLegs]) {
    const half = Math.floor((width - 1) / 2)
    const start = Math.max(0, bestIdx - half)
    const end = Math.min(parsedSorted.length, start + width)
    const slice = parsedSorted.slice(start, end)
    if (slice.length < STRATEGY.ladderMinLegs) continue

    let okAdj = true
    for (let i = 1; i < slice.length; i++) {
      if (!areAdjacent(slice[i - 1], slice[i])) {
        okAdj = false
        break
      }
    }
    if (!okAdj) continue

    const legsMarkets = slice
      .map((p) => byMid.get(p.mid))
      .filter((m): m is BucketMarket => !!m && m.yesPrice >= STRATEGY.minYesPrice)

    if (snap.localHour >= snap.peakHour) {
      if (legsMarkets.some((m) => m.yesPrice >= STRATEGY.lateCertainYes)) {
        continue
      }
    }

    const probs = legsMarkets.map((m) =>
      modelBucketProbability(m.parsed, snap),
    )
    const combinedP = clamp01(probs.reduce((a, b) => a + b, 0))
    const basketCost = legsMarkets.reduce((a, m) => a + m.yesPrice, 0)
    if (
      basketCost < STRATEGY.ladderMinBasket ||
      basketCost > STRATEGY.ladderMaxBasket
    )
      continue
    if (combinedP < STRATEGY.ladderMinCombinedP) continue
    const edge = combinedP - basketCost - STRATEGY.feeHaircut
    if (edge < STRATEGY.minEdge) continue

    const n = legsMarkets.length
    const mid = (n - 1) / 2
    const rawW = legsMarkets.map((_, i) => 1.5 - 0.4 * Math.abs(i - mid))
    const wSum = rawW.reduce((a, b) => a + b, 0)
    const weights = rawW.map((w) => w / wSum)

    const totalBudget = Math.min(
      STRATEGY.maxTicketUsd * n * 0.6,
      STRATEGY.maxCityPct * STRATEGY.hardCapUsd -
        (book.cityDeployedUsd[cityKey] ?? 0),
      STRATEGY.maxBookPct * STRATEGY.hardCapUsd - book.deployedUsd,
      book.cashUsd,
    )
    if (totalBudget < STRATEGY.minTicketUsd * 0.5 * n) continue

    const legs = legsMarkets.map((market, i) => {
      let stake = totalBudget * weights[i]
      stake = Math.max(
        STRATEGY.minTicketUsd * 0.5,
        Math.min(STRATEGY.maxTicketUsd, stake),
      )
      stake = Math.round(stake * 100) / 100
      return {
        market,
        modelP: probs[i],
        stakeUsd: stake,
        weight: weights[i],
      }
    })

    return {
      legs,
      basketCost,
      combinedP,
      edge,
      reason: `LADDER ${n} YES around ${center.toFixed(1)}°, basket ${(basketCost * 100).toFixed(0)}¢, P=${(combinedP * 100).toFixed(0)}%, edge ${(edge * 100).toFixed(1)}¢`,
    }
  }
  return null
}

export function remainingHeatEstimate(
  observedMax: number | null,
  ensembleMax: number | null,
  localHour: number,
  peakHour: number,
): number | null {
  if (ensembleMax == null) return null
  if (observedMax == null) return Math.max(0, ensembleMax)
  const raw = ensembleMax - observedMax
  if (localHour >= peakHour + 2) return Math.min(Math.max(0, raw), 0.2)
  if (localHour >= peakHour) return Math.max(0, raw * 0.4)
  return Math.max(0, raw)
}
