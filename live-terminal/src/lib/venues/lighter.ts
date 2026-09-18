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

export async function fetchLighterDetails(marketId: number) {
  const res = await fetch(
    `${ORIGIN.lighter}/api/v1/orderBookDetails?market_id=${marketId}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!res.ok) throw new Error(`Lighter details HTTP ${res.status}`)
  return res.json()
}
