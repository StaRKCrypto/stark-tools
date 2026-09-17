**Landing page:** https://starkcrypto.github.io/stark-tools/  
**X:** https://x.com/StaRKCryptoBots  
**Pin:** https://x.com/StaRKCryptoBots/status/2100370890215043249

# stark-tools — Public Teaser Packs

**StaRK Bots** · X [@starkcryptollc](https://x.com/starkcryptollc) · Personal [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Hold to access.** Hosted tools require holding **~0.5%** of the official coin  
> (`YOUR_TOKEN_CA_HERE` — contract address added after launch).  
> This public org/user = **authenticity samples + docs teasers**.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## What this is

A clean public layout of **small illustrative sample packs** for the StaRKCrypto /
StaRK Bots coin launch. Each folder (or sibling repo) is a teaser under
[StaRKCrypto](https://github.com/StaRKCrypto). Nothing here is a production trading brain.

## Sample packs (separate repos)

### Core desk / UX

| Repo | What you get here | Deliberately omitted |
|---|---|---|
| [`stark-portfolio`](https://github.com/StaRKCrypto/stark-portfolio) | Fake portfolio UI stub + hardcoded demo stats | Live wallets, exchange sync, PnL engines |
| [`bound`](https://github.com/StaRKCrypto/bound) | Due-diligence checklist UI stub | Live APIs, scoring backends, scrape pipelines |
| [`sr-bot`](https://github.com/StaRKCrypto/sr-bot) | Synthetic OHLCV + simple swing S/R demo | SMC, fibs, live charts, exchange keys, auto-trade |
| [`sr-terminal`](https://github.com/StaRKCrypto/sr-terminal) | Paper desk docs / mock screenshots | Live order routing, venue connectors |
| [`weather-bot`](https://github.com/StaRKCrypto/weather-bot) | Docs teaser + fake forecast sample | Polymarket keys, live market loops |
| [`farmer`](https://github.com/StaRKCrypto/farmer) | Strategy **notes** only | Live farm loop, signing, execution |

### Venue / trading bots (new teasers)

| Repo | What you get here | Deliberately omitted |
|---|---|---|
| [`nado-bot`](https://github.com/StaRKCrypto/nado-bot) | Fake Nado book snapshot + farm/MM notes; MCP mentioned conceptually | Live farm loop, MCP keys, signing |
| [`lighter-bot`](https://github.com/StaRKCrypto/lighter-bot) | Synthetic RH Lighter quotes + desk docs | Live keys (explicitly private), full MM/S/R loop |
| [`arcus-sr`](https://github.com/StaRKCrypto/arcus-sr) | Paper S/R zone detector on synthetic candles | Live Arcus send, env keys, full `sr_loop` |
| [`mint-scout`](https://github.com/StaRKCrypto/mint-scout) | Fake mint candidate JSON + watchlist example | Live scout/snipe, wallets, API keys |
| [`rh-fcfs-sniper`](https://github.com/StaRKCrypto/rh-fcfs-sniper) | FCFS latency notes + fake alert sample | Session cookies, blast/pre-sign code |
| [`monk-pair`](https://github.com/StaRKCrypto/monk-pair) | Synthetic BTC/ETH RS signal demo | Live pair loop, venue keys |
| [`take-profits`](https://github.com/StaRKCrypto/take-profits) | Fake bag tracker JSON / ASCII stub | Wallet keys, live sell routers |
| [`nimbus-desk`](https://github.com/StaRKCrypto/nimbus-desk) | Nimbus rebuild landing stub + fake city board | Full weather desk UI/engine, wallet vault |

Local layout for bot teasers: [`bots/`](./bots/).

## Access model

```
Public GitHub  →  authenticity + teaser samples
Hosted tools   →  hold ~0.5% of official coin (CA after launch)
```

Token CA placeholder: **`YOUR_TOKEN_CA_HERE`**

## Safety

- No `.env`, wallets, keys, or pem files in this tree
- Run [`STEP0-SECRET-CHECKLIST.md`](./STEP0-SECRET-CHECKLIST.md) before every publish
- Samples hint at capability; they do not ship full product logic

## License

MIT — see [`LICENSE`](./LICENSE). Teaser code only; hosted product terms apply separately.

## Links

- Landing copy: [`LANDING.md`](./LANDING.md)
- X org: [x.com/starkcryptollc](https://x.com/starkcryptollc)
- Personal: [x.com/_Starkcrypto](https://x.com/_Starkcrypto)
