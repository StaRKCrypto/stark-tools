import { useEffect, useState } from 'react'
import {
  fetchLighterBooks,
  fetchLighterDetails,
  fetchLighterFunding,
  fetchLighterStats,
  type LighterDetail,
  type LighterFunding,
  type LighterStat,
} from '../lib/venues/lighter'
import { Tape } from '../components/Tape'
import { VenueDock } from '../components/VenueDock'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'
import { VENUE } from '../lib/venues/links'
import { fmtFund, fmtNum, fmtPct, fmtUsd } from '../lib/format'
import { isArmed, isDryRun } from '../lib/vault'

type SortKey = 'vol' | 'oi' | 'chg'

export function Lighter() {
  const [stats, setStats] = useState<LighterStat[]>([])
  const [details, setDetails] = useState<LighterDetail[]>([])
  const [funds, setFunds] = useState<LighterFunding[]>([])
  const [sym, setSym] = useState('BTC')
  const [sort, setSort] = useState<SortKey>('vol')
  const [err, setErr] = useState<string | null>(null)
  const [bookCount, setBookCount] = useState(0)

  async function load() {
    try {
      const [books, st, det, fr] = await Promise.all([
        fetchLighterBooks(),
        fetchLighterStats(),
        fetchLighterDetails(),
        fetchLighterFunding(),
      ])
      setBookCount(books.length)
      setStats(st)
      setDetails(det.order_book_details || [])
      setFunds(fr.filter((x) => x.exchange === 'lighter'))
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

  const rows = details
    .map((d) => {
      const st = stats.find((s) => s.symbol === d.symbol)
      const fund = funds.find((f) => f.symbol === d.symbol)
      return {
        ...d,
        vol: d.daily_quote_token_volume ?? st?.daily_quote_token_volume ?? 0,
        chg: d.daily_price_change ?? st?.daily_price_change ?? 0,
        fund: fund?.rate,
      }
    })
    .sort((a, b) => {
      if (sort === 'oi') return (b.open_interest || 0) - (a.open_interest || 0)
      if (sort === 'chg') return Math.abs(b.chg) - Math.abs(a.chg)
      return (b.vol || 0) - (a.vol || 0)
    })

  const row = rows.find((x) => x.symbol === sym) || rows[0]

  function logIntent(side: 'BUY' | 'SELL') {
    const t = `${side} ${row?.symbol || sym} @ ${row?.last_trade_price ?? '—'}`
    if (isDryRun() || !isArmed()) {
      pushTape('lighter', 'paper', `PAPER intent ${t} — send on Lighter`, { side }, true)
      return
    }
    pushTape(
      'lighter',
      'block',
      'LIVE Lighter send is not in this companion. Private signer stays off this host.',
      { side },
      false,
    )
  }

  return (
    <div className="page">
      <VenueDock
        name="Lighter"
        href={VENUE.lighterTrade(row?.symbol || sym)}
        marketsHref={VENUE.lighterMarkets}
      />
      <div className="page-h">
        <div>
          <h1>{row?.symbol || sym}</h1>
          <p>{bookCount} public books. Chart/book/ticket on app.lighter.xyz.</p>
        </div>
        <button className="btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {err && <div className="bad">{err}</div>}

      <div className="ticker">
        <div>
          <span>Mark</span>
          <b className="mono">{row?.mark_price ?? '—'}</b>
        </div>
        <div>
          <span>Index</span>
          <b className="mono">{row?.index_price ?? '—'}</b>
        </div>
        <div>
          <span>Last</span>
          <b className="mono">{row?.last_trade_price ?? '—'}</b>
        </div>
        <div>
          <span>24h</span>
          <b className={`mono ${(row?.chg || 0) >= 0 ? 'ok' : 'bad'}`}>{fmtPct(row?.chg, true)}</b>
        </div>
        <div>
          <span>Vol</span>
          <b className="mono">{fmtUsd(row?.vol)}</b>
        </div>
        <div>
          <span>OI</span>
          <b className="mono">{fmtNum(row?.open_interest)}</b>
        </div>
        <div>
          <span>Funding</span>
          <b className="mono">{fmtFund(row?.fund)}</b>
        </div>
      </div>

      <div className="panel">
        <h2>
          Public perps
          <span className="tiny" style={{ marginLeft: 8 }}>
            sort
            <button className="btn" type="button" onClick={() => setSort('vol')}>
              vol
            </button>
            <button className="btn" type="button" onClick={() => setSort('oi')}>
              OI
            </button>
            <button className="btn" type="button" onClick={() => setSort('chg')}>
              24h
            </button>
          </span>
        </h2>
        <div className="scroll">
          <table className="term">
            <thead>
              <tr>
                <th>Market</th>
                <th className="num">Last</th>
                <th className="num">24h</th>
                <th className="num">Vol</th>
                <th className="num">OI</th>
                <th className="num">Funding</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((r) => (
                <tr key={r.symbol} className="clickable" onClick={() => setSym(r.symbol)}>
                  <td>{r.symbol}</td>
                  <td className="num mono">{r.last_trade_price ?? r.mark_price ?? '—'}</td>
                  <td className={`num ${r.chg >= 0 ? 'ok' : 'bad'}`}>{fmtPct(r.chg, true)}</td>
                  <td className="num mono">{fmtUsd(r.vol)}</td>
                  <td className="num mono">{fmtNum(r.open_interest)}</td>
                  <td className="num mono">{fmtFund(r.fund)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="row">
        <button className="btn btn-buy" type="button" onClick={() => logIntent('BUY')}>
          Log BUY intent
        </button>
        <button className="btn btn-sell" type="button" onClick={() => logIntent('SELL')}>
          Log SELL intent
        </button>
      </div>
      <Tape desk="lighter" />
    </div>
  )
}
