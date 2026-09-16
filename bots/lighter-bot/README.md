# lighter-bot — Lighter (RH) MM / S/R Desk Teaser

**StaRK Bots** · [@starkcryptollc](https://x.com/starkcryptollc) · [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Hold to access.** Hosted tools require holding **~0.5%** of the official coin  
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## What this sample is

Teaser for a **Robinhood Lighter (RH)** market-making / support-resistance desk:
**synthetic quotes** demo + operator docs.  

**Explicit:** live API keys, signer material, and venue env files stay **private**.
This tree never includes `lighter-*.env` or wallets.

## Quick demo

```bash
python3 demo/synthetic_quotes.py
```

## Files

| Path | Role |
|---|---|
| [`demo/synthetic_quotes.py`](./demo/synthetic_quotes.py) | Fake bid/ask ladder around a synthetic mid |
| [`notes/DESK.md`](./notes/DESK.md) | Desk posture notes (docs only) |

## Deliberately omitted

- Live RH / Lighter connectors and signing
- Any `*.env` with keys (live keys private)
- Full S/R loop / farm loop product brains
- Wallet dumps

## CTA

Hold ~0.5% of `YOUR_TOKEN_CA_HERE` (after launch) for hosted **Lighter RH** desk tools.
