import { fetchArcusMarkets, type ArcusMarket } from './venues/arcus'
import { fetchLighterDetails, fetchLighterFunding, type LighterDetail } from './venues/lighter'
import { fetchNadoMarketPrice, x18ToNumber } from './venues/nado'
import { loadSnaps, type DeskSnap } from './snaps'
import { safeError } from './redact'
import { fmtFund } from './format'

export interface Bbo {
  bid: number | null
  ask: number | null
}

export interface VenueMark {
  desk: 'arcus' | 'lighter' | 'nado'
  label: string
  mark?: string
  extra?: string
  ok: boolean
  error?: string
}

export interface TrustFeed {
  at: string
  snap?: DeskSnap
  wti?: Bbo
  qqq?: Bbo
  venues: VenueMark[]
}

function arcusBtc(markets: ArcusMarket[]) {
  return markets.find((m) => m.marketDisplayName === 'BTC-USD' || m.baseAsset === 'BTC')
}

async function nadoBbo(productId: number): Promise<Bbo> {
  const px = await fetchNadoMarketPrice(productId)
  return {
    bid: x18ToNumber(px?.data?.bid_x18 || px?.data?.market_price?.bid_x18),
    ask: x18ToNumber(px?.data?.ask_x18 || px?.data?.market_price?.ask_x18),
  }
}

export async function loadTrustFeed(): Promise<TrustFeed> {
  const snaps = loadSnaps()
  const snap = snaps.find((s) => s.venue === 'nado') || snaps[0]
  const venues: VenueMark[] = []
  let wti: Bbo | undefined
  let qqq: Bbo | undefined

  try {
    const markets = await fetchArcusMarkets()
    const btc = arcusBtc(markets)
    venues.push({
      desk: 'arcus',
      label: 'Arcus BTC',
      mark: btc?.markPrice || btc?.lastTradePrice || btc?.lastPrice,
      extra: btc ? `OI ${btc.openInterest ?? '—'} · ${fmtFund(btc.fundingRate)}` : 'no BTC',
      ok: Boolean(btc),
    })
  } catch (e) {
    venues.push({ desk: 'arcus', label: 'Arcus BTC', ok: false, error: safeError(e) })
  }

  try {
    const [details, funds] = await Promise.all([fetchLighterDetails(1), fetchLighterFunding()])
    const books = (details.order_book_details || []) as LighterDetail[]
    const btc = books.find((b) => b.symbol === 'BTC') || books[0]
    const fund = funds.find((f) => f.exchange === 'lighter' && f.symbol === (btc?.symbol || 'BTC'))
    venues.push({
      desk: 'lighter',
      label: `Lighter ${btc?.symbol || 'BTC'}`,
      mark: btc?.mark_price || (btc?.last_trade_price != null ? String(btc.last_trade_price) : undefined),
      extra: btc ? `OI ${btc.open_interest ?? '—'} · ${fmtFund(fund?.rate)}` : 'no book',
      ok: Boolean(btc),
    })
  } catch (e) {
    venues.push({ desk: 'lighter', label: 'Lighter BTC', ok: false, error: safeError(e) })
  }

  try {
    qqq = await nadoBbo(98)
    venues.push({
      desk: 'nado',
      label: 'Nado QQQ',
      mark:
        qqq.bid != null && qqq.ask != null ? `${qqq.bid.toFixed(2)} / ${qqq.ask.toFixed(2)}` : undefined,
      extra: 'product 98',
      ok: qqq.bid != null || qqq.ask != null,
    })
  } catch (e) {
    venues.push({ desk: 'nado', label: 'Nado QQQ', ok: false, error: safeError(e) })
  }

  try {
    wti = await nadoBbo(90)
  } catch {
    wti = undefined
  }

  return { at: new Date().toISOString(), snap, wti, qqq, venues }
}
