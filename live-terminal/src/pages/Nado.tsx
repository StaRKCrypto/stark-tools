import { useState } from 'react'
import { fetchNadoMarketPrice, fetchNadoSymbols, x18ToNumber } from '../lib/venues/nado'
import { Tape } from '../components/Tape'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { useSession } from '../lib/session'
import { isArmed, isDryRun } from '../lib/vault'

const NOTES = [
  'Primary: QQQ-PERP (product 98) until equity supports WTI $100 min clip',
  'WTI-PERP (90) deferred: max notional may sit under venue $100 min',
  'Min notional ~$100/order; inventory-first — cover toward flat after fill',
  'Gateway REST: GET /gateway/v1/query?type=symbols&product_type=perp (docs.nado.xyz)',
  'Executes need authenticated /execute — stubbed in this terminal',
]

export function Nado() {
  const s = useSession()
  const [raw, setRaw] = useState<string>('')
  const [px, setPx] = useState<string>('')
  const [pid, setPid] = useState('98')
  const [err, setErr] = useState<string | null>(null)
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [qty, setQty] = useState('0.142')

  async function loadSymbols() {
    setErr(null)
    try {
      const data = await fetchNadoSymbols()
      setRaw(JSON.stringify(data, null, 2).slice(0, 4000))
      pushTape('nado', 'scan', 'Nado symbols query ok', undefined, true)
    } catch (e) {
      const m = safeError(e)
      setErr(m)
      setRaw('')
      pushTape('nado', 'error', m, undefined, false)
    }
  }

  async function loadPx() {
    setErr(null)
    try {
      const data = await fetchNadoMarketPrice(Number(pid))
      const bid = x18ToNumber(data?.data?.bid_x18 || data?.data?.market_price?.bid_x18)
      const ask = x18ToNumber(data?.data?.ask_x18 || data?.data?.market_price?.ask_x18)
      setPx(`product ${pid} bid=${bid ?? 'n/a'} ask=${ask ?? 'n/a'}\n${JSON.stringify(data).slice(0, 800)}`)
    } catch (e) {
      setErr(safeError(e))
    }
  }

  function submit() {
    const t = `${side} ${qty} product ${pid}`
    if (isDryRun() || !isArmed()) {
      pushTape('nado', 'paper', `PAPER ${t}`, { side }, true)
      return
    }
    pushTape(
      'nado',
      'block',
      'LIVE Nado /execute is a stub. MCP/gateway keys are not stored in this app.',
      { side },
      false,
    )
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Nado · farm / MM</h1>
          <p>Documented public gateway + operator notes from the Nado farm source. No invented book.</p>
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={() => void loadSymbols()}>
            Query symbols
          </button>
          <button className="btn" type="button" onClick={() => void loadPx()}>
            Query price
          </button>
        </div>
      </div>
      {err && (
        <div className="stub">
          Public Nado REST may return Cloudflare 403 from some networks. The query path is real
          (<code>api.prod.nado.xyz/gateway/v1</code>). {err}
        </div>
      )}
      <div className="grid-2">
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Farm notes</h2>
            <div className="panel-body">
              <ul className="tiny">
                {NOTES.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="panel">
            <h2>Gateway payload</h2>
            <pre className="tiny" style={{ padding: 12, whiteSpace: 'pre-wrap', maxHeight: 320, overflow: 'auto' }}>
              {px || raw || 'No query yet — buttons hit the documented Nado gateway.'}
            </pre>
          </div>
        </div>
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Order ticket (stub)</h2>
            <div className="panel-body ticket">
              <label className="field">
                Product id
                <input value={pid} onChange={(e) => setPid(e.target.value)} />
              </label>
              <div className="row">
                <button className="btn" type="button" onClick={() => setSide('BUY')}>
                  BUY
                </button>
                <button className="btn" type="button" onClick={() => setSide('SELL')}>
                  SELL
                </button>
              </div>
              <label className="field">
                Size
                <input value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <button className="btn btn-primary" type="button" onClick={submit}>
                {s.dryRun || !s.armed ? 'Paper ticket' : 'Submit (stub)'}
              </button>
              <div className="stub">
                Executes require Nado gateway auth. This terminal will not store MCP keys. EVM vault
                is unrelated to Nado signing.
              </div>
            </div>
          </div>
          <Tape desk="nado" />
        </div>
      </div>
    </div>
  )
}
