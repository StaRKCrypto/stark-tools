/** Port of sr_loop.py swings / ATR / bias / zone_status (read-only). */
import type { Candle } from './arcus'

export function swings(candles: Candle[], left = 3, right = 3) {
  const highs: number[] = []
  const lows: number[] = []
  const n = candles.length
  for (let i = left; i < n - right; i++) {
    const h = candles[i].h
    const l = candles[i].l
    let isH = true
    let isL = true
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue
      if (candles[j].h >= h) isH = false
      if (candles[j].l <= l) isL = false
    }
    if (isH) highs.push(h)
    if (isL) lows.push(l)
  }
  return { highs, lows }
}

export function nearest(levels: number[], px: number, side: 'support' | 'resist') {
  if (!levels.length) return null
  if (side === 'support') {
    const below = levels.filter((x) => x <= px * 1.002)
    return below.length ? Math.max(...below) : null
  }
  const above = levels.filter((x) => x >= px * 0.998)
  return above.length ? Math.min(...above) : null
}

export function atr14(candles: Candle[]): number {
  if (candles.length < 5) return 0
  const trs: number[] = []
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    const prev = i ? candles[i - 1].c : c.c
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev)))
  }
  const p = Math.min(14, trs.length)
  let atr = trs.slice(0, p).reduce((a, b) => a + b, 0) / p
  for (let i = p; i < trs.length; i++) {
    atr = (atr * (p - 1) + trs[i]) / p
  }
  return atr
}

export function biasFrom(candles: Candle[]): 'bullish' | 'bearish' | 'neutral' {
  if (candles.length < 20) return 'neutral'
  const closes = candles.map((c) => c.c)
  let emaFast = closes[0]
  let emaSlow = closes[0]
  const kf = 2 / 9
  const ks = 2 / 22
  for (const v of closes) {
    emaFast = v * kf + emaFast * (1 - kf)
    emaSlow = v * ks + emaSlow * (1 - ks)
  }
  if (emaFast > emaSlow * 1.001) return 'bullish'
  if (emaFast < emaSlow * 0.999) return 'bearish'
  return 'neutral'
}

export function zoneStatus(
  level: number | null,
  px: number,
  atr: number,
): 'inside' | 'approaching' | 'away' | null {
  if (level == null || atr <= 0) return null
  const dist = Math.abs(px - level)
  const band = Math.max(atr * 0.35, px * 0.0015)
  if (dist <= band) return 'inside'
  if (dist <= band * 2.2) return 'approaching'
  return 'away'
}

export function analyzeSr(candles: Candle[]) {
  const { highs, lows } = swings(candles)
  const px = candles.at(-1)?.c ?? 0
  const atr = atr14(candles)
  const support = nearest(lows, px, 'support')
  const resist = nearest(highs, px, 'resist')
  return {
    px,
    atr,
    bias: biasFrom(candles),
    support,
    resist,
    supportZone: zoneStatus(support, px, atr),
    resistZone: zoneStatus(resist, px, atr),
    swingHighs: highs.slice(-6),
    swingLows: lows.slice(-6),
  }
}
