import { ORIGIN } from '../endpoints'

/**
 * Documented public gateway (docs.nado.xyz):
 *   GET https://api.prod.nado.xyz/gateway/v1/query?type=symbols&product_type=perp
 * Cloudflare may 403 from some browsers; Vite proxy adds gzip Accept-Encoding.
 * UI surfaces the HTTP error instead of fabricating a book.
 */
const HDR: HeadersInit = { Accept: 'application/json' }

export interface NadoSymbol {
  type: string
  product_id: number
  symbol: string
  trading_status?: string
}

export async function fetchNadoSymbols() {
  const url = `${ORIGIN.nado}/gateway/v1/query?type=symbols&product_type=perp`
  const res = await fetch(url, { headers: HDR })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(
      `Nado gateway HTTP ${res.status} (Cloudflare/CORS possible). ${text.slice(0, 120)}`,
    )
  }
  return JSON.parse(text)
}

export function parseNadoSymbols(raw: unknown): NadoSymbol[] {
  const root = raw as { data?: { symbols?: Record<string, NadoSymbol> }; symbols?: Record<string, NadoSymbol> }
  const map = root?.data?.symbols || root?.symbols
  if (!map || typeof map !== 'object') return []
  return Object.values(map)
}

export async function fetchNadoMarketPrice(productId: number) {
  const url = `${ORIGIN.nado}/gateway/v1/query?type=market_price&product_id=${productId}`
  const res = await fetch(url, { headers: HDR })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Nado market_price HTTP ${res.status}: ${text.slice(0, 120)}`)
  }
  return JSON.parse(text)
}

export function x18ToNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw) / 1e18
  return Number.isFinite(n) ? n : null
}
