# sr-bot — Support / Resistance Sample (Synthetic)

**StaRK Bots** · [@starkcryptollc](https://x.com/starkcryptollc) · [@_Starkcrypto](https://x.com/_Starkcrypto)

> **Open at launch.** Desks are free to try. Later premium tools may need **~0.5%** hold of the official coin  
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

---

## Product feature (commercial teaser)

**Paste a coin CA → get a chart → mark Support & Resistance.**

The hosted SR Bot is built for meme / mid-cap desks that need a fast structural read:

1. Paste the token contract address  
2. Pull a clean OHLCV window  
3. Mark swing highs / lows as candidate **resistance** and **support**  
4. (Hosted) Layer confluence, alerts, and desk workflows  

This **public sample** shows the *idea* with **synthetic candles only** — impressive enough
to feel the workflow, incomplete enough that it is clearly not the full product.

## Quick demo

```bash
python3 demo.py
# optional:
python3 demo.py --seed 42 --bars 120 --coin YOUR_TOKEN_CA_HERE
```

Example mental model:

```
CA: YOUR_TOKEN_CA_HERE
→ synthetic OHLCV generated locally
→ swing highs tagged as Resistance
→ swing lows tagged as Support
→ ASCII chart + level table printed
```

## What this sample includes

| File | Role |
|---|---|
| `demo.py` | Generate synthetic OHLCV, detect simple swing S/R, print levels + ASCII chart |
| `requirements.txt` | None required (stdlib only) — listed for clarity |

Algorithm (intentionally simple):

- Local swing high / low over a fixed window (`lookback=3`)
- Cluster nearby swings into levels
- Rank by touch count
- **No** SMC, **no** fibs, **no** order blocks, **no** live exchange I/O

## Deliberately omitted (hosted / gated)

- Smart Money Concepts / market structure engine
- Fibonacci / liquidity maps
- Live exchange or indexer keys
- Auto-trading / order placement
- Multi-TF confluence + alerts
- Real CA → chain data path

## CTA

Open at launch. Later premium may need **~0.5%** of (`YOUR_TOKEN_CA_HERE` after launch) for the
**hosted** SR Bot — paste CA, live chart, full S/R stack.

Public sample ≠ full product. Authenticity teaser only.

## License

MIT (teaser sample). Hosted product terms are separate.
