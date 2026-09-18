import { ORIGIN } from '../endpoints'

/**
 * Documented public gateway (docs.nado.xyz):
 *   GET https://api.prod.nado.xyz/gateway/v1/query?type=symbols&product_type=perp
 * This Cloud VM often receives Cloudflare 403; the Vite proxy may still work
 * locally. UI surfaces the HTTP error instead of fabricating a book.
 */
export async function fetchNadoSymbols() {
  const url = `${ORIGIN.nado}/gateway/v1/query?type=symbols&product_type=perp`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(
      `Nado gateway HTTP ${res.status} (Cloudflare/CORS possible). ${text.slice(0, 120)}`,
    )
  }
  return JSON.parse(text)
}

export async function fetchNadoMarketPrice(productId: number) {
  const url = `${ORIGIN.nado}/gateway/v1/query?type=market_price&product_id=${productId}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
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
