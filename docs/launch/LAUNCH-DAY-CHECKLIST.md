# $BOTS launch-day checklist (DRAFT · DO NOT LAUNCH YET)

**Hard stop:** Do **not** create the coin, fund a creator buy, or post a CA until the user explicitly says **`launch`**.  
This file is prep only.

**Locked:** Name `StaRK Bots` · Ticker `BOTS` · 1B supply · no custom tax · ≤5 SOL creator buy (one wallet) · open access at launch · later premium ~0.5% = 5M · logo = hexagon official PNG.

---

## Pre-flight (before T0)

- [ ] Fresh **creator wallet** (Phantom or Solflare) — seed written **offline** (paper); never pasted into chat, GitHub, bots, or cloud notes  
- [ ] Wallet funded with **5–10 SOL** (fees + ≤5 SOL creator buy + buffer)  
- [ ] Logo file ready to upload:  
  - Local: `/workspace/demo-capture/launch/BOTS-logo-official.png`  
  - Repo mirror: `docs/launch/BOTS-logo-official.png` (1000×1000 hexagon mark)  
- [ ] Listing **description** copied from `PUMPFUN-LISTING-PACK.md` §2  
- [ ] Socials ready: website `https://starkcrypto.github.io/stark-tools/` · X `https://x.com/StaRKCryptoBots` · GitHub `https://github.com/StaRKCrypto/stark-tools`  
- [ ] X cover optional: `starkbots-cover-1500x500.png`  
- [ ] Tabs open (draft only): pump.fun create · landing editor · GitHub · Dexscreener · X @StaRKCryptoBots · X @_Starkcrypto  
- [ ] User has said **`launch`** — if not, **STOP HERE**

---

## T0 — Create on pump.fun

Only after user says **launch**:

| Field | Value |
|-------|--------|
| Name | `StaRK Bots` |
| Ticker / symbol | `BOTS` |
| Image | `BOTS-logo-official.png` (hexagon) |
| Description | Paste from listing pack |
| Website | `https://starkcrypto.github.io/stark-tools/` |
| Twitter/X | `https://x.com/StaRKCryptoBots` |
| GitHub | `https://github.com/StaRKCrypto/stark-tools` |

- [ ] Connect **creator** wallet only  
- [ ] Fill fields exactly as above  
- [ ] Create coin  
- [ ] Copy **mint CA** immediately to a local note (not a public reply yet)

---

## Creator buy (same wallet)

- [ ] Buy **≤ 5 SOL** from the **same** creator wallet (or 0 if choosing clean Plan 1)  
- [ ] **No** second wallet / bundle / multi-buy theater  
- [ ] Disclose creator buy size in the launch post

---

## Same-hour CA blast (one CA everywhere)

Paste the **same** CA in main text / fields — never CA-only in a random reply:

- [ ] **Landing** CA box — `starkcrypto.github.io/stark-tools`  
- [ ] **GitHub** hub `README.md` + `LANDING.md` + `docs/launch/*` CA placeholders  
- [ ] Major teaser READMEs “Token CA” lines (as applicable)  
- [ ] **Dexscreener** socials (website + X + GitHub) when listing appears  
- [ ] **Pin reply** on @StaRKCryptoBots pin thread (CA in reply body)  
- [ ] **@_Starkcrypto** shout / pointer post with CA in main text  
- [ ] **@StaRKCryptoBots** launch post (use draft in `SOLANA-LAUNCH-PLAN.md` §7)

---

## Explicit stop conditions

- [ ] **STOP** if user has **not** said `launch`  
- [ ] **STOP** if creator seed was ever pasted into an agent/chat  
- [ ] **STOP** if tempted to multi-wallet sniping  
- [ ] **STOP** if logo file is wrong (must be hexagon official PNG, not old cyan wordmark)

---

*Checklist only. No on-chain action until user says launch.*

## Post-create fees (same hour)

- [ ] Confirm coin admin fee recipient = **100% creator/admin wallet**
- [ ] Do **not** add GitHub org as fee recipient
- [ ] GitHub repo stays in description / landing (trust), not as fee sink
- [ ] Optional later: split to cold admin pubkey via fee share (bps sum 10000)
