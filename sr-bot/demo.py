#!/usr/bin/env python3
"""
sr-bot PUBLIC TEASER — synthetic OHLCV + simple swing Support/Resistance.

NOT the full product. No live exchanges. No API keys. No SMC/fibs/trading.

Open at launch. Later premium may need ~0.5% of YOUR_TOKEN_CA_HERE.
Brand: @starkcryptollc (StaRK Bots) · @_Starkcrypto
"""

from __future__ import annotations

import argparse
import math
import random
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class Candle:
    i: int
    o: float
    h: float
    l: float
    c: float


@dataclass
class Level:
    price: float
    kind: str  # "support" | "resistance"
    touches: int


def synth_ohlcv(n: int, seed: int, start: float = 100.0) -> List[Candle]:
    """Random-walk synthetic candles (demo only)."""
    rng = random.Random(seed)
    price = start
    out: List[Candle] = []
    for i in range(n):
        drift = rng.uniform(-0.8, 0.9)
        shock = rng.choice([0, 0, 0, rng.uniform(-3.5, 3.5)])
        close = max(1.0, price + drift + shock)
        high = max(price, close) + rng.uniform(0.1, 1.8)
        low = min(price, close) - rng.uniform(0.1, 1.8)
        out.append(Candle(i=i, o=price, h=high, l=max(0.5, low), c=close))
        price = close
    return out


def swing_points(candles: List[Candle], lookback: int = 3) -> Tuple[List[Tuple[int, float]], List[Tuple[int, float]]]:
    """Simple swing highs / lows — illustrative only."""
    highs, lows = [], []
    for i in range(lookback, len(candles) - lookback):
        window = candles[i - lookback : i + lookback + 1]
        mid = candles[i]
        if mid.h >= max(c.h for c in window):
            highs.append((i, mid.h))
        if mid.l <= min(c.l for c in window):
            lows.append((i, mid.l))
    return highs, lows


def cluster_levels(
    points: List[Tuple[int, float]],
    kind: str,
    tol_pct: float = 0.8,
) -> List[Level]:
    if not points:
        return []
    prices = sorted(p for _, p in points)
    clusters: List[List[float]] = [[prices[0]]]
    for p in prices[1:]:
        anchor = sum(clusters[-1]) / len(clusters[-1])
        if abs(p - anchor) / anchor * 100 <= tol_pct:
            clusters[-1].append(p)
        else:
            clusters.append([p])
    levels = [
        Level(price=sum(c) / len(c), kind=kind, touches=len(c))
        for c in clusters
    ]
    levels.sort(key=lambda lv: (-lv.touches, lv.price))
    return levels


def ascii_chart(candles: List[Candle], levels: List[Level], width: int = 64, height: int = 18) -> str:
    lo = min(c.l for c in candles)
    hi = max(c.h for c in candles)
    span = max(hi - lo, 1e-9)
    grid = [[" " for _ in range(width)] for _ in range(height)]

    def row_for(price: float) -> int:
        return max(0, min(height - 1, int((hi - price) / span * (height - 1))))

    # candles (close path)
    for c in candles:
        x = int(c.i / max(len(candles) - 1, 1) * (width - 1))
        y = row_for(c.c)
        grid[y][x] = "·"

    # levels
    for lv in levels[:6]:
        y = row_for(lv.price)
        ch = "R" if lv.kind == "resistance" else "S"
        for x in range(width):
            if grid[y][x] == " ":
                grid[y][x] = "─"
        grid[y][0] = ch

    lines = ["".join(row) for row in grid]
    header = f"price≈{hi:.2f} (top) … {lo:.2f} (bottom)"
    return header + "\n" + "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="sr-bot public teaser — synthetic S/R demo")
    ap.add_argument("--coin", default="YOUR_TOKEN_CA_HERE", help="Placeholder CA (not fetched)")
    ap.add_argument("--bars", type=int, default=100)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--lookback", type=int, default=3)
    args = ap.parse_args()

    print("=" * 64)
    print("  sr-bot SAMPLE — Support / Resistance (synthetic OHLCV)")
    print("  StaRK Bots · @starkcryptollc · NOT the full product")
    print("=" * 64)
    print(f"  coin CA (placeholder): {args.coin}")
    print(f"  bars={args.bars}  seed={args.seed}  lookback={args.lookback}")
    print("  note: no live market data · no exchange keys · no auto-trade")
    print("-" * 64)

    candles = synth_ohlcv(args.bars, args.seed)
    highs, lows = swing_points(candles, lookback=args.lookback)
    resists = cluster_levels(highs, "resistance")
    supports = cluster_levels(lows, "support")
    levels = (resists[:4] + supports[:4])

    print("\nDetected levels (simple swings → clustered):\n")
    print(f"  {'KIND':<12} {'PRICE':>10}  {'TOUCHES':>7}")
    for lv in levels:
        print(f"  {lv.kind:<12} {lv.price:>10.3f}  {lv.touches:>7}")

    last = candles[-1].c
    nearest_s = min((lv for lv in supports), key=lambda lv: abs(lv.price - last), default=None)
    nearest_r = min((lv for lv in resists), key=lambda lv: abs(lv.price - last), default=None)
    print(f"\n  last close: {last:.3f}")
    if nearest_s:
        print(f"  nearest support:    {nearest_s.price:.3f}")
    if nearest_r:
        print(f"  nearest resistance: {nearest_r.price:.3f}")

    print("\nASCII chart (· = close path, S/R = levels):\n")
    print(ascii_chart(candles, levels))

    print("\n" + "-" * 64)
    print("Hosted SR Bot: paste CA → live chart → full S/R stack.")
    print("Gate: hold ~0.5% of official coin (YOUR_TOKEN_CA_HERE after launch).")
    print("Missing here on purpose: SMC, fibs, live trading, exchange keys.")
    print("=" * 64)


if __name__ == "__main__":
    main()
