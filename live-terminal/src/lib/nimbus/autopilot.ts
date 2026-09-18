/**
 * Autopilot planner: prefer lock-YES, then ladder, then singles.
 * Does not place orders — live-tick does that when armed.
 */
import {
  STRATEGY,
  type BucketMarket,
  type EngineBookState,
  type LadderPlan,
  type ScoredBucket,
  type WeatherSnap,
  buildLadder,
  scoreBuckets,
} from './engine'

export type IntentKind = 'LADDER' | 'YES' | 'NO' | 'SKIP'

export interface TradeIntent {
  kind: IntentKind
  cityKey: string
  eventSlug: string
  reason: string
  stakeUsd: number
  tokenId: string
  price: number
  tickSize?: string
  negRisk?: boolean
  label: string
  modelP: number
  edge: number
  ladderId?: string
}

export interface CityScanInput {
  cityKey: string
  eventSlug: string
  markets: BucketMarket[]
  snap: WeatherSnap
}

export interface PlanTickResult {
  intents: TradeIntent[]
  scored: Record<string, ScoredBucket[]>
  ladders: Record<string, LadderPlan | null>
  skips: Array<{ cityKey: string; reason: string }>
}

export function planTick(
  cities: CityScanInput[],
  book: EngineBookState,
): PlanTickResult {
  const intents: TradeIntent[] = []
  const scored: Record<string, ScoredBucket[]> = {}
  const ladders: Record<string, LadderPlan | null> = {}
  const skips: Array<{ cityKey: string; reason: string }> = []

  const shadow: EngineBookState = {
    cashUsd: book.cashUsd,
    deployedUsd: book.deployedUsd,
    cityDeployedUsd: { ...book.cityDeployedUsd },
  }

  for (const city of cities) {
    const rows = scoreBuckets(city.markets, city.snap, shadow, city.cityKey)
    scored[city.cityKey] = rows

    const ladder = buildLadder(city.markets, city.snap, shadow, city.cityKey)
    ladders[city.cityKey] = ladder

    const locks = rows
      .filter((r) => r.lockYes && r.side === 'YES' && r.kellyStake > 0)
      .sort((a, b) => b.edgeYes - a.edgeYes)

    for (const row of locks) {
      if (shadow.cashUsd < STRATEGY.minTicketUsd) break
      pushYes(intents, shadow, city, row)
    }

    const cityUsed = shadow.cityDeployedUsd[city.cityKey] ?? 0
    if (
      ladder &&
      cityUsed < STRATEGY.maxCityPct * STRATEGY.hardCapUsd * 0.5
    ) {
      const ladderId = `${city.eventSlug}:ladder`
      for (const leg of ladder.legs) {
        if (shadow.cashUsd < leg.stakeUsd) break
        intents.push({
          kind: 'LADDER',
          cityKey: city.cityKey,
          eventSlug: city.eventSlug,
          reason: ladder.reason,
          stakeUsd: leg.stakeUsd,
          tokenId: leg.market.yesTokenId,
          price: leg.market.yesPrice,
          tickSize: leg.market.tickSize,
          negRisk: leg.market.negRisk,
          label: leg.market.label,
          modelP: leg.modelP,
          edge: ladder.edge,
          ladderId,
        })
        consume(shadow, city.cityKey, leg.stakeUsd)
      }
      continue
    }

    const singles = rows
      .filter((r) => !r.veto && r.side && r.kellyStake > 0 && !r.lockYes)
      .sort((a, b) => {
        const ea = a.side === 'YES' ? a.edgeYes : a.edgeNo
        const eb = b.side === 'YES' ? b.edgeYes : b.edgeNo
        return eb - ea
      })

    let placed = false
    for (const row of singles) {
      if (shadow.cashUsd < STRATEGY.minTicketUsd) break
      if (
        (shadow.cityDeployedUsd[city.cityKey] ?? 0) >=
        STRATEGY.maxCityPct * STRATEGY.hardCapUsd
      )
        break
      if (row.side === 'YES') pushYes(intents, shadow, city, row)
      else pushNo(intents, shadow, city, row)
      placed = true
      break
    }

    if (!locks.length && !ladder && !placed) {
      const top = rows[0]
      skips.push({
        cityKey: city.cityKey,
        reason: top?.reason ?? 'no actionable edge',
      })
    }
  }

  return { intents, scored, ladders, skips }
}

function consume(book: EngineBookState, cityKey: string, usd: number) {
  book.cashUsd = Math.max(0, book.cashUsd - usd)
  book.deployedUsd += usd
  book.cityDeployedUsd[cityKey] = (book.cityDeployedUsd[cityKey] ?? 0) + usd
}

function pushYes(
  intents: TradeIntent[],
  book: EngineBookState,
  city: CityScanInput,
  row: ScoredBucket,
) {
  intents.push({
    kind: 'YES',
    cityKey: city.cityKey,
    eventSlug: city.eventSlug,
    reason: row.reason,
    stakeUsd: row.kellyStake,
    tokenId: row.market.yesTokenId,
    price: row.market.yesPrice,
    tickSize: row.market.tickSize,
    negRisk: row.market.negRisk,
    label: row.market.label,
    modelP: row.modelP,
    edge: row.edgeYes,
  })
  consume(book, city.cityKey, row.kellyStake)
}

function pushNo(
  intents: TradeIntent[],
  book: EngineBookState,
  city: CityScanInput,
  row: ScoredBucket,
) {
  intents.push({
    kind: 'NO',
    cityKey: city.cityKey,
    eventSlug: city.eventSlug,
    reason: row.reason,
    stakeUsd: row.kellyStake,
    tokenId: row.market.noTokenId,
    price: row.market.noPrice,
    tickSize: row.market.tickSize,
    negRisk: row.market.negRisk,
    label: row.market.label,
    modelP: 1 - row.modelP,
    edge: row.edgeNo,
  })
  consume(book, city.cityKey, row.kellyStake)
}
