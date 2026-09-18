import { ORIGIN } from '../endpoints'

export interface ArcusMarket {
  marketDisplayName: string
  marketId: number
  status: string
  baseAsset: string
  quoteAsset: string
  tickSize: string
  stepSize: string
  lastPrice?: string
  lastTradePrice?: string
  markPrice?: string
  indexPrice?: string
  oraclePrice?: string
  fundingRate?: string
  nextFundingRate?: string
  nextFundingAt?: number
  priceChange24h?: string
  volume24h?: string
  volume24hNotional?: string
  openInterest?: string
  type?: string
  category?: string
}

export interface Candle {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
  isFinal: boolean
}

export async function fetchArcusMarkets(): Promise<ArcusMarket[]> {
  const res = await fetch(`${ORIGIN.arcus}/v1/markets`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Arcus markets HTTP ${res.status}`)
  const data = (await res.json()) as { markets?: ArcusMarket[] }
  return data.markets || []
}

export async function fetchArcusBbo(market: string) {
  const res = await fetch(`${ORIGIN.arcus}/v1/bbo/${encodeURIComponent(market)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Arcus bbo HTTP ${res.status}`)
  return (await res.json()) as {
    bestBid?: { price: string; size: string }
    bestAsk?: { price: string; size: string }
  }
}

export async function fetchArcusCandles(
  market: string,
  timeframe = '15m',
  countback = 80,
): Promise<Candle[]> {
  const to = String(Date.now() * 1000)
  const q = new URLSearchParams({
    market,
    timeframe,
    to,
    countback: String(countback),
  })
  const res = await fetch(`${ORIGIN.arcus}/v1/candles?${q}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Arcus candles HTTP ${res.status}`)
  const data = (await res.json()) as {
    candles?: Array<{
      openTime: number
      open: string
      high: string
      low: string
      close: string
      volume: string
      isFinal?: boolean
    }>
  }
  const rows = [...(data.candles || [])].reverse()
  return rows
    .map((r) => ({
      t: r.openTime,
      o: Number(r.open),
      h: Number(r.high),
      l: Number(r.low),
      c: Number(r.close),
      v: Number(r.volume),
      isFinal: r.isFinal !== false,
    }))
    .filter((x) => x.c > 0)
}
