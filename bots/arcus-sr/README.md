# arcus-sr — Arcus S/R Auto Desk Teaser

**StaRK Bots** · [@starkcryptollc](https://x.com/starkcryptollc) · [@_Starkcrypto](https://x.com/_Starkcrypto)  
GitHub: [StaRKCrypto](https://github.com/StaRKCrypto)

> **Open at launch.** Desks are free to try. Later premium tools may need **~0.5%** hold of the official coin  
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## What this sample is

**Paper zone detector** for an Arcus support/resistance auto desk. Marks toy swing
zones on synthetic candles. **No live send**, no Ed25519 keys, no venue env.

## Quick demo

```bash
python3 demo/paper_zone_detector.py
```

## Files

| Path | Role |
|---|---|
| [`demo/paper_zone_detector.py`](./demo/paper_zone_detector.py) | Synthetic swings → support/resistance zones |
| [`notes/PAPER_DESK.md`](./notes/PAPER_DESK.md) | Operator notes (disarmed by design) |

## Deliberately omitted

- Live Arcus `placeOrder` / TPSL batch paths
- `arcus-sr.env` and signing seeds
- Full `sr_loop` product brain
- Trade journals with real fills

## CTA

Open at launch. Later premium may need ~0.5% of `YOUR_TOKEN_CA_HERE` for **Arcus S/R** tooling.
