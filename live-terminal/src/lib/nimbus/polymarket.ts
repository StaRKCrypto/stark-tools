/**
 * Gamma discovery for "Highest temperature in …" events → bucket markets + token ids.
 */
import { parseBucket } from './buckets'
import { findStationByCityHint, type Station } from './stations'
import type { BucketMarket } from './engine'
import { ORIGIN, UA } from '../endpoints'

const GAMMA = ORIGIN.gamma

export interface GammaEventSlim {
  id: string
  slug: string
  title: string
  cityHint: string
  station?: Station
  eventDate?: string
  markets: BucketMarket[]
  closed: boolean
}

function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
  return raw as T
}

function cityHintFromTitle(title: string): string {
  const m = title.match(/Highest temperature in\s+(.+?)(?:\s+on\s+|\s*\(|$)/i)
  return (m?.[1] || title).trim()
}

function dateFromSlug(slug: string): string | undefined {
  // highest-temperature-in-{city}-on-{month}-{day}-{year}
  const m = slug.match(/-on-([a-z]+)-(\d{1,2})-(\d{4})$/i)
  if (!m) return undefined
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  }
  const mo = months[m[1].toLowerCase()]
  if (!mo) return undefined
  return `${m[3]}-${mo}-${m[2].padStart(2, '0')}`
}

export async function fetchWeatherEvents(limit = 100): Promise<GammaEventSlim[]> {
  // public-search is the reliable discovery path for daily-max weather.
  // tag_id=84 is climate/general and often returns non-city markets.
  let events: any[] = []
  try {
    const url = `${GAMMA}/public-search?q=${encodeURIComponent('highest temperature in')}&limit_per_type=${Math.min(50, limit)}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    if (res.ok) {
      const data = await res.json()
      const arr = Array.isArray(data?.events) ? data.events : []
      events = arr.filter((e: any) =>
        String(e.title || e.question || e.slug || '')
          .toLowerCase()
          .includes('highest temperature'),
      )
    }
  } catch (e) {
    console.warn('[gamma] public-search failed', e)
  }

  if (!events.length) {
    const urls = [
      `${GAMMA}/events?active=true&closed=false&limit=${limit}`,
      `${GAMMA}/events?tag_id=84&active=true&closed=false&limit=${limit}`,
    ]
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': UA },
        })
        if (!res.ok) continue
        const data = await res.json()
        const arr = Array.isArray(data) ? data : data?.events || []
        events = arr.filter((e: any) =>
          String(e.title || e.question || '')
            .toLowerCase()
            .includes('highest temperature'),
        )
        if (events.length) break
      } catch (e) {
        console.warn('[gamma] fetch failed', url, e)
      }
    }
  }

  // Hydrate events that lack markets via slug lookup
  const hydrated: any[] = []
  for (const ev of events.slice(0, limit)) {
    if (Array.isArray(ev.markets) && ev.markets.length) {
      hydrated.push(ev)
      continue
    }
    try {
      const slug = String(ev.slug || '')
      if (!slug) continue
      const res = await fetch(`${GAMMA}/events?slug=${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json', 'User-Agent': UA },
      })
      if (!res.ok) continue
      const data = await res.json()
      const full = Array.isArray(data) ? data[0] : data
      if (full) hydrated.push(full)
    } catch {
      /* skip */
    }
  }
  events = hydrated

  const out: GammaEventSlim[] = []
  for (const ev of events) {
    const title = String(ev.title || '')
    const slug = String(ev.slug || '')
    const cityHint = cityHintFromTitle(title)
    const station = findStationByCityHint(cityHint)
    const unit = station?.unit ?? 'C'
    const marketsRaw = Array.isArray(ev.markets) ? ev.markets : []
    const markets: BucketMarket[] = []

    for (const m of marketsRaw) {
      const label = String(
        m.groupItemTitle || m.question || m.outcome || m.title || '',
      )
      const parsed = parseBucket(label, unit)
      if (!parsed) continue
      const prices = parseJsonField<string[]>(m.outcomePrices, [])
      const tokens = parseJsonField<string[]>(m.clobTokenIds, [])
      const yesPrice = Number(prices[0] ?? m.bestBid ?? 0.5)
      const noPrice =
        Number(prices[1] ?? (1 - yesPrice)) || Math.max(0, 1 - yesPrice)
      const yesTokenId = String(tokens[0] || '')
      const noTokenId = String(tokens[1] || '')
      if (!yesTokenId) continue
      markets.push({
        label,
        parsed,
        yesPrice: Number.isFinite(yesPrice) ? yesPrice : 0.5,
        noPrice: Number.isFinite(noPrice) ? noPrice : 0.5,
        yesTokenId,
        noTokenId,
        tickSize: m.orderPriceMinTickSize
          ? String(m.orderPriceMinTickSize)
          : '0.01',
        negRisk: Boolean(m.negRisk ?? ev.negRisk),
        conditionId: m.conditionId,
      })
    }

    if (!markets.length) continue
    out.push({
      id: String(ev.id),
      slug,
      title,
      cityHint,
      station,
      eventDate: dateFromSlug(slug) || ev.endDate?.slice?.(0, 10),
      markets,
      closed: Boolean(ev.closed),
    })
  }

  return out
}
