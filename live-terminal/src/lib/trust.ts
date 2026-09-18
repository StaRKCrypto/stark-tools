import { fetchArcusMarkets, type ArcusMarket } from './venues/arcus'
import { fetchLighterDetails, fetchLighterFunding, type LighterDetail } from './venues/lighter'
import { fetchNadoMarketPrice, x18ToNumber } from './venues/nado'
import { loadSnaps, type DeskSnap } from './snaps'
import { safeError } from './redact'

export interface TrustCell {
  desk: 'arcus' | 'lighter' | 'nado'
  label: string
  mark?: string
  extra?: string
  snap?: DeskSnap
  ok: boolean
  error?: string
}

export interface TrustFeed {
  at: string
  cells: TrustCell[]
}

function arcusBtc(markets: ArcusMarket[]) {
  return markets.find((m) => m.marketDisplayName === 'BTC-USD' || m.baseAsset === 'BTC')
}

export async function loadTrustFeed(): Promise<TrustFeed> {
  const snaps = loadSnaps()
  const snapOf = (d: TrustCell['desk']) => snaps.find((s) => s.venue === d)

  const cells: TrustCell[] = []

  try {
    const markets = await fetchArcusMarkets()
    const btc = arcusBtc(markets)
    cells.push({
      desk: 'arcus',
      label: 'Arcus BTC',
      mark: btc?.markPrice || btc?.lastTradePrice || btc?.lastPrice,
      extra: btc
        ? `OI ${btc.openInterest ?? '—'} · fund ${btc.fundingRate ?? '—'}`
        : 'no BTC row',
      snap: snapOf('arcus'),
      ok: Boolean(btc),
    })
  } catch (e) {
    cells.push({ desk: 'arcus', label: 'Arcus BTC', snap: snapOf('arcus'), ok: false, error: safeError(e) })
  }

  try {
    const [details, funds] = await Promise.all([fetchLighterDetails(1), fetchLighterFunding()])
    const books = (details.order_book_details || []) as LighterDetail[]
    const btc = books.find((b) => b.symbol === 'BTC') || books[0]
    const fund = funds.find((f) => f.exchange === 'lighter' && f.symbol === (btc?.symbol || 'BTC'))
    cells.push({
      desk: 'lighter',
      label: `Lighter ${btc?.symbol || 'BTC'}`,
      mark: btc?.mark_price || (btc?.last_trade_price != null ? String(btc.last_trade_price) : undefined),
      extra: btc
        ? `OI ${btc.open_interest ?? '—'} · fund ${fund?.rate ?? '—'}`
        : 'no book',
      snap: snapOf('lighter'),
      ok: Boolean(btc),
    })
  } catch (e) {
    cells.push({
      desk: 'lighter',
      label: 'Lighter BTC',
      snap: snapOf('lighter'),
      ok: false,
      error: safeError(e),
    })
  }

  try {
    const px = await fetchNadoMarketPrice(98)
    const bid = x18ToNumber(px?.data?.bid_x18)
    const ask = x18ToNumber(px?.data?.ask_x18)
    cells.push({
      desk: 'nado',
      label: 'Nado QQQ-PERP',
      mark: bid != null && ask != null ? `${bid} / ${ask}` : undefined,
      extra: 'product 98',
      snap: snapOf('nado'),
      ok: bid != null || ask != null,
    })
  } catch (e) {
    cells.push({
      desk: 'nado',
      label: 'Nado QQQ-PERP',
      snap: snapOf('nado'),
      ok: false,
      error: safeError(e),
    })
  }

  return { at: new Date().toISOString(), cells }
}
