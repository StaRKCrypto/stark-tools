export type TapeKind =
  | 'info'
  | 'scan'
  | 'paper'
  | 'live'
  | 'error'
  | 'arm'
  | 'vault'
  | 'block'

export interface TapeEntry {
  id: string
  at: string
  desk: string
  kind: TapeKind
  message: string
  ok?: boolean
  extra?: Record<string, string | number | boolean | null>
}

const KEY = 'stark.live.tape.v1'
const MAX = 400

function loadAll(): TapeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveAll(entries: TapeEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)))
}

export function listTape(desk?: string): TapeEntry[] {
  const all = loadAll()
  return desk ? all.filter((e) => e.desk === desk) : all
}

export function pushTape(
  desk: string,
  kind: TapeKind,
  message: string,
  extra?: TapeEntry['extra'],
  ok?: boolean,
): TapeEntry {
  const entry: TapeEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: new Date().toISOString(),
    desk,
    kind,
    message,
    extra,
    ok,
  }
  const next = [entry, ...loadAll()].slice(0, MAX)
  saveAll(next)
  return entry
}

export function clearTape(desk?: string) {
  if (!desk) {
    localStorage.removeItem(KEY)
    return
  }
  saveAll(loadAll().filter((e) => e.desk !== desk))
}
