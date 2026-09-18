export function fmtPx(n: number | string | null | undefined, digits = 2): string {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function fmtNum(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return v.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export function fmtUsd(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000) return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${v.toFixed(2)}`
}

export function fmtPct(n: number | string | null | undefined, alreadyPct = false): string {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  const p = alreadyPct ? v : v * 100
  const sign = p > 0 ? '+' : ''
  return `${sign}${p.toFixed(2)}%`
}

/** Funding rates from venue APIs are fractions (e.g. 0.0001). */
export function fmtFund(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${(v * 100).toFixed(4)}%`
}

export function fmtTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(11, 19)
}

export function ageLabel(iso?: string): string {
  if (!iso) return 'no snap'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 'no snap'
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return `${Math.round(s / 86400)}d`
}
