import { ORIGIN } from '../endpoints'

export interface LighterBook {
  symbol: string
  market_id: number
  market_type: string
  status: string
}

export interface LighterStat {
  symbol: string
  last_trade_price: number
  daily_trades_count: number
  daily_quote_token_volume: number
  daily_price_change: number
}

export async function fetchLighterBooks(): Promise<LighterBook[]> {
  const res = await fetch(`${ORIGIN.lighter}/api/v1/orderBooks`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Lighter orderBooks HTTP ${res.status}`)
  const data = (await res.json()) as { order_books?: LighterBook[] }
  return data.order_books || []
}

export async function fetchLighterStats(): Promise<LighterStat[]> {
  const res = await fetch(`${ORIGIN.lighter}/api/v1/exchangeStats`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Lighter exchangeStats HTTP ${res.status}`)
  const data = (await res.json()) as { order_book_stats?: LighterStat[] }
  return data.order_book_stats || []
}

export interface LighterDetail {
  symbol: string
  market_id: number
  market_type?: string
  status?: string
  mark_price?: string
  index_price?: string
  last_trade_price?: number
  daily_quote_token_volume?: number
  daily_price_change?: number
  open_interest?: number
}

export interface LighterFunding {
  market_id: number
  exchange: string
  symbol: string
  rate: number
}

export async function fetchLighterDetails(marketId?: number) {
  const q = marketId == null ? 'filter=perp' : `market_id=${marketId}`
  const res = await fetch(`${ORIGIN.lighter}/api/v1/orderBookDetails?${q}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Lighter details HTTP ${res.status}`)
  return (await res.json()) as { order_book_details?: LighterDetail[] }
}

export async function fetchLighterFunding(): Promise<LighterFunding[]> {
  const res = await fetch(`${ORIGIN.lighter}/api/v1/funding-rates`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Lighter funding HTTP ${res.status}`)
  const data = (await res.json()) as { funding_rates?: LighterFunding[] }
  return data.funding_rates || []
}
