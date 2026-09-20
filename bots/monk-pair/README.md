# monk-pair — Monk BTC/ETH Relative-Strength Pair Teaser

**StaRK Bots** · [@starkcryptollc](https://x.com/starkcryptollc) · [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Open at launch.** Desks are free to try. Later premium tools may need **~0.5%** hold of the official coin  
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## What this sample is

**Synthetic signal demo** for a BTC/ETH relative-strength pair story. Uses
public-style math on fake series — no venue keys, no live `sendTx`.

## Quick demo

```bash
python3 demo/synthetic_signal.py
```

## Files

| Path | Role |
|---|---|
| [`demo/synthetic_signal.py`](./demo/synthetic_signal.py) | Fake BTC/ETH series → z-score / RS toy signal |
| [`notes/PAIR.md`](./notes/PAIR.md) | Pair desk notes (dry-run by design) |

## Deliberately omitted

- Live pair loop / state machine
- Venue env files and signing
- Real notional / leverage execution

## CTA

Open at launch. Later premium may need ~0.5% of `YOUR_TOKEN_CA_HERE` for **Monk Pair** tooling.
