# TRUST PROOF — StaRK Crypto Bots (private preview)

**Status:** Unlisted · `noindex` · **Do NOT announce on X**  
**Built:** 2026-09-19 ~04:23 IST (Asia/Calcutta)  
**Intent:** Prove StaRK bots are real/working using REAL venue UIs + REAL journals — not HTML paper desks.

## Preview URLs

| Asset | URL / path |
|---|---|
| **Trust page (GitHub Pages)** | https://starkcrypto.github.io/stark-tools/trust/ |
| **Local docs path** | `/workspace/stark-tools-public/docs/trust/` |
| **Product film** | `/workspace/demo-capture/live-product-film/TRUST-PROOF.mp4` |
| **Chat GIF preview** | `/workspace/demo-capture/live-product-film/TRUST-PROOF-preview.gif` |
| **Full GIF** | `/workspace/demo-capture/live-product-film/TRUST-PROOF.gif` |
| **Film on Pages** | https://starkcrypto.github.io/stark-tools/trust/media/TRUST-PROOF.mp4 |

Trust page is **not** linked from the public landing marketing CTA. `robots: noindex`.

## Exact stats burned into the film

### Cold open
- **Arcus LIVE** equity ≈ **$80.2** (snap 2026-09-19 04:18 IST)
- Opens: **MU LONG · TSLA SHORT · MSFT SHORT · DRAM LONG · SPCX SHORT**
- **Lighter RH** equity ≈ **$66** (journal equity_delta $66.71 at ASTS TP)
- **Nado MSI** equity **$23.71** · WTI-PERP · **RUNNING** (`farm_status_live.json`)
- QQQ farm log: **14 cycles · eq 5.95→5.78 · dd −2.8794%**

### Arcus lower-thirds / journal card
- Source: `overnight/arcus-trades.jsonl` + live snap txt
- **127** journal events · **24** symbols · 35 opens · 34 closes · 11 scale_ins · 47 sync_opens
- **Honest tape:** W**7** / L**22** · WR **24.14%** · realized PnL **−$10.50** (no invented fills)
- LIVE opens (snap): MU / TSLA / MSFT / DRAM / SPCX

### Lighter lower-thirds
- Venue: `app.lighter.xyz` live capture + ui-ref
- Equity ≈ **$66** · journal symbols **MSFT · ASTS** (`overnight/bot-trades.jsonl`)

### Nado lower-thirds
- Venue: `app.nado.xyz/perpetuals` live capture
- MSI dashboard PNG + `farm_status_live.json`: eq **$23.71** · WTI · RUNNING
- QQQ `farm_qqq.log`: 14 cycles · 5.95→5.78 · dd −2.8794%

### End card
- **Working desks · Journals · 24/7 · CA soon**

## Film construction

- **Duration:** ~81s · 1080p H.264 + AAC factual VO (`edge-tts` Eric)
- **Priority face:** REAL venue websites + MSI/live snaps (not HTML autodemo desks)
- **Inputs:**
  - Venue B-roll: `broll/lighter-venue-live.mp4`, `broll/nado-venue-live.mp4`, `broll/*-venue-snap.png`
  - UI refs: `ui-refs/{arcus-app,lighter-trade,lighter-markets,nado-perps}.png`
  - MSI: `nado/msi/nado_desk_live_dashboard.png`, `farm_status_live.json`
  - Live snap: `trust-snaps/arcus-2026-09-19-0418IST.txt`, `nado-live-dashboard.png`
  - Journals: arcus / overnight / farm_qqq.log
- **No** purple AI title-card slop · **No** invented PnL

## Deploy

- Tree: `stark-tools-public/docs/trust/` → gh-pages path `/trust/`
- Repo: https://github.com/StaRKCrypto/stark-tools
- **Not tweeted**
