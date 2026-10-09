import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tape } from '../components/Tape'
import { VENUE } from '../lib/venues/links'
import { clearSnaps, importSnapText, loadSnaps, type DeskSnap } from '../lib/snaps'
import { fmtFund, fmtNum, fmtPct, fmtUsd } from '../lib/format'
import { safeError } from '../lib/redact'
import { fetchArcusMarkets } from '../lib/venues/arcus'
import { fetchLighterDetails, fetchLighterFunding, type LighterDetail, type LighterFunding } from '../lib/venues/lighter'

type SortKey = 'vol' | 'oi' | 'chg'

interface Row {
  desk: 'lighter' | 'arcus'
  symbol: string
  last: number
  chg: number
  chgPct: boolean
  vol: number
  oi: number
  fund?: number
  href: string
  path: string
}

export function Hub() {
  const [snaps, setSnaps] = useState<DeskSnap[]>([])
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('oi')
  const [desk, setDesk] = useState<'all' | 'lighter' | 'arcus'>('all')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    setSnaps(loadSnaps())
  }, [])

  async function loadMarkets() {
    try {
      const [det, funds, arcus] = await Promise.all([
        fetchLighterDetails(),
        fetchLighterFunding(),
        fetchArcusMarkets().catch(() => [] as Awaited<ReturnType<typeof fetchArcusMarkets>>),
      ])
      const books = det.order_book_details || []
      const fr = funds.filter((f: LighterFunding) => f.exchange === 'lighter')
      const lighter: Row[] = books.map((d: LighterDetail) => ({
        desk: 'lighter',
        symbol: d.symbol,
        last: Number(d.last_trade_price ?? d.mark_price ?? 0),
        chg: d.daily_price_change || 0,
        chgPct: true,
        vol: d.daily_quote_token_volume || 0,
        oi: d.open_interest || 0,
        fund: fr.find((f) => f.symbol === d.symbol)?.rate,
        href: VENUE.lighterTrade(d.symbol),
        path: '/lighter',
      }))
      const arcusRows: Row[] = arcus
        .filter((m) => m.status === 'ONLINE')
        .map((m) => ({
          desk: 'arcus',
          symbol: m.marketDisplayName,
          last: Number(m.lastTradePrice || m.markPrice || m.lastPrice || 0),
          chg: Number(m.priceChange24h || 0),
          chgPct: false,
          vol: Number(m.volume24hNotional || 0),
          oi: Number(m.openInterest || 0),
          fund: m.fundingRate != null ? Number(m.fundingRate) : undefined,
          href: VENUE.arcusTrade(m.marketDisplayName),
          path: '/arcus',
        }))
      setRows([...lighter, ...arcusRows])
      setLoadErr(null)
    } catch (e) {
      setLoadErr(safeError(e))
    }
  }

  useEffect(() => {
    void loadMarkets()
    const id = setInterval(() => void loadMarkets(), 20_000)
    return () => clearInterval(id)
  }, [])

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter((r) => (desk === 'all' ? true : r.desk === desk))
      .filter((r) => !needle || r.symbol.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === 'vol') return b.vol - a.vol
        if (sort === 'chg') return Math.abs(b.chg) - Math.abs(a.chg)
        return b.oi - a.oi
      })
  }, [rows, q, sort, desk])

  const lighterOnly = rows.filter((r) => r.desk === 'lighter')
  const topOi = [...lighterOnly].sort((a, b) => b.oi - a.oi).slice(0, 3)
  const gainers = [...lighterOnly].filter((r) => r.chg > 0).sort((a, b) => b.chg - a.chg).slice(0, 3)
  const losers = [...lighterOnly].filter((r) => r.chg < 0).sort((a, b) => a.chg - b.chg).slice(0, 3)

  function refreshSnaps() {
    setSnaps(loadSnaps())
  }

  function onImport() {
    setErr(null)
    try {
      importSnapText(paste, 'paste')
      setPaste('')
      refreshSnaps()
    } catch (e) {
      setErr(safeError(e))
    }
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Markets</h1>
          <p>Live Lighter + Arcus public books. Trade on the venue; this table is the ops index.</p>
        </div>
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search markets"
        />
      </div>
      {loadErr && <div className="bad">{loadErr}</div>}

      <div className="sum-row">
        <div className="sum">
          <div className="farm-k">Top open interest 24h</div>
          {topOi.map((r) => (
            <div key={r.symbol} className="sum-line">
              <span>{r.symbol}</span>
              <b className="mono">{fmtNum(r.oi)}</b>
            </div>
          ))}
        </div>
        <div className="sum">
          <div className="farm-k">Top gainers 24h</div>
          {gainers.map((r) => (
            <div key={r.symbol} className="sum-line">
              <span>{r.symbol}</span>
              <b className="mono ok">{fmtPct(r.chg, r.chgPct)}</b>
            </div>
          ))}
        </div>
        <div className="sum">
          <div className="farm-k">Top losers 24h</div>
          {losers.map((r) => (
            <div key={r.symbol} className="sum-line">
              <span>{r.symbol}</span>
              <b className="mono bad">{fmtPct(r.chg, r.chgPct)}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="row">
        {(['all', 'lighter', 'arcus'] as const).map((d) => (
          <button
            key={d}
            className={`btn ${desk === d ? 'btn-on' : ''}`}
            type="button"
            onClick={() => setDesk(d)}
          >
            {d}
          </button>
        ))}
        <span className="tiny">sort</span>
        {(['oi', 'vol', 'chg'] as const).map((k) => (
          <button key={k} className={`btn ${sort === k ? 'btn-on' : ''}`} type="button" onClick={() => setSort(k)}>
            {k === 'chg' ? '24h' : k.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="scroll scroll-lg">
          <table className="term">
            <thead>
              <tr>
                <th>Market</th>
                <th className="num">Last</th>
                <th className="num">24h</th>
                <th className="num">Volume</th>
                <th className="num">Open interest</th>
                <th className="num">Funding</th>
                <th>Desk</th>
              </tr>
            </thead>
            <tbody>
              {view.slice(0, 200).map((r) => (
                <tr key={r.desk + r.symbol}>
                  <td>
                    <a href={r.href} target="_blank" rel="noreferrer">
                      {r.symbol}
                    </a>
                    <div className="tiny">{r.desk}</div>
                  </td>
                  <td className="num mono">{r.last ? r.last.toLocaleString() : '—'}</td>
                  <td className={`num mono ${r.chg >= 0 ? 'ok' : 'bad'}`}>{fmtPct(r.chg, r.chgPct)}</td>
                  <td className="num mono">{fmtUsd(r.vol)}</td>
                  <td className="num mono">{fmtNum(r.oi)}</td>
                  <td className="num mono">{fmtFund(r.fund)}</td>
                  <td>
                    <Link to={r.path}>ops</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h2>Redacted journal snaps</h2>
          <div className="panel-body">
            <p className="tiny">
              Paste farm JSON (equity / mode / pair / anti-bleed / opens). Missing fields stay —. Loaded:{' '}
              {snaps.map((s) => s.venue).join(', ') || 'none'}
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder='{"desk":"nado","equityUsd":0,"status":"RUNNING","mode":"FLAT","pair":"WTI-PERP","antibleedTicks":0}'
              spellCheck={false}
            />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" type="button" onClick={onImport} disabled={!paste.trim()}>
                Import
              </button>
              <label className="btn">
                File
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    void f.text().then((t) => {
                      try {
                        importSnapText(t, 'file')
                        refreshSnaps()
                      } catch (er) {
                        setErr(safeError(er))
                      }
                    })
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  clearSnaps()
                  refreshSnaps()
                }}
              >
                Clear
              </button>
            </div>
            {err && <div className="bad">{err}</div>}
          </div>
        </div>
        <Tape />
      </div>
    </div>
  )
}
