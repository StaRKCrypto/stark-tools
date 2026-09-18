import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tape } from '../components/Tape'
import { VENUE } from '../lib/venues/links'
import { clearSnaps, importSnapText, loadSnaps, type DeskSnap } from '../lib/snaps'
import { ageLabel, fmtUsd } from '../lib/format'
import { useSession } from '../lib/session'
import { safeError } from '../lib/redact'

const ROWS: Array<{
  desk: DeskSnap['venue']
  label: string
  path: string
  href: string
  job: string
}> = [
  {
    desk: 'lighter',
    label: 'Lighter',
    path: '/lighter',
    href: VENUE.lighterTrade('BTC'),
    job: 'Public books + RH signer stub. Trade on app.lighter.xyz.',
  },
  {
    desk: 'arcus',
    label: 'Arcus',
    path: '/arcus',
    href: VENUE.arcusTrade('BTC-USD'),
    job: 'S/R from live 15m candles. Orders on app.arcus.xyz.',
  },
  {
    desk: 'nado',
    label: 'Nado',
    path: '/nado',
    href: VENUE.nadoPerp('QQQ'),
    job: 'Farm notes + gateway. Execute on app.nado.xyz/perpetuals.',
  },
  {
    desk: 'nimbus',
    label: 'Nimbus',
    path: '/nimbus',
    href: VENUE.polymarketHome,
    job: 'Weather scan / Kelly. CLOB on polymarket.com.',
  },
  {
    desk: 'mint',
    label: 'Mint',
    path: '/mint',
    href: VENUE.openseaDrops,
    job: 'SeaDrop probe + snipe. Collection UI on OpenSea.',
  },
]

export function Hub() {
  const s = useSession()
  const [snaps, setSnaps] = useState<DeskSnap[]>([])
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setSnaps(loadSnaps())
  }, [])

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

  function onFile(file: File) {
    setErr(null)
    void file.text().then((t) => {
      try {
        importSnapText(t, 'file')
        refreshSnaps()
      } catch (e) {
        setErr(safeError(e))
      }
    })
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Ops board</h1>
          <p>
            Companion only. Vault {s.hasKey ? 'loaded' : 'empty'} · {s.dryRun ? 'DRY_RUN' : 'LIVE'} ·{' '}
            {s.armed ? 'armed' : 'disarmed'}
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Desks</h2>
        <table className="term">
          <thead>
            <tr>
              <th>Desk</th>
              <th>Venue</th>
              <th>Journal eq</th>
              <th>Opens</th>
              <th>Snap age</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const snap = snaps.find((x) => x.venue === r.desk)
              return (
                <tr key={r.desk}>
                  <td>
                    <Link to={r.path}>{r.label}</Link>
                    <div className="tiny">{r.job}</div>
                  </td>
                  <td>
                    <a href={r.href} target="_blank" rel="noreferrer">
                      {r.href.replace(/^https:\/\//, '')}
                    </a>
                  </td>
                  <td className="mono">{fmtUsd(snap?.equityUsd)}</td>
                  <td className="mono">{snap ? snap.opens.length : '—'}</td>
                  <td className="mono tiny">{ageLabel(snap?.at)}</td>
                  <td>
                    <Link className="btn" to={r.path}>
                      Companion
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="split">
        <div className="panel">
          <h2>Load redacted journal snaps</h2>
          <div className="panel-body">
            <p className="tiny">
              Paste operator JSON from the live bots (equity / opens / fills). Missing fields stay
              em-dash — nothing is invented. Keys in the blob are redacted on import.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder='{"venue":"nado","at":"2026-09-18T22:00:00Z","equityUsd":0,"opens":[]}'
              spellCheck={false}
            />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" type="button" onClick={onImport} disabled={!paste.trim()}>
                Import paste
              </button>
              <label className="btn">
                Import file
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onFile(f)
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
                Clear snaps
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
