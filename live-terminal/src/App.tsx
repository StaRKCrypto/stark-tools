import { Route, Routes } from 'react-router-dom'
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
