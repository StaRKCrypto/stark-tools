import { useEffect, useState } from 'react'
import { fetchLighterBooks, fetchLighterStats, type LighterStat } from '../lib/venues/lighter'
import { Tape } from '../components/Tape'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { useSession } from '../lib/session'
import { isArmed, isDryRun } from '../lib/vault'

export function Lighter() {
  const s = useSession()
  const [stats, setStats] = useState<LighterStat[]>([])
  const [sym, setSym] = useState('BTC')
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [qty, setQty] = useState('0.01')
  const [err, setErr] = useState<string | null>(null)
  const [bookCount, setBookCount] = useState(0)

  async function load() {
    try {
      const [books, st] = await Promise.all([fetchLighterBooks(), fetchLighterStats()])
      setBookCount(books.length)
      setStats(st.slice(0, 80))
      setErr(null)
    } catch (e) {
      setErr(safeError(e))
    }
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 20_000)
    return () => clearInterval(id)
  }, [])

  const row = stats.find((x) => x.symbol === sym) || stats[0]

  function submit() {
    const t = `${side} ${qty} ${row?.symbol || sym} @ ${row?.last_trade_price ?? '—'}`
    if (isDryRun() || !isArmed()) {
      pushTape('lighter', 'paper', `PAPER ${t}`, { side }, true)
      return
    }
    pushTape(
      'lighter',
      'block',
      'LIVE Lighter send is a stub. Private lighter-*.env signer is intentionally not in this repo.',
      { side },
      false,
    )
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Lighter · public books</h1>
          <p>
            mainnet.zklighter.elliot.ai orderBooks + exchangeStats · {bookCount} markets
          </p>
        </div>
        <button className="btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {err && <div className="bad">{err}</div>}
      <div className="grid-2">
        <div className="panel">
          <h2>Stats</h2>
          <div style={{ maxHeight: '64vh', overflow: 'auto' }}>
            <table className="term">
              <thead>
                <tr>
                  <th>Sym</th>
                  <th>Last</th>
                  <th>Δ 24h</th>
                  <th>Trades</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((r) => (
                  <tr key={r.symbol} className="clickable" onClick={() => setSym(r.symbol)}>
                    <td>{r.symbol}</td>
                    <td className="mono">{r.last_trade_price}</td>
                    <td className={r.daily_price_change >= 0 ? 'ok' : 'bad'}>
                      {(r.daily_price_change * 100).toFixed(2)}%
                    </td>
                    <td className="mono">{r.daily_trades_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Ticket · {row?.symbol || sym}</h2>
            <div className="panel-body ticket">
              <div className="stat">
                <div className="lbl">Last trade</div>
                <div className="val">{row?.last_trade_price ?? '—'}</div>
              </div>
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
                Execution stub until the RH Lighter API signer is attached. Public market data
                above is live. Do not commit lighter-*.env.
              </div>
            </div>
          </div>
          <Tape desk="lighter" />
        </div>
      </div>
    </div>
  )
}
