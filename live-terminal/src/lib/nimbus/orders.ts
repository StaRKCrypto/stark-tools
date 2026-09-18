import { ORIGIN } from '../endpoints'
import { isArmed, isDryRun, loadVault } from '../vault'
import { pushTape } from '../activity'
import { safeError } from '../redact'
import type { CityScanRow } from './scan'

export interface PlaceIntent {
  city: CityScanRow
  label: string
  side: 'YES' | 'NO'
  tokenId: string
  price: number
  amountUsd: number
  tickSize?: string
  negRisk?: boolean
}

export interface PlaceResult {
  ok: boolean
  paper: boolean
  orderId?: string
  status: string
  error?: string
  note?: string
}

/**
 * Browser CLOB: paper always works. Live FAK/GTC needs Node Nimbus
 * (@polymarket/clob-client L2 creds + CORS). We attempt a public
 * CLOB book read; posting is blocked unless a future local proxy is attached.
 */
export async function placeNimbusOrder(intent: PlaceIntent): Promise<PlaceResult> {
  const dry = isDryRun() || !isArmed()
  const vault = loadVault()
  if (!vault) {
    return { ok: false, paper: true, status: 'no-vault', error: 'Paste a burner key in Vault first' }
  }

  const extra = {
    city: intent.city.city,
    label: intent.label,
    side: intent.side,
    price: intent.price,
    amountUsd: intent.amountUsd,
    tokenId: intent.tokenId.slice(0, 10) + '…',
  }

  if (dry) {
    const orderId = `paper-${Date.now()}`
    pushTape(
      'nimbus',
      'paper',
      `PAPER ${intent.side} ${intent.city.city} ${intent.label} $${intent.amountUsd} @ ${intent.price}`,
      extra,
      true,
    )
    return {
      ok: true,
      paper: true,
      orderId,
      status: 'dry-run',
      note: isDryRun()
        ? 'DRY_RUN on — no CLOB post. Uncheck DRY_RUN and Arm to attempt live (Node Nimbus still required for L2 auth).'
        : 'Desk disarmed — paper only. Arm from the header after reviewing burner warning.',
    }
  }

  // Honest live attempt: CLOB order posting from a static/browser host is not reliable.
  try {
    const mid = await fetchClobMid(intent.tokenId)
    pushTape(
      'nimbus',
      'block',
      `LIVE CLOB blocked in browser (L2 API creds / CORS). Intent saved. Book mid=${mid ?? 'n/a'}. Run Nimbus Node desk with DRY_RUN=0 for FAK→GTC.`,
      extra,
      false,
    )
    return {
      ok: false,
      paper: false,
      status: 'blocked-browser',
      error:
        'Polymarket CLOB live posts need Node Nimbus (@polymarket/client createOrDeriveApiKey). Browser saved the intent only.',
      note: mid != null ? `Public book mid ≈ ${mid}` : undefined,
    }
  } catch (e) {
    const err = safeError(e)
    pushTape('nimbus', 'error', `CLOB probe failed: ${err}`, extra, false)
    return { ok: false, paper: false, status: 'error', error: err }
  }
}

async function fetchClobMid(tokenId: string): Promise<number | null> {
  const url = `${ORIGIN.clob}/midpoint?token_id=${encodeURIComponent(tokenId)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as { mid?: string }
  const n = Number(data.mid)
  return Number.isFinite(n) ? n : null
}
