# StaRK Live Terminal

Operator website for the real desks (Nimbus, Mint Sniper, Arcus, Lighter, Nado).
This is **not** a public announcement surface. Do not tweet it. Do not add a
marketing CTA. Run it locally with a **burner** wallet.

## Run locally

```bash
cd live-terminal
npm i
npm run dev
```

Open http://localhost:5173

```bash
npm test          # engine / SeaDrop / S/R unit tests
npm run build     # production bundle
npm run preview   # serve the bundle
```

Requires Node 18+. The Vite dev server proxies Gamma, Arcus, Lighter, Nado,
Open-Meteo, aviationweather, and Synoptic so browser CORS does not block scans.

## How keys work

| Item | Detail |
|------|--------|
| Storage | Browser `localStorage` key `stark.live.vault.v1` |
| Arm flag | `sessionStorage` `stark.live.armed.v1` (refresh disarms) |
| DRY_RUN | `localStorage` `stark.live.dryrun.v1` (**default ON**) |
| Server | None. Keys never leave the browser as stored server state |
| Logs | Full keys are redacted (`0xabcd…1234`) |

1. Open **Vault**. Paste a **burner** EVM private key (never a main bag).
2. Confirm the derived address. Optionally refresh ETH / Polygon / Base balances via publicnode.
3. Leave **DRY_RUN** checked.
4. **Arm** is required before any live path. With DRY_RUN on, Arm still only allows paper / eth_call.

## Desks

### Nimbus (Polymarket weather)
Ported from Nimbus: `engine.ts`, `buckets.ts`, `stations.ts`, `autopilot.ts`, Gamma discovery, Open-Meteo ensembles, METAR/Synoptic snaps.

- **Scan** hits `gamma-api.polymarket.com` public-search for “highest temperature in”.
- Scoring is the real Kelly / veto / lock-YES / ladder logic (hard cap $100).
- **Paper orders** write to the local activity tape.
- **Live CLOB** (FAK→GTC via `@polymarket/client`) is **not reliable in the browser** (L2 API creds + CORS). The ticket states this and will not pretend a fill. Use the Node Nimbus desk with `DRY_RUN=0` when you want real CLOB posts.

### Mint Sniper (SeaDrop)
Ported from mint-scout: `getPublicDrop`, `mintPublic` encoding, rug score, SeaDropMint log discovery on public RPCs.

- Discover / probe **never** send transactions.
- Snipe refuses `mintPrice > 0`.
- DRY_RUN: `eth_call` only.
- LIVE + Arm: browser-signed `eth_sendRawTransaction` on the selected public RPC.
- OpenSea `/drops` listing needs `OPENSEA_API_KEY` and is omitted here (CORS + no secrets in repo). Paste contracts instead.
- Robinhood Chain 4663 has no CORS-safe public RPC in this build — use ETH/Base.

### Arcus
Live `https://api.arcus.xyz` markets, BBO, 15m candles. Swing / ATR / bias ported from `sr_loop.py`.

- **Order ticket is a stub** for live sends. Arcus uses Ed25519 Scheme 1 (`ARCUS_API_PRIVATE_KEY`), not the EVM vault key.

### Lighter
Live `https://mainnet.zklighter.elliot.ai` `orderBooks` + `exchangeStats`.

- Execution stub. Do not commit `lighter-*.env`.

### Nado
Queries the documented gateway `https://api.prod.nado.xyz/gateway/v1/query`. Some networks get Cloudflare 403 — the UI shows that instead of a fake book. Farm notes (QQQ-PERP 98, WTI 90) come from the Nado source. `/execute` is stubbed.

## Security

- DRY_RUN / disarmed defaults.
- Burner banner on every page.
- No `.env` with real keys in this tree.
- Do **not** publish an announcement or apps-index CTA for this terminal.

## Layout

```
live-terminal/
  src/lib/nimbus/     real weather engine + scan
  src/lib/mint/       SeaDrop scout / snipe
  src/lib/venues/     Arcus / Lighter / Nado public clients + S/R
  src/lib/vault.ts    client-side key vault
  src/pages/          desks
```
