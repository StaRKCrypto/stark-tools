import { useEffect, useState } from 'react'
import {
  fetchArcusBbo,
  fetchArcusCandles,
  fetchArcusMarkets,
  type ArcusMarket,
} from '../lib/venues/arcus'
import { analyzeSr } from '../lib/venues/sr'
import { Tape } from '../components/Tape'
import { VenueDock } from '../components/VenueDock'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { VENUE } from '../lib/venues/links'
import { fmtFund, fmtPct, fmtPx } from '../lib/format'
import { isArmed, isDryRun } from '../lib/vault'

export function Arcus() {
  const [markets, setMarkets] = useState<ArcusMarket[]>([])
  const [sym, setSym] = useState('BTC-USD')
  const [bbo, setBbo] = useState<{ bid?: string; ask?: string }>({})
  const [sr, setSr] = useState<ReturnType<typeof analyzeSr> | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setErr(null)
    try {
      const m = await fetchArcusMarkets()
      setMarkets(m.filter((x) => x.status === 'ONLINE'))
      const book = await fetchArcusBbo(sym)
      setBbo({ bid: book.bestBid?.price, ask: book.bestAsk?.price })
      const candles = await fetchArcusCandles(sym, '15m', 80)
      setSr(analyzeSr(candles))
    } catch (e) {
      setErr(safeError(e))
    }
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 15_000)
    return () => clearInterval(id)
  }, [sym])

  const row = markets.find((m) => m.marketDisplayName === sym)

  function logIntent(side: 'BUY' | 'SELL') {
    const ticket = `${side} ${sym} @ mark ${sr?.px ?? '—'}`
    if (isDryRun() || !isArmed()) {
      pushTape('arcus', 'paper', `PAPER intent ${ticket} — send on Arcus`, { side }, true)
      return
    }
    pushTape(
      'arcus',
      'block',
      'LIVE Arcus placeOrder is not in this companion. Use the venue (Ed25519 Scheme 1).',
      { side },
      false,
    )
  }

  return (
    <div className="page">
      <VenueDock name="Arcus" href={VENUE.arcusTrade(sym)} marketsHref={VENUE.arcusHome} />
      <div className="page-h">
        <div>
          <h1>{sym}</h1>
          <p>S/R from live 15m candles. Chart/book/ticket on Arcus.</p>
        </div>
        <button className="btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {err && <div className="bad">{err}</div>}

      <div className="ticker">
        <div>
          <span>Mark</span>
          <b className="mono">{row?.markPrice ?? fmtPx(sr?.px)}</b>
        </div>
        <div>
          <span>Index</span>
          <b className="mono">{row?.oraclePrice || row?.indexPrice || '—'}</b>
        </div>
        <div>
          <span>BBO</span>
          <b className="mono">
            <span className="ok">{bbo.bid ?? '—'}</span> / <span className="bad">{bbo.ask ?? '—'}</span>
          </b>
        </div>
        <div>
          <span>24h</span>
          <b className="mono">{fmtPct(row?.priceChange24h)}</b>
        </div>
        <div>
          <span>Vol $</span>
          <b className="mono">{row?.volume24hNotional ?? '—'}</b>
        </div>
        <div>
          <span>OI</span>
          <b className="mono">{row?.openInterest ?? '—'}</b>
        </div>
        <div>
          <span>Funding</span>
          <b className="mono">{fmtFund(row?.fundingRate)}</b>
        </div>
        <div>
          <span>Bias / ATR</span>
          <b className="mono">
            {sr?.bias ?? '—'} · {sr?.atr ? sr.atr.toFixed(2) : '—'}
          </b>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h2>S/R · {sym}</h2>
          <div className="panel-body">
            <div className="kv">
              <span>Support</span>
              <b className="mono ok">
                {sr?.support ?? '—'} ({sr?.supportZone ?? '—'})
              </b>
            </div>
            <div className="kv">
              <span>Resist</span>
              <b className="mono bad">
                {sr?.resist ?? '—'} ({sr?.resistZone ?? '—'})
              </b>
            </div>
            <div className="tiny">Highs {sr?.swingHighs.map((n) => n.toFixed(1)).join(', ') || '—'}</div>
            <div className="tiny">Lows {sr?.swingLows.map((n) => n.toFixed(1)).join(', ') || '—'}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-buy" type="button" onClick={() => logIntent('BUY')}>
                Log BUY intent
              </button>
              <button className="btn btn-sell" type="button" onClick={() => logIntent('SELL')}>
                Log SELL intent
              </button>
            </div>
          </div>
        </div>
        <div className="panel">
          <h2>Online markets</h2>
          <div className="scroll">
            <table className="term">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Mark</th>
                  <th>24h</th>
                  <th>OI</th>
                </tr>
              </thead>
              <tbody>
                {markets.slice(0, 80).map((m) => (
                  <tr
                    key={m.marketId}
                    className="clickable"
                    onClick={() => setSym(m.marketDisplayName)}
                  >
                    <td>{m.marketDisplayName}</td>
                    <td className="mono">{m.markPrice || m.lastTradePrice || '—'}</td>
                    <td className="mono">{fmtPct(m.priceChange24h)}</td>
                    <td className="mono">{m.openInterest ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Tape desk="arcus" />
    </div>
  )
}
