/** Parse Polymarket daily-max bucket labels like "29–30°C", "32°F or higher". */

export type BucketKind = 'le' | 'ge' | 'range' | 'pt'

export interface ParsedBucket {
  label: string
  kind: BucketKind
  lo: number | null
  hi: number | null
  unit: 'C' | 'F'
  mid: number
}

const UNIT_RE = /°?\s*([CF])/i

export function detectUnit(label: string, fallback: 'C' | 'F' = 'C'): 'C' | 'F' {
  const m = label.match(UNIT_RE)
  if (!m) return fallback
  return m[1].toUpperCase() === 'F' ? 'F' : 'C'
}

export function parseBucket(
  label: string,
  fallbackUnit: 'C' | 'F' = 'C',
): ParsedBucket | null {
  const s = (label || '').trim().replace(/–|—/g, '-')
  if (!s) return null
  const unit = detectUnit(s, fallbackUnit)
  const u = unit === 'F' ? '°?\\s*F' : '°?\\s*C'

  let m = s.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${u}\\s+or\\s+below$`, 'i'))
  if (m) {
    const hi = Number(m[1])
    return { label: s, kind: 'le', lo: null, hi, unit, mid: hi - 0.5 }
  }

  m = s.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${u}\\s+or\\s+higher$`, 'i'))
  if (m) {
    const lo = Number(m[1])
    return { label: s, kind: 'ge', lo, hi: null, unit, mid: lo + 0.5 }
  }

  m = s.match(
    new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*-\\s*(\\d+(?:\\.\\d+)?)\\s*${u}$`, 'i'),
  )
  if (m) {
    const lo = Number(m[1])
    const hi = Number(m[2])
    return { label: s, kind: 'range', lo, hi, unit, mid: (lo + hi) / 2 }
  }

  m = s.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${u}$`, 'i'))
  if (m) {
    const v = Number(m[1])
    return { label: s, kind: 'pt', lo: v, hi: v, unit, mid: v }
  }

  return null
}

export function bucketContains(
  bucket: ParsedBucket,
  value: number,
  whole = true,
): boolean {
  const v = whole ? Math.round(value) : value
  switch (bucket.kind) {
    case 'le':
      return bucket.hi != null && v <= bucket.hi
    case 'ge':
      return bucket.lo != null && v >= bucket.lo
    case 'range':
      return (
        bucket.lo != null &&
        bucket.hi != null &&
        v >= bucket.lo &&
        v <= bucket.hi
      )
    case 'pt':
      return bucket.lo != null && v === bucket.lo
  }
}

export function areAdjacent(a: ParsedBucket, b: ParsedBucket): boolean {
  return Math.abs(a.mid - b.mid) <= 2.1
}

export function sortByMid(buckets: ParsedBucket[]): ParsedBucket[] {
  return [...buckets].sort((x, y) => x.mid - y.mid)
}

export function cToF(c: number): number {
  return (c * 9) / 5 + 32
}

export function fToC(f: number): number {
  return ((f - 32) * 5) / 9
}

export function applyBiasC(
  tempC: number,
  biasC: number,
  unit: 'C' | 'F',
): number {
  const adjustedC = tempC + biasC
  return unit === 'F' ? cToF(adjustedC) : adjustedC
}
