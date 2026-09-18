import { useEffect, useState } from 'react'
import {
  fetchNadoMarketPrice,
  fetchNadoSymbols,
  parseNadoSymbols,
  x18ToNumber,
  type NadoSymbol,
} from '../lib/venues/nado'
import { Tape } from '../components/Tape'
import { VenueDock } from '../components/VenueDock'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { VENUE, nadoMarketParam } from '../lib/venues/links'
import { snapFor } from '../lib/snaps'
import { fmtPct, fmtPx, fmtUsd } from '../lib/format'
import { isArmed, isDryRun } from '../lib/vault'

const NOTES = [
  'Primary: QQQ-PERP (98) until equity supports WTI $100 min clip',
  'WTI-PERP (90) deferred when max notional sits under venue min',
  'Inventory-first — cover toward flat after fill',
  'Execute on app.nado.xyz/perpetuals — companion is health only',
]

const WATCH = [
  { id: 98, symbol: 'QQQ-PERP' },
  { id: 90, symbol: 'WTI-PERP' },
]

export function Nado() {
  const [syms, setSyms] = useState<NadoSymbol[]>([])
  const [px, setPx] = useState<Record<number, { bid: number | null; ask: number | null }>>({})
  const [err, setErr] = useState<string | null>(null)
  const snap = snapFor('nado')

  async function load() {
    setErr(null)
    try {
      const data = await fetchNadoSymbols()
      setSyms(parseNadoSymbols(data))
      pushTape('nado', 'scan', 'Nado symbols query ok', undefined, true)
    } catch (e) {
      const m = safeError(e)
      setErr(m)
      pushTape('nado', 'error', m, undefined, false)
    }
    const next: Record<number, { bid: number | null; ask: number | null }> = {}
    for (const w of WATCH) {
      try {
        const data = await fetchNadoMarketPrice(w.id)
        next[w.id] = {
          bid: x18ToNumber(data?.data?.bid_x18 || data?.data?.market_price?.bid_x18),
          ask: x18ToNumber(data?.data?.ask_x18 || data?.data?.market_price?.ask_x18),
        }
      } catch (e) {
        setErr(safeError(e))
      }
    }
    setPx(next)
  }

  useEffect(() => {
    void load()
  }, [])

  function logIntent(side: 'BUY' | 'SELL', productId: number, symbol: string) {
    const t = `${side} ${symbol} product ${productId}`
    if (isDryRun() || !isArmed()) {
      pushTape('nado', 'paper', `PAPER intent ${t} — send on Nado`, { side }, true)
      return
    }
    pushTape(
      'nado',
      'block',
      'LIVE Nado /execute is not in this companion. MCP/gateway keys stay off this host.',
      { side },
      false,
    )
  }

  const focus = snap?.pair?.includes('QQQ') ? 98 : 90
  const venueMkt = nadoMarketParam(snap?.pair || 'WTI-PERP')

  return (
    <div className="page">
      <VenueDock name="Nado" href={VENUE.nadoPerp(venueMkt)} marketsHref={VENUE.nadoHome} />
      {err && (
        <div className="stub">
          Gateway may 403. Path is api.prod.nado.xyz/gateway/v1. {err}
        </div>
      )}

      <div className="ticker">
        {WATCH.map((w) => (
          <div key={w.id}>
            <span>
              {w.symbol} oracle / bid-ask
            </span>
            <b className="mono">
              <span className="ok">{fmtPx(px[w.id]?.bid, 4)}</span>
              <span className="muted"> / </span>
              <span className="bad">{fmtPx(px[w.id]?.ask, 4)}</span>
            </b>
          </div>
        ))}
        <div>
          <span>Equity</span>
          <b className="mono">{fmtUsd(snap?.equityUsd)}</b>
        </div>
        <div>
          <span>Mode</span>
          <b className="mono">{snap?.mode || '—'}</b>
        </div>
        <div>
          <span>Session</span>
          <b className={`mono ${(snap?.sessionPnlPct || 0) >= 0 ? 'ok' : 'bad'}`}>
            {snap?.sessionPnlPct != null ? fmtPct(snap.sessionPnlPct, true) : '—'}
          </b>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h2>Farm</h2>
          <div className="panel-body">
            <ul className="tiny">
              {NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            {(snap?.opens || []).map((o) => (
              <div key={o.market} className="tiny mono">
                {o.side} {o.size} {o.market} @{o.entry ?? '—'}
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-buy" type="button" onClick={() => logIntent('BUY', focus, snap?.pair || 'WTI-PERP')}>
                Log BUY intent
              </button>
              <button className="btn btn-sell" type="button" onClick={() => logIntent('SELL', focus, snap?.pair || 'WTI-PERP')}>
                Log SELL intent
              </button>
            </div>
          </div>
        </div>
        <div className="panel">
          <h2>Perps ({syms.length})</h2>
          <div className="scroll">
            <table className="term">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="num">Id</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {syms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Refresh gateway for the live symbol map.
                    </td>
                  </tr>
                )}
                {syms.map((s) => (
                  <tr key={s.product_id}>
                    <td>{s.symbol}</td>
                    <td className="num mono">{s.product_id}</td>
                    <td className="tiny">{s.trading_status || s.type}</td>
                    <td>
                      <a href={VENUE.nadoPerp(nadoMarketParam(s.symbol))} target="_blank" rel="noreferrer">
                        venue
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Tape desk="nado" />
    </div>
  )
}
