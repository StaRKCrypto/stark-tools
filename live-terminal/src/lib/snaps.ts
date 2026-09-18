import { redactSecrets } from './redact'
import type { DeskId } from './venues/links'

const KEY = 'stark.live.snaps.v1'

export interface SnapOpen {
  market: string
  side: string
  size: string
  entry?: string
  upnl?: number
}

export interface SnapFill {
  at?: string
  market: string
  side: string
  size: string
  price?: string
}

export interface DeskSnap {
  venue: DeskId
  at: string
  equityUsd?: number
  availableUsd?: number
  pnlDayUsd?: number
  opens: SnapOpen[]
  fills: SnapFill[]
  note?: string
  source: 'paste' | 'file'
}

const DESKS: DeskId[] = ['nimbus', 'mint', 'arcus', 'lighter', 'nado']

function asDesk(raw: unknown): DeskId | null {
  if (typeof raw !== 'string') return null
  const v = raw.toLowerCase().trim()
  if (v === 'opensea' || v === 'seadrop') return 'mint'
  if (v === 'polymarket' || v === 'weather') return 'nimbus'
  return DESKS.includes(v as DeskId) ? (v as DeskId) : null
}

function num(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function str(raw: unknown): string | undefined {
  if (raw == null) return undefined
  const s = redactSecrets(String(raw)).trim()
  return s || undefined
}

function parseOpens(raw: unknown): SnapOpen[] {
  if (!Array.isArray(raw)) return []
  const out: SnapOpen[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const market = str(o.market || o.symbol || o.product || o.ticker)
    if (!market) continue
    out.push({
      market,
      side: str(o.side || o.dir || o.direction) || '—',
      size: str(o.size || o.qty || o.quantity || o.base) || '—',
      entry: str(o.entry || o.avg || o.price || o.px),
      upnl: num(o.upnl ?? o.uPnl ?? o.unrealized ?? o.pnl),
    })
  }
  return out
}

function parseFills(raw: unknown): SnapFill[] {
  if (!Array.isArray(raw)) return []
  const out: SnapFill[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const market = str(o.market || o.symbol || o.product)
    if (!market) continue
    out.push({
      at: str(o.at || o.ts || o.time || o.timestamp),
      market,
      side: str(o.side) || '—',
      size: str(o.size || o.qty || o.quantity) || '—',
      price: str(o.price || o.px),
    })
  }
  return out
}

export function parseDeskSnap(raw: unknown, source: DeskSnap['source'] = 'paste'): DeskSnap | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const venue = asDesk(o.venue || o.desk || o.bot || o.exchange)
  if (!venue) return null
  const at =
    str(o.at || o.ts || o.timestamp || o.asof || o.asOf || o.heartbeat) ||
    new Date().toISOString()
  return {
    venue,
    at,
    equityUsd: num(o.equityUsd ?? o.equity ?? o.account_equity ?? o.nav ?? o.balance),
    availableUsd: num(o.availableUsd ?? o.available ?? o.free ?? o.buying_power),
    pnlDayUsd: num(o.pnlDayUsd ?? o.pnlDay ?? o.day_pnl ?? o.realized),
    opens: parseOpens(o.opens || o.positions || o.inventory || o.exposure),
    fills: parseFills(o.fills || o.journal || o.trades),
    note: str(o.note || o.status || o.comment),
    source,
  }
}

export function parseSnapPayload(raw: unknown, source: DeskSnap['source'] = 'paste'): DeskSnap[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map((x) => parseDeskSnap(x, source)).filter((x): x is DeskSnap => Boolean(x))
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.snaps)) return parseSnapPayload(o.snaps, source)
    const one = parseDeskSnap(raw, source)
    return one ? [one] : []
  }
  return []
}

export function loadSnaps(): DeskSnap[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as DeskSnap[]) : []
  } catch {
    return []
  }
}

export function saveSnaps(snaps: DeskSnap[]) {
  const latest = new Map<DeskId, DeskSnap>()
  for (const s of snaps) latest.set(s.venue, s)
  localStorage.setItem(KEY, JSON.stringify([...latest.values()]))
}

export function mergeSnaps(incoming: DeskSnap[]) {
  const cur = loadSnaps()
  saveSnaps([...cur, ...incoming])
}

export function clearSnaps() {
  localStorage.removeItem(KEY)
}

export function snapFor(desk: DeskId): DeskSnap | undefined {
  return loadSnaps().find((s) => s.venue === desk)
}

export function importSnapText(text: string, source: DeskSnap['source'] = 'paste'): DeskSnap[] {
  const parsed = JSON.parse(redactSecrets(text)) as unknown
  const snaps = parseSnapPayload(parsed, source)
  if (!snaps.length) throw new Error('No desk snaps in payload (need venue/desk + optional equity/opens)')
  mergeSnaps(snaps)
  return snaps
}
