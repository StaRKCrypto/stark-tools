import { useState } from 'react'
import { runScan, type CityScanRow, type ScanResult } from '../lib/nimbus/scan'
import { placeNimbusOrder } from '../lib/nimbus/orders'
import { STRATEGY } from '../lib/nimbus/engine'
import { Tape } from '../components/Tape'
import { safeError } from '../lib/redact'
import { useSession } from '../lib/session'
import { pushTape } from '../lib/activity'

export function Nimbus() {
  const s = useSession()
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState<CityScanRow | null>(null)
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [usd, setUsd] = useState('6')
  const [msg, setMsg] = useState<string | null>(null)

  async function onScan() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await runScan({ force: true })
      setScan(res)
      pushTape(
        'nimbus',
        'scan',
        `Scan ${res.cities.length} cities in ${res.durationMs}ms${res.error ? ' · ' + res.error : ''}`,
        undefined,
        !res.error,
      )
      if (res.cities[0]) setSel(res.cities[0])
    } catch (e) {
      setMsg(safeError(e))
    } finally {
      setBusy(false)
    }
  }

  const top = sel?.buckets.find((b) => b.side && b.kellyStake > 0) || sel?.buckets[0]
  const token = side === 'YES' ? top?.yesTokenId : top?.noTokenId
  const px = side === 'YES' ? top?.yesPrice : top?.noPrice

  async function send() {
    if (!sel || !top || !token || px == null) return
    const res = await placeNimbusOrder({
      city: sel,
      label: top.label,
      side,
      tokenId: token,
      price: px,
      amountUsd: Number(usd) || STRATEGY.minTicketUsd,
      tickSize: top.tickSize,
      negRisk: top.negRisk,
    })
    setMsg(res.error || res.note || res.status)
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Nimbus · weather CLOB</h1>
          <p>
            Engine: minEdge {(STRATEGY.minEdge * 100).toFixed(0)}¢ · fee {(STRATEGY.feeHaircut * 100).toFixed(0)}¢ ·
            tickets ${STRATEGY.minTicketUsd}–${STRATEGY.maxTicketUsd} · cap ${STRATEGY.hardCapUsd}
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          data-testid="nimbus-scan"
          disabled={busy}
          onClick={onScan}
        >
          {busy ? 'Scanning…' : 'Scan markets'}
        </button>
      </div>
      {msg && <div className="tiny">{msg}</div>}
      <div className="grid-2">
        <div className="panel">
          <h2>
            Cities{' '}
            {busy
              ? '· scanning'
              : scan
                ? `· ${scan.cities.length} · ${scan.durationMs}ms`
                : ''}
          </h2>
          <div style={{ overflow: 'auto', maxHeight: '62vh' }}>
            <table className="term">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Obs</th>
                  <th>Ens</th>
                  <th>Heat</th>
                  <th>Edge</th>
                  <th>Signal</th>
                </tr>
              </thead>
              <tbody>
                {(scan?.cities || []).map((c) => (
                  <tr
                    key={c.cityKey}
                    className="clickable"
                    onClick={() => setSel(c)}
                    style={sel?.cityKey === c.cityKey ? { background: '#15202c' } : undefined}
                  >
                    <td>
                      <div>{c.city}</div>
                      <div className="tiny">
                        {c.icao} · {c.eventDate} · {c.obsSource}
                      </div>
                    </td>
                    <td className="mono">
                      {c.observedMax?.toFixed(1) ?? '—'}°{c.unit}
                    </td>
                    <td className="mono">{c.ensembleMax?.toFixed(1) ?? '—'}</td>
                    <td className="mono">
                      {c.remainingHeat?.toFixed(1) ?? '—'}
                      {c.locked ? <span className="ok"> LOCK</span> : null}
                    </td>
                    <td className="mono">{(c.bestEdge * 100).toFixed(1)}¢</td>
                    <td className="tiny">
                      {c.ladder?.reason ||
                        c.buckets.find((b) => b.side)?.reason ||
                        '—'}
                    </td>
                  </tr>
                ))}
                {busy && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Scanning Gamma + weather snaps…
                    </td>
                  </tr>
                )}
                {!busy && !scan && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Run scan — Gamma public-search + weather snaps + engine.
                    </td>
                  </tr>
                )}
                {!busy && scan && scan.cities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No city rows{scan.error ? ` — ${scan.error}` : ' (Gamma returned no matched stations).'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Ticket</h2>
            <div className="panel-body ticket">
              <div className="tiny">
                {sel ? `${sel.city} · ${sel.title}` : 'Select a city'}
              </div>
              {top && (
                <>
                  <div>
                    Bucket <b>{top.label}</b> · model {(top.modelP * 100).toFixed(0)}% · {top.reason}
                  </div>
                  <div className="row">
                    <button className="btn" type="button" onClick={() => setSide('YES')}>
                      YES {(top.yesPrice * 100).toFixed(1)}¢
                    </button>
                    <button className="btn" type="button" onClick={() => setSide('NO')}>
                      NO {(top.noPrice * 100).toFixed(1)}¢
                    </button>
                  </div>
                  <label className="field">
                    Stake USD
                    <input value={usd} onChange={(e) => setUsd(e.target.value)} />
                  </label>
                  <button
                    className="btn btn-primary"
                    type="button"
                    data-testid="nimbus-send"
                    onClick={send}
                    disabled={!s.hasKey}
                  >
                    {s.dryRun || !s.armed ? 'Send paper order' : 'Send / attempt live'}
                  </button>
                </>
              )}
              <div className="stub">
                Live Polymarket CLOB (FAK→GTC, pUSD) is implemented in Node Nimbus
                <code> clob.ts</code>. This browser host can paper-log and read public midpoint; L2 API
                credential derivation is not reliable here. Keep DRY_RUN on.
              </div>
            </div>
          </div>
          {sel && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <h2>Buckets</h2>
              <table className="term">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>YES</th>
                    <th>NO</th>
                    <th>P</th>
                    <th>Side</th>
                  </tr>
                </thead>
                <tbody>
                  {sel.buckets.map((b) => (
                    <tr key={b.label}>
                      <td>{b.label}</td>
                      <td className="mono">{(b.yesPrice * 100).toFixed(1)}</td>
                      <td className="mono">{(b.noPrice * 100).toFixed(1)}</td>
                      <td className="mono">{(b.modelP * 100).toFixed(0)}%</td>
                      <td>
                        {b.side || '—'} {b.lockYes ? 'LOCK' : ''} {b.veto ? 'VETO' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Tape desk="nimbus" />
        </div>
      </div>
    </div>
  )
}
