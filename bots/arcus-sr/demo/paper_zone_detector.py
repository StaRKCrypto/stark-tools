#!/usr/bin/env python3
"""Paper S/R zone detector on synthetic candles — no live send."""
from __future__ import annotations
import math
import random

random.seed(7)


def synth_closes(n: int = 80) -> list[float]:
    px = 100.0
    out = []
    for i in range(n):
        px += math.sin(i / 5) * 0.8 + random.uniform(-0.4, 0.4)
        out.append(round(px, 4))
    return out


def swings(closes: list[float], lb: int = 3) -> tuple[list[float], list[float]]:
    highs, lows = [], []
    for i in range(lb, len(closes) - lb):
        w = closes[i - lb : i + lb + 1]
        if closes[i] == max(w):
            highs.append(closes[i])
        if closes[i] == min(w):
            lows.append(closes[i])
    return highs, lows


def cluster(levels: list[float], tol: float = 0.6) -> list[float]:
    if not levels:
        return []
    levels = sorted(levels)
    groups: list[list[float]] = [[levels[0]]]
    for x in levels[1:]:
        if abs(x - groups[-1][-1]) <= tol:
            groups[-1].append(x)
        else:
            groups.append([x])
    return [round(sum(g) / len(g), 3) for g in groups]


def main() -> None:
    closes = synth_closes()
    hi, lo = swings(closes)
    res, sup = cluster(hi), cluster(lo)
    print("=== arcus-sr paper zone detector (SAMPLE) ===")
    print(f"bars={len(closes)}  last={closes[-1]:.3f}")
    print("resistance zones:", res[-3:] or res)
    print("support zones:   ", sup[-3:] or sup)
    print("MODE: paper only — no live send")
    print("Token CA placeholder: YOUR_TOKEN_CA_HERE")


if __name__ == "__main__":
    main()
