# nado-bot — Nado Venue Farm / MM Teaser

**StaRK Bots** · [@starkcryptollc](https://x.com/starkcryptollc) · [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Hold to access.** Hosted tools require holding **~0.5%** of the official coin  
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## What this sample is

Illustrative **Nado venue** farm / market-making teaser: a **fake order-book snapshot**
demo plus high-level strategy notes. Mentions Nado MCP conceptually as a remote
tool surface — **no API keys, no MCP env, no live signing**.

## Quick demo

```bash
python3 demo/fake_book_snapshot.py
```

## Files

| Path | Role |
|---|---|
| [`demo/fake_book_snapshot.py`](./demo/fake_book_snapshot.py) | Synthetic bid/ask book + toy inventory note |
| [`notes/STRATEGY.md`](./notes/STRATEGY.md) | High-level farm/MM thinking (paper) |

## Deliberately omitted

- Live farm / MM loops and venue connectors
- Nado MCP credentials / `mcp.env`
- Wallet signing, private keys, real market IDs with live equity
- Inventory skew engines and execution code

## CTA

Hold ~0.5% of `YOUR_TOKEN_CA_HERE` (after launch) for hosted **Nado** farm/MM tooling.
