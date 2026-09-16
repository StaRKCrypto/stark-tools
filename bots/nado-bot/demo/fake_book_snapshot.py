#!/usr/bin/env python3
"""Synthetic Nado-style book snapshot — teaser only, no network."""
from __future__ import annotations

MID = 500.0
SPREAD_BPS = 4.0
LEVELS = 5
SIZE = 0.14  # toy clip


def levels(side: str) -> list[tuple[float, float]]:
    half = MID * (SPREAD_BPS / 10_000) / 2
    out = []
    for i in range(LEVELS):
        step = MID * 0.0002 * i
        px = MID - half - step if side == "bid" else MID + half + step
        out.append((round(px, 3), SIZE))
    return out


def main() -> None:
    bids, asks = levels("bid"), levels("ask")
    print("=== nado-bot fake book (SAMPLE) ===")
    print(f"symbol: DEMO-PERP   mid≈{MID}   spread≈{SPREAD_BPS} bps")
    print("asks (asc):")
    for px, sz in reversed(asks):
        print(f"  {px:>10.3f}  x {sz}")
    print("----")
    for px, sz in bids:
        print(f"  {px:>10.3f}  x {sz}")
    print("bids (desc)")
    print("inventory note: flat → two-sided; if filled → cover on touch (PAPER)")
    print("Token CA placeholder: YOUR_TOKEN_CA_HERE")


if __name__ == "__main__":
    main()
