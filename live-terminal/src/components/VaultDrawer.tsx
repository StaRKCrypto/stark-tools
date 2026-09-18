import { useState } from 'react'
import {
  clearVault,
  fetchNativeBalances,
  saveVault,
  setArmed,
  type SignatureType,
} from '../lib/vault'
import { useSession } from '../lib/session'
import { pushTape } from '../lib/activity'
import { safeError } from '../lib/redact'

export function VaultDrawer() {
  const s = useSession()
  const [pk, setPk] = useState('')
  const [funder, setFunder] = useState(s.funderAddress || '')
  const [sig, setSig] = useState<SignatureType>(s.signatureType)
  const [err, setErr] = useState<string | null>(null)
  const [bals, setBals] = useState<Record<string, { eth: string; error?: string }>>({})
  const [busy, setBusy] = useState(false)

  async function onSave() {
    setErr(null)
    try {
      const v = saveVault({ privateKey: pk, funderAddress: funder, signatureType: sig })
      setPk('')
      pushTape('vault', 'vault', `Saved burner ${v.savedAt}`, undefined, true)
      useSession.getState().refresh()
    } catch (e) {
      setErr(safeError(e))
    }
  }

  async function onBalances() {
    if (!s.address) return
    setBusy(true)
    try {
      setBals(await fetchNativeBalances(s.address))
    } catch (e) {
      setErr(safeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="drawer-bg" onClick={() => useSession.getState().setVaultOpen(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="page-h">
          <div>
            <h1>Key vault</h1>
            <p>Browser localStorage only. Burner EOA. Polygon/ETH compatible hex key.</p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => useSession.getState().setVaultOpen(false)}>
            Close
          </button>
        </div>

        {s.address && (
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Loaded</h2>
            <div className="panel-body">
              <div className="mono">{s.address}</div>
              <div className="tiny">masked key {s.maskedKey}</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" type="button" disabled={busy} onClick={onBalances}>
                  Refresh balances
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => {
                    clearVault()
                    setArmed(false)
                    setBals({})
                    pushTape('vault', 'vault', 'Vault cleared', undefined, true)
                    useSession.getState().refresh()
                  }}
                >
                  Clear vault
                </button>
              </div>
              {Object.keys(bals).length > 0 && (
                <table className="term" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Chain</th>
                      <th>Native</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bals).map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td className="mono">
                          {v.eth}
                          {v.error ? <span className="tiny"> {v.error}</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        <label className="field">
          Private key (burner)
          <textarea
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          Polymarket funder / proxy (optional)
          <input value={funder} onChange={(e) => setFunder(e.target.value)} placeholder="0x…" />
        </label>
        <label className="field">
          Signature type
          <select value={sig} onChange={(e) => setSig(Number(e.target.value) as SignatureType)}>
            <option value={0}>0 — EOA / MetaMask</option>
            <option value={1}>1 — Email / Magic (Polymarket default)</option>
            <option value={2}>2 — Gnosis / proxy</option>
          </select>
        </label>
        {err && <div className="bad">{err}</div>}
        <button className="btn btn-primary" type="button" onClick={onSave}>
          Save to this browser
        </button>
        <p className="tiny" style={{ marginTop: 14 }}>
          Never paste a main-bag key. Refreshing the tab keeps the key (localStorage) but
          disarms live mode (sessionStorage).
        </p>
      </div>
    </div>
  )
}
