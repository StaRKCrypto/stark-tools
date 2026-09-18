import { NavLink, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Hub } from './pages/Hub'
import { Nimbus } from './pages/Nimbus'
import { MintSniper } from './pages/MintSniper'
import { Arcus } from './pages/Arcus'
import { Lighter } from './pages/Lighter'
import { Nado } from './pages/Nado'

export default function App() {
  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          StaRK <span>LIVE</span>
        </div>
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Terminal</span>
          <span className="s">Hub</span>
        </NavLink>
        <NavLink to="/nimbus" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Nimbus</span>
          <span className="s">Polymarket weather</span>
        </NavLink>
        <NavLink to="/mint" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Mint Sniper</span>
          <span className="s">SeaDrop free public</span>
        </NavLink>
        <NavLink to="/arcus" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Arcus</span>
          <span className="s">S/R + BBO</span>
        </NavLink>
        <NavLink to="/lighter" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Lighter</span>
          <span className="s">RH public books</span>
        </NavLink>
        <NavLink to="/nado" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="k">Nado</span>
          <span className="s">Farm / MM notes</span>
        </NavLink>
        <div className="rail-foot">
          Burner keys only. DRY_RUN default ON.
          Keys stay in this browser. Do not announce this desk.
        </div>
      </aside>
      <Shell>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/nimbus" element={<Nimbus />} />
          <Route path="/mint" element={<MintSniper />} />
          <Route path="/arcus" element={<Arcus />} />
          <Route path="/lighter" element={<Lighter />} />
          <Route path="/nado" element={<Nado />} />
        </Routes>
      </Shell>
    </div>
  )
}
