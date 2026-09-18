import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSession } from '../lib/session'
import { isArmed, isDryRun, setArmed, setDryRun } from '../lib/vault'
import { VaultDrawer } from './VaultDrawer'
import { TrustStrip } from './TrustStrip'

export function Shell({ children }: { children: React.ReactNode }) {
  const s = useSession()

  useEffect(() => {
    s.refresh()
  }, [])

  return (
    <div className="stage">
      <header className="topbar">
        <NavLink to="/" className="brand">
          StaRK <span>OPS</span>
        </NavLink>
        <nav className="tabs">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Board
          </NavLink>
          <NavLink to="/nimbus" className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Nimbus
          </NavLink>
          <NavLink to="/mint" className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Mint
          </NavLink>
          <NavLink to="/arcus" className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Arcus
          </NavLink>
          <NavLink to="/lighter" className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Lighter
          </NavLink>
          <NavLink to="/nado" className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            Nado
          </NavLink>
        </nav>
        <span className={`pill ${s.dryRun ? 'pill-ok' : 'pill-bad'}`}>
          {s.dryRun ? 'DRY_RUN' : 'LIVE'}
        </span>
        <span className={`pill ${s.armed ? 'pill-warn' : 'pill-info'}`}>
          {s.armed ? 'ARMED' : 'DISARMED'}
        </span>
        <span className="addr">{s.address || 'no vault'}</span>
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
          className="btn"
          type="button"
          onClick={() => useSession.getState().setVaultOpen(true)}
        >
          Vault
        </button>
      </header>
      <p className="banner">
        Burner keys only. Keys stay in this browser. Clear vault when done. NFA. Not an announcement.
      </p>
      <TrustStrip />
      {children}
      {s.vaultOpen && <VaultDrawer />}
    </div>
  )
}
