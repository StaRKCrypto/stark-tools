# StaRK Ops Companion

Operator companion for Nimbus, Mint, Arcus, Lighter, and Nado.
**Trading UI is the real venue website.** This app does not clone charts or
order books. Do not tweet it. Run locally with a **burner** wallet.

## Run locally

```bash
cd live-terminal
npm i
npm run dev
```

Open http://localhost:5173

```bash
npm test
npm run build
```

Requires Node 18+. Vite proxies Gamma, Arcus, Lighter, Nado, Open-Meteo,
aviationweather, and Synoptic.

## What this is

| Layer | Where it lives |
|---|---|
| Trade / mint / CLOB UI | [app.lighter.xyz](https://app.lighter.xyz), [app.arcus.xyz](https://app.arcus.xyz), [app.nado.xyz/perpetuals](https://app.nado.xyz/perpetuals), [OpenSea](https://opensea.io/drops), [Polymarket](https://polymarket.com) |
| Our edge | S/R from live Arcus candles, Nimbus Kelly scan, SeaDrop probe/snipe, farm notes |
| Live ops strip | Public marks / OI / funding from venue APIs + **redacted journal snaps** you import |
| Activity tape | Local paper intents and scan logs |

Venues send `X-Frame-Options: DENY`. The companion deep-links them; it does not
fake an embedded exchange.

## Journal snaps

Paste or import JSON on the Ops board. Missing fields stay `—`. Example shape:

```json
{
  "venue": "nado",
  "at": "2026-09-18T22:00:00Z",
  "equityUsd": 0,
  "availableUsd": 0,
  "opens": [],
  "fills": []
}
```

Also accepts `desk`, `positions`, `equity`. Hex keys in the blob are redacted.

## How keys work

| Item | Detail |
|---|---|
| Storage | Browser `localStorage` `stark.live.vault.v1` |
| Arm flag | `sessionStorage` `stark.live.armed.v1` (refresh disarms) |
| DRY_RUN | `localStorage` `stark.live.dryrun.v1` (**default ON**) |
| Snaps | `localStorage` `stark.live.snaps.v1` |

1. Open **Vault**. Paste a **burner** EVM key (never a main bag).
2. Leave **DRY_RUN** checked.
3. **Arm** is required before any live path.

Nimbus live CLOB still needs the Node desk. Arcus/Lighter/Nado live sends stay
on the venue (or private signers), not this host.

## Security

- DRY_RUN / disarmed defaults
- Burner banner on every page
- No `.env` with real keys in this tree
- Do **not** publish an announcement CTA for this companion
