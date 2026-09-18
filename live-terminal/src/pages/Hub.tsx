import { Link } from 'react-router-dom'
import { useSession } from '../lib/session'

const desks = [
  {
    to: '/nimbus',
    title: 'Nimbus',
    body: 'Polymarket daily-max weather. Gamma scan, Open-Meteo + METAR snaps, Kelly/ladder/veto engine from the live Nimbus source.',
  },
  {
    to: '/mint',
    title: 'Mint Sniper',
    body: 'SeaDrop getPublicDrop + rug score + optional mintPublic. Scout never auto-mints. Free public only.',
  },
  {
    to: '/arcus',
    title: 'Arcus S/R',
    body: 'Live api.arcus.xyz markets, BBO, 15m candles. Swing S/R from the Arcus sr_loop detector. Orders stubbed (Ed25519 API key).',
  },
  {
    to: '/lighter',
    title: 'Lighter',
    body: 'Live zklighter public order books + exchange stats. Execution stays a labeled stub until the private Lighter signer is attached.',
  },
  {
    to: '/nado',
    title: 'Nado',
    body: 'Operator farm notes (QQQ-PERP / WTI) plus documented gateway queries. Execution stub. Cloudflare may 403 the public REST.',
  },
]

export function Hub() {
  const s = useSession()
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Live Terminal</h1>
          <p>
            Operator desks wired from real bot sources. Vault {s.hasKey ? 'loaded' : 'empty'} ·{' '}
            {s.dryRun ? 'safe mode on' : 'LIVE mode'} · {s.armed ? 'armed' : 'disarmed'}
          </p>
        </div>
      </div>
      <div className="grid-3">
        <div className="stat">
          <div className="lbl">Vault</div>
          <div className="val">{s.address ? s.address.slice(0, 10) + '…' : '—'}</div>
        </div>
        <div className="stat">
          <div className="lbl">Mode</div>
          <div className={`val ${s.dryRun ? 'pos' : 'neg'}`}>{s.dryRun ? 'DRY_RUN' : 'LIVE'}</div>
        </div>
        <div className="stat">
          <div className="lbl">Arm</div>
          <div className="val">{s.armed ? 'ARMED' : 'OFF'}</div>
        </div>
      </div>
      <div className="grid-cards">
        {desks.map((d) => (
          <Link key={d.to} className="hub-card" to={d.to}>
            <h3>{d.title}</h3>
            <p className="tiny">{d.body}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
