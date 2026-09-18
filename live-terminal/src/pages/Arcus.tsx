import { useEffect, useState } from 'react'
import {
  fetchArcusBbo,
  fetchArcusCandles,
  fetchArcusMarkets,
  type ArcusMarket,
} from '../lib/venues/arcus'
import { analyzeSr } from '../lib/venues/sr'
import { Tape } from '../components/Tape'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { useSession } from '../lib/session'
import { isArmed, isDryRun } from '../lib/vault'

export function Arcus() {
  const s = useSession()
  const [markets, setMarkets] = useState<ArcusMarket[]>([])
  const [sym, setSym] = useState('BTC-USD')
  const [bbo, setBbo] = useState<{ bid?: string; ask?: string }>({})
  const [sr, setSr] = useState<ReturnType<typeof analyzeSr> | null>(null)
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [qty, setQty] = useState('0.001')
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setErr(null)
    try {
      const m = await fetchArcusMarkets()
      setMarkets(m.filter((x) => x.status === 'ONLINE').slice(0, 80))
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

  function submit() {
    const ticket = `${side} ${qty} ${sym} @ mark ${sr?.px ?? '—'}`
    if (isDryRun() || !isArmed()) {
      pushTape('arcus', 'paper', `PAPER ${ticket} (Ed25519 placeOrder not sent)`, { side }, true)
      return
    }
    pushTape(
      'arcus',
      'block',
      'LIVE Arcus placeOrder is a stub here. Needs ARCUS_API_PRIVATE_KEY (32-byte Ed25519 seed) + Scheme 1 signing from arcus_client.py — not an EVM key.',
      { side },
      false,
    )
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Arcus · S/R desk</h1>
          <p>Public REST api.arcus.xyz · swings/ATR/bias ported from sr_loop.py</p>
        </div>
        <button className="btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {err && <div className="bad">{err}</div>}
      <div className="grid-3">
        <div className="stat">
          <div className="lbl">Last / mark</div>
          <div className="val">{sr?.px ? sr.px.toFixed(2) : '—'}</div>
        </div>
        <div className="stat">
          <div className="lbl">BBO</div>
          <div className="val">
            {bbo.bid ?? '—'} / {bbo.ask ?? '—'}
          </div>
        </div>
        <div className="stat">
          <div className="lbl">Bias · ATR</div>
          <div className="val">
            {sr?.bias ?? '—'} · {sr?.atr ? sr.atr.toFixed(2) : '—'}
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h2>Markets</h2>
          <div style={{ maxHeight: '52vh', overflow: 'auto' }}>
            <table className="term">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Id</th>
                  <th>Tick</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => (
                  <tr
                    key={m.marketId}
                    className="clickable"
                    onClick={() => setSym(m.marketDisplayName)}
                  >
                    <td>{m.marketDisplayName}</td>
                    <td className="mono">{m.marketId}</td>
                    <td className="mono">{m.tickSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>S/R · {sym}</h2>
            <div className="panel-body">
              <div>Support {sr?.support ?? '—'} ({sr?.supportZone ?? '—'})</div>
              <div>Resist {sr?.resist ?? '—'} ({sr?.resistZone ?? '—'})</div>
              <div className="tiny">
                Highs {sr?.swingHighs.map((n) => n.toFixed(1)).join(', ') || '—'}
              </div>
            </div>
          </div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Order ticket</h2>
            <div className="panel-body ticket">
              <div className="row">
                <button className="btn" type="button" onClick={() => setSide('BUY')}>
                  BUY
                </button>
                <button className="btn" type="button" onClick={() => setSide('SELL')}>
                  SELL
                </button>
              </div>
              <label className="field">
                Quantity
                <input value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <button className="btn btn-primary" type="button" onClick={submit} disabled={!s.hasKey && !s.dryRun}>
                {s.dryRun || !s.armed ? 'Paper ticket' : 'Submit (stub)'}
              </button>
              <div className="stub">
                Execution stub: Arcus orders use Ed25519 Scheme 1 (not the EVM vault key). Attach
                arcus_client.py / a local signer before LIVE. Host allowlist api.arcus.xyz only.
                Vault is {s.hasKey ? 'present (EVM)' : 'empty'}.
              </div>
            </div>
          </div>
          <Tape desk="arcus" />
        </div>
      </div>
    </div>
  )
}
