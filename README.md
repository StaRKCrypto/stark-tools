**Website:** https://stark-bot.com  
**Landing page:** https://starkcrypto.github.io/stark-tools/  
**Try apps (paper):** https://starkcrypto.github.io/stark-tools/apps/  
**Live Studio (client keys stay in browser):** https://starkcrypto.github.io/stark-tools/live-studio/  
**X:** https://x.com/StaRKCryptoBots  
**YouTube:** https://www.youtube.com/@starksystems-y2r  
**Pin:** https://x.com/StaRKCryptoBots/status/2100370890215043249

# stark-tools — Public Teaser Packs

**StaRK Bots** · Website [stark-bot.com](https://stark-bot.com) · Brand X [@StaRKCryptoBots](https://x.com/StaRKCryptoBots) · Personal [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Open at launch.** Desks are free to try. Later premium tools may need **~0.5%** hold of the official coin  
> (`YOUR_TOKEN_CA_HERE` — contract address added after launch).  
> This public org/user = **authenticity samples + docs teasers**.  
> Later premium may be gated. Source samples are **NOT** the full product.  
> **No secrets in this repo** — no live keys, wallets, or `.env` values.

---

## What this is

A clean public layout of **illustrative sample packs** for StaRK Bots. Each folder (or sibling repo) is a teaser under
[StaRKCrypto](https://github.com/StaRKCrypto). Nothing here is a production trading brain.

## Hosted paper apps (GitHub Pages)

| App | URL |
|---|---|
| Apps index (5-min paper trial) | https://starkcrypto.github.io/stark-tools/apps/ |
| Arcus · Lighter · Nado · Mint · Nimbus · Take-Profits · Bound · Portfolio · Monk | under `/apps/<name>/` |
| Live Studio (Mint / Nimbus / vault UI) | https://starkcrypto.github.io/stark-tools/live-studio/ |

Live Terminal source lives in [`live-terminal/`](./live-terminal/) for inspection — **preview / client-side only**; keys never leave the browser. Not a public product announce.

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

### Venue / trading bots

| Repo | What you get here | Deliberately omitted |
|---|---|---|
| [`nado-bot`](https://github.com/StaRKCrypto/nado-bot) | Fake Nado book snapshot + farm/MM notes | Live farm loop, MCP keys, signing |
| [`lighter-bot`](https://github.com/StaRKCrypto/lighter-bot) | Synthetic RH Lighter quotes + desk docs | Live keys, full MM/S/R loop |
| [`arcus-sr`](https://github.com/StaRKCrypto/arcus-sr) | Paper S/R zone detector on synthetic candles | Live Arcus send, env keys, full `sr_loop` |
| [`mint-scout`](https://github.com/StaRKCrypto/mint-scout) | Fake mint candidate JSON + watchlist example | Live scout/snipe, wallets, API keys |
| [`rh-fcfs-sniper`](https://github.com/StaRKCrypto/rh-fcfs-sniper) | FCFS latency notes + fake alert sample | Session cookies, blast/pre-sign code |
| [`monk-pair`](https://github.com/StaRKCrypto/monk-pair) | Synthetic BTC/ETH RS signal demo | Live pair loop, venue keys |
| [`take-profits`](https://github.com/StaRKCrypto/take-profits) | Fake bag tracker JSON / ASCII stub | Wallet keys, live sell routers |
| [`nimbus-desk`](https://github.com/StaRKCrypto/nimbus-desk) | Nimbus landing stub + fake city board | Full weather desk engine, wallet vault |

Local layout for bot teasers: [`bots/`](./bots/).

## Access model

```
Public GitHub  →  authenticity + teaser samples
Desks at launch →  open to everyone (no hold wall)
Later premium  →  may need ~0.5% hold (~5M $BOTS; CA after launch)
```

Token CA placeholder: **`YOUR_TOKEN_CA_HERE`**

## Safety

- No `.env`, wallets, keys, or pem files in this tree
- Run [`STEP0-SECRET-CHECKLIST.md`](./STEP0-SECRET-CHECKLIST.md) before every publish
- Samples hint at capability; they do not ship full product logic
- Never commit MSI deploy scripts, live loops, or journal dumps

## License

MIT — see [`LICENSE`](./LICENSE). Teaser code only; hosted product terms apply separately.

## Links

- Landing: https://starkcrypto.github.io/stark-tools/
- Apps: https://starkcrypto.github.io/stark-tools/apps/
- Live Studio: https://starkcrypto.github.io/stark-tools/live-studio/
- About: [`docs/ABOUT-STARK-BOTS.md`](./docs/ABOUT-STARK-BOTS.md)
- Brand X: https://x.com/StaRKCryptoBots
- Personal: https://x.com/_Starkcrypto
