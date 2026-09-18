import { useState } from 'react'
import { CHAINS } from '../lib/mint/chains'
import { discoverRecentSeaDropMints } from '../lib/mint/discover'
import { scoreCandidate, type ScoredMint } from '../lib/mint/rug'
import { probeContract, runSnipe, saveArmedTarget } from '../lib/mint/snipe'
import { Tape } from '../components/Tape'
import { safeError } from '../lib/redact'
import { useSession } from '../lib/session'
import { pushTape } from '../lib/activity'

export function MintSniper() {
  const s = useSession()
  const [chain, setChain] = useState(CHAINS[0]?.name || 'ethereum')
  const [contract, setContract] = useState('')
  const [slug, setSlug] = useState('')
  const [qty, setQty] = useState('1')
  const [probe, setProbe] = useState<string | null>(null)
  const [hits, setHits] = useState<ScoredMint[]>([])
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState<string[]>([])

  async function onProbe() {
    setBusy(true)
    setProbe(null)
    try {
      const r = await probeContract(chain, contract.trim())
      const f = r.formatted
      setProbe(
        `${r.chain.displayName} mintPrice=${f.mintPriceEth} start=${f.startIso} end=${f.endIso} max/wallet=${f.maxTotalMintableByWallet} free=${f.free} open=${f.open}`,
      )
      const scored = await scoreCandidate({
        contract: contract.trim(),
        chain: r.chain,
        slug,
        source: 'probe',
      })
      setHits((prev) => [scored, ...prev.filter((h) => h.contract !== scored.contract)])
    } catch (e) {
      setProbe(safeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function onDiscover() {
    setBusy(true)
    try {
      const c = CHAINS.find((x) => x.name === chain)!
      const d = await discoverRecentSeaDropMints(c)
      setNotes(d.notes)
      const scored: ScoredMint[] = []
      for (const addr of d.contracts.slice(0, 12)) {
        try {
          scored.push(
            await scoreCandidate({ contract: addr, chain: c, source: 'seadrop-logs' }),
          )
        } catch (e) {
          scored.push({
            slug: null,
            name: addr,
            contract: addr,
            chain: c.name,
            chainId: c.chainId,
            source: 'seadrop-logs',
            score: 0,
            fail: true,
            pass: false,
            flags: ['error'],
            reasons: [safeError(e)],
            drop: null,
          })
        }
      }
      setHits(scored)
      pushTape('mint', 'scan', `Discover ${c.name}: ${d.contracts.length} contracts`, undefined, true)
    } catch (e) {
      setNotes([safeError(e)])
    } finally {
      setBusy(false)
    }
  }

  function armTarget(row?: ScoredMint) {
    const nft = row?.contract || contract.trim()
    const ch = row?.chain || chain
    if (!nft) return
    saveArmedTarget({
      chain: ch,
      nftContract: nft,
      slug: slug || row?.slug || nft,
      quantity: Number(qty) || 1,
    })
    setContract(nft)
    setChain(ch)
    pushTape('mint', 'arm', `Armed ${ch} ${nft.slice(0, 10)}… (session)`, undefined, true)
  }

  async function snipe() {
    setBusy(true)
    try {
      armTarget()
      const r = await runSnipe()
      setProbe(JSON.stringify(r, null, 2).slice(0, 800))
    } catch (e) {
      setProbe(safeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Mint Sniper · SeaDrop</h1>
          <p>
            Scout/discover never send txs. Snipe refuses mintPrice &gt; 0. OpenSea /drops needs an API key
            (not stored here) — use watchlist paste + SeaDropMint logs.
          </p>
        </div>
        <div className="row">
          <button className="btn" type="button" disabled={busy} onClick={onDiscover}>
            Discover recent mints
          </button>
          <button className="btn btn-primary" type="button" disabled={busy} onClick={onProbe}>
            Probe publicDrop
          </button>
        </div>
      </div>
      <div className="grid-2">
        <div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Target</h2>
            <div className="panel-body">
              <label className="field">
                Chain
                <select value={chain} onChange={(e) => setChain(e.target.value)}>
                  {CHAINS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.displayName} ({c.chainId})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                NFT contract
                <input
                  value={contract}
                  onChange={(e) => setContract(e.target.value)}
                  placeholder="0x…"
                />
              </label>
              <label className="field">
                Slug (arm label)
                <input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </label>
              <label className="field">
                Quantity
                <input value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <div className="row">
                <button className="btn btn-arm" type="button" onClick={() => armTarget()}>
                  Arm this contract
                </button>
                <button className="btn btn-danger" type="button" disabled={busy || !s.hasKey} onClick={snipe}>
                  {s.dryRun ? 'Snipe DRY_RUN (eth_call)' : 'Snipe LIVE'}
                </button>
              </div>
              {probe && <pre className="tiny" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{probe}</pre>}
              {notes.map((n) => (
                <div key={n} className="tiny">
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>Candidates</h2>
            <table className="term">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Score</th>
                  <th>Flags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hits.map((h) => (
                  <tr key={h.chain + h.contract}>
                    <td className="mono">
                      {h.contract.slice(0, 10)}…
                      <div className="tiny">
                        {h.chain} · {h.source} · {h.drop?.free ? 'FREE' : ''} {h.drop?.open ? 'OPEN' : ''}
                      </div>
                    </td>
                    <td className={h.pass ? 'ok' : h.fail ? 'bad' : ''}>{h.score}</td>
                    <td className="tiny">{h.flags.join(', ')}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => armTarget(h)}>
                        Arm
                      </button>
                    </td>
                  </tr>
                ))}
                {hits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Paste a contract or run discover on ETH/Base public RPCs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Tape desk="mint" />
      </div>
    </div>
  )
}
