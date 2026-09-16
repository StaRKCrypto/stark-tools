#!/usr/bin/env python3
"""Synthetic BTC/ETH relative-strength signal — public-style math, no network."""
from __future__ import annotations
import math
import statistics


def series(n: int = 64, base: float = 100.0, drift: float = 0.02) -> list[float]:
    out = []
    x = base
    for i in range(n):
        x *= 1.0 + drift * math.sin(i / 7) * 0.01 + 0.0005 * math.cos(i / 3)
        out.append(x)
    return out


def zscore(xs: list[float]) -> float:
    if len(xs) < 2:
        return 0.0
    m = statistics.mean(xs)
    s = statistics.pstdev(xs) or 1e-9
    return (xs[-1] - m) / s


def main() -> None:
    btc = series(64, 95_000, 0.03)
    eth = series(64, 3_500, 0.025)
    ratio = [b / e for b, e in zip(btc, eth)]
    z = zscore(ratio[-32:])
    # toy rule: |z| > 1.5 → lean into mean-reversion story
    if z > 1.5:
        signal = "FADE_BTC_VS_ETH (paper)"
    elif z < -1.5:
        signal = "FADE_ETH_VS_BTC (paper)"
    else:
        signal = "FLAT / HOLD (paper)"
    print("=== monk-pair synthetic signal (SAMPLE) ===")
    print(f"last BTC≈{btc[-1]:,.1f}  ETH≈{eth[-1]:,.1f}  ratio≈{ratio[-1]:.4f}")
    print(f"z(ratio,32)={z:.3f}  →  {signal}")
    print("DRY math only — no live send")
    print("Token CA placeholder: YOUR_TOKEN_CA_HERE")


if __name__ == "__main__":
    main()
