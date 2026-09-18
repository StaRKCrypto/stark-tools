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
import { ageLabel, fmtPx, fmtUsd } from '../lib/format'
import { isArmed, isDryRun } from '../lib/vault'

const NOTES = [
  'Primary: QQQ-PERP (product 98) until equity supports WTI $100 min clip',
  'WTI-PERP (90) deferred: max notional may sit under venue $100 min',
  'Min notional ~$100/order; inventory-first — cover toward flat after fill',
  'Gateway REST: GET /gateway/v1/query?type=symbols&product_type=perp',
  'Executes need authenticated /execute — use app.nado.xyz, not this companion',
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

  const qqq = px[98]

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Nado companion</h1>
          <p>Farm / MM ops. Perps desk is app.nado.xyz — this pane is health + journal.</p>
        </div>
        <button className="btn" type="button" onClick={() => void load()}>
          Refresh gateway
        </button>
      </div>
      {err && (
        <div className="stub">
          Public Nado REST may return Cloudflare 403. Path is real (
          <code>api.prod.nado.xyz/gateway/v1</code>). {err}
        </div>
      )}
      <div className="split">
        <VenueDock name="Nado" href={VENUE.nadoPerp('QQQ')} marketsHref={VENUE.nadoHome} />
        <div className="panel">
          <h2>Journal · farm</h2>
          <div className="panel-body">
            <div className="kv">
              <span>Equity</span>
              <b className="mono">{fmtUsd(snap?.equityUsd)}</b>
            </div>
            <div className="kv">
              <span>Available</span>
              <b className="mono">{fmtUsd(snap?.availableUsd)}</b>
            </div>
            <div className="kv">
              <span>Day PnL</span>
              <b className="mono">{fmtUsd(snap?.pnlDayUsd)}</b>
            </div>
            <div className="kv">
              <span>Opens</span>
              <b className="mono">{snap ? snap.opens.length : '—'}</b>
            </div>
            <div className="kv">
              <span>Snap</span>
              <b className="mono">{ageLabel(snap?.at)}</b>
            </div>
            {(snap?.opens || []).map((o) => (
              <div key={o.market} className="tiny mono">
                {o.side} {o.size} {o.market} @{o.entry ?? '—'} upnl {o.upnl ?? '—'}
              </div>
            ))}
            {!snap && <p className="tiny">Load a redacted snap on the Ops board to populate equity/opens.</p>}
          </div>
        </div>
      </div>

      <div className="ticker">
        {WATCH.map((w) => (
          <div key={w.id}>
            <span>{w.symbol}</span>
            <b className="mono">
              <span className="ok">{fmtPx(px[w.id]?.bid, 4)}</span> /{' '}
              <span className="bad">{fmtPx(px[w.id]?.ask, 4)}</span>
            </b>
          </div>
        ))}
        <div>
          <span>QQQ venue</span>
          <b>
            <a href={VENUE.nadoPerp('QQQ')} target="_blank" rel="noreferrer">
              open
            </a>
          </b>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h2>Farm notes</h2>
          <div className="panel-body">
            <ul className="tiny">
              {NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-buy" type="button" onClick={() => logIntent('BUY', 98, 'QQQ-PERP')}>
                Log QQQ BUY
              </button>
              <button className="btn btn-sell" type="button" onClick={() => logIntent('SELL', 98, 'QQQ-PERP')}>
                Log QQQ SELL
              </button>
            </div>
            {qqq && <p className="tiny">BBO from gateway, not a reconstructed book.</p>}
          </div>
        </div>
        <div className="panel">
          <h2>Perps ({syms.length})</h2>
          <div className="scroll">
            <table className="term">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Id</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {syms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No symbols yet (gateway error above, or tap refresh).
                    </td>
                  </tr>
                )}
                {syms.map((s) => (
                  <tr key={s.product_id}>
                    <td>{s.symbol}</td>
                    <td className="mono">{s.product_id}</td>
                    <td className="tiny">{s.trading_status || s.type}</td>
                    <td>
                      <a
                        href={VENUE.nadoPerp(nadoMarketParam(s.symbol))}
                        target="_blank"
                        rel="noreferrer"
                      >
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
