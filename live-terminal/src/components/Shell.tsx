import { useEffect } from 'react'
import { useSession } from '../lib/session'
import { isArmed, isDryRun, setArmed, setDryRun } from '../lib/vault'
import { VaultDrawer } from './VaultDrawer'

export function Shell({ children }: { children: React.ReactNode }) {
  const s = useSession()

  useEffect(() => {
    s.refresh()
  }, [])

  return (
    <div className="stage">
      <header className="topbar">
        <span className={`pill ${s.dryRun ? 'pill-ok' : 'pill-bad'}`}>
          {s.dryRun ? 'DRY_RUN' : 'LIVE MODE'}
        </span>
        <span className={`pill ${s.armed ? 'pill-warn' : 'pill-info'}`}>
          {s.armed ? 'ARMED' : 'DISARMED'}
        </span>
        <span className="addr">
          {s.address ? s.address : 'no vault'}
        </span>
        <span className="spacer" />
        <label className="chk">
          <input
            type="checkbox"
            checked={s.dryRun}
            onChange={(e) => {
              setDryRun(e.target.checked)
              useSession.getState().refresh()
            }}
          />
          DRY_RUN
        </label>
        <button
          className="btn btn-arm"
          type="button"
          onClick={() => {
            if (s.armed) {
              setArmed(false)
              useSession.getState().refresh()
              return
            }
            if (!s.hasKey) {
              useSession.getState().setVaultOpen(true)
              return
            }
            if (isDryRun()) {
              setArmed(true)
              useSession.getState().refresh()
              return
            }
            const ok = window.confirm(
              'Arm LIVE execution?\n\nBurner wallet only. This can send real transactions when DRY_RUN is off.\nNimbus CLOB still requires Node. Mint SeaDrop can broadcast from the browser.',
            )
            if (ok) {
              setArmed(true)
              useSession.getState().refresh()
            }
          }}
        >
          {isArmed() ? 'Disarm' : 'Arm'}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => useSession.getState().setVaultOpen(true)}
        >
          Vault
        </button>
      </header>
      <p className="banner">
        <strong>Burner keys only.</strong> We cannot recover keys. Keys live in
        localStorage on this device — never committed, never logged in full.
        Clear vault when done. NFA. Not an announcement.
      </p>
      {children}
      {s.vaultOpen && <VaultDrawer />}
    </div>
  )
}
