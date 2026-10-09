import { useEffect, useState } from 'react'
import { useSession } from '../lib/session'
import { loadTrustFeed, type TrustFeed } from '../lib/trust'
import { fmtPct, fmtPx, fmtUsd } from '../lib/format'

function Tile({
  k,
  v,
  sub,
  tone,
}: {
  k: string
  v: string
  sub?: string
  tone?: 'ok' | 'bad' | 'warn'
}) {
  return (
    <div className="farm-tile">
      <div className="farm-k">{k}</div>
      <div className={`farm-v mono ${tone || ''}`}>{v}</div>
      {sub ? <div className="farm-s">{sub}</div> : null}
    </div>
  )
}

export function TrustStrip() {
  const s = useSession()
  const [feed, setFeed] = useState<TrustFeed | null>(null)

  useEffect(() => {
    let live = true
    const tick = async () => {
      try {
        const next = await loadTrustFeed()
        if (live) setFeed(next)
      } catch {
        /* cells carry errors */
      }
    }
    void tick()
    const id = setInterval(() => void tick(), 15_000)
    return () => {
      live = false
      clearInterval(id)
    }
  }, [])

  const snap = feed?.snap
  const pair = snap?.pair || 'WTI-PERP'
  const wti = feed?.wti
  const apiOk = (feed?.venues || []).some((v) => v.ok)
  const status = snap?.status || (apiOk ? 'LIVE MARKS' : feed ? 'ERR' : '…')
  const mode = snap?.mode || (s.dryRun ? 'DRY_RUN' : s.armed ? 'LIVE ARMED' : 'DISARMED')
  const bbo =
    wti?.bid != null && wti?.ask != null
      ? `${fmtPx(wti.bid, 3)} / ${fmtPx(wti.ask, 3)}`
      : '—'

  return (
    <div className="farm">
      <div className="farm-head">
        <div className="farm-title">NADO DESK — LIVE FARM</div>
        <div className="mono tiny">{feed?.at ? feed.at.slice(0, 19).replace('T', ' ') : 'polling'} UTC</div>
      </div>
      <div className="farm-grid">
        <Tile
          k="Equity (USDT0)"
          v={fmtUsd(snap?.equityUsd)}
          sub={
            snap?.sessionPnlPct != null
              ? `${fmtPct(snap.sessionPnlPct, true)} vs session start`
              : snap
                ? 'journal snap'
                : 'import snap on Board'
          }
          tone={
            snap?.sessionPnlPct == null ? undefined : snap.sessionPnlPct >= 0 ? 'ok' : 'bad'
          }
        />
        <Tile
          k="Status"
          v={status}
          sub={
            snap
              ? `halt=${String(snap.halt ?? '—')}  cfg=${snap.cfg ?? '—'}`
              : apiOk
                ? 'public APIs ok · no journal'
                : feed?.venues.find((v) => !v.ok)?.error || 'waiting'
          }
          tone={status === 'ERR' ? 'bad' : 'ok'}
        />
        <Tile
          k="Mode"
          v={mode}
          sub={snap?.pos != null ? `${pair} pos=${snap.pos}` : s.dryRun ? 'default DRY_RUN' : undefined}
          tone={mode.includes('FLATTEN') || mode.includes('ARM') ? 'warn' : undefined}
        />
        <Tile
          k="Pair"
          v={pair}
          sub={`BBO ${bbo}`}
        />
        <Tile
          k="Anti-bleed"
          v={snap?.antibleedTicks != null ? `${snap.antibleedTicks} ticks out` : '—'}
          sub={
            snap?.requoteBps != null
              ? `requote ${snap.requoteBps} bps · age max ${snap.ageMaxSec ?? '—'}s · ${snap.flatten || '—'}`
              : 'from journal snap'
          }
        />
      </div>
      <div className="farm-foot">
        {snap?.note ||
          '24/7 MSI farm+watch · public marks only until a redacted snap is loaded · no secrets'}
        {snap ? ` · snap ${snap.at}` : ''}
      </div>
      <div className="ticker ticker-slim">
        {(feed?.venues || []).map((c) => (
          <div key={c.desk}>
            <span>
              {c.label} <em className={c.ok ? 'ok' : 'bad'}>{c.ok ? 'LIVE' : 'ERR'}</em>
            </span>
            <b className="mono">{c.mark ?? '—'}</b>
            <div className="tiny">{c.ok ? c.extra : c.error}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
