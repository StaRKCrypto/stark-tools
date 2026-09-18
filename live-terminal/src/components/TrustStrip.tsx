import { useEffect, useState } from 'react'
import { loadTrustFeed, type TrustFeed } from '../lib/trust'
import { ageLabel, fmtUsd } from '../lib/format'

export function TrustStrip() {
  const [feed, setFeed] = useState<TrustFeed | null>(null)

  useEffect(() => {
    let live = true
    const tick = async () => {
      try {
        const next = await loadTrustFeed()
        if (live) setFeed(next)
      } catch {
        /* cells already carry errors */
      }
    }
    void tick()
    const id = setInterval(() => void tick(), 20_000)
    return () => {
      live = false
      clearInterval(id)
    }
  }, [])

  const cells = feed?.cells || []

  return (
    <div className="trust">
      <div className="trust-k">LIVE OPS</div>
      {cells.length === 0 && <div className="trust-cell muted">polling Arcus / Lighter / Nado…</div>}
      {cells.map((c) => (
        <div key={c.desk} className={`trust-cell ${c.ok ? '' : 'trust-bad'}`}>
          <div className="trust-h">
            <span>{c.label}</span>
            <span className={c.ok ? 'ok' : 'bad'}>{c.ok ? 'LIVE' : 'ERR'}</span>
          </div>
          <div className="trust-mark mono">{c.mark ?? '—'}</div>
          <div className="tiny">
            {c.ok ? c.extra : c.error}
            {c.snap ? (
              <>
                {' '}
                · eq {fmtUsd(c.snap.equityUsd)} · opens {c.snap.opens.length} · {ageLabel(c.snap.at)}
              </>
            ) : (
              ' · no journal snap'
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
