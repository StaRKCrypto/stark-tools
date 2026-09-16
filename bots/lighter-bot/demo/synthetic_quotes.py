#!/usr/bin/env python3
"""Synthetic Lighter-RH style quotes — teaser only, no network / no keys."""
from __future__ import annotations

MID = 95_000.0  # toy BTC mid
TICK = 0.1
SPREAD = 8.0  # dollars


def ladder(n: int = 4) -> None:
    print("=== lighter-bot synthetic quotes (SAMPLE) ===")
    print(f"market: BTC-PERP-DEMO   mid={MID:.1f}   spread=${SPREAD}")
    print("ASK side:")
    for i in range(n - 1, -1, -1):
        px = MID + SPREAD / 2 + i * TICK * 10
        print(f"  {px:,.1f}  size=0.002")
    print("BID side:")
    for i in range(n):
        px = MID - SPREAD / 2 - i * TICK * 10
        print(f"  {px:,.1f}  size=0.002")
    print("NOTE: live keys private — this demo never signs or sends.")
    print("Token CA placeholder: YOUR_TOKEN_CA_HERE")


if __name__ == "__main__":
    ladder()
