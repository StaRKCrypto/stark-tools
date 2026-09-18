import { describe, expect, it } from 'vitest'
import { parseBucket, bucketContains } from '../lib/nimbus/buckets'
import { edgeAfterFee, modelBucketProbability, STRATEGY } from '../lib/nimbus/engine'
import { encodeMintPublic, seadropInterface } from '../lib/mint/seadrop'
import { swings, atr14 } from '../lib/venues/sr'
import { parseNadoSymbols } from '../lib/venues/nado'
import { parseSnapPayload } from '../lib/snaps'
import { nadoMarketParam } from '../lib/venues/links'

describe('nimbus buckets', () => {
  it('parses range and or-higher labels', () => {
    const a = parseBucket('29-30°C', 'C')
    expect(a?.kind).toBe('range')
    expect(a && bucketContains(a, 29.4)).toBe(true)
    const b = parseBucket('32°F or higher', 'F')
    expect(b?.kind).toBe('ge')
    expect(b && bucketContains(b, 40)).toBe(true)
  })
})

describe('nimbus engine', () => {
  it('applies fee haircut on edge', () => {
    expect(edgeAfterFee(0.6, 0.5)).toBeCloseTo(0.6 - 0.5 - STRATEGY.feeHaircut)
  })
  it('models ensemble hits', () => {
    const parsed = parseBucket('70-71°F', 'F')!
    const p = modelBucketProbability(parsed, {
      observedMax: 70,
      ensembleMax: 70.5,
      ensembleMembers: [70, 71, 69, 70],
      remainingHeat: 0.2,
      localHour: 16,
      peakHour: 15,
      metarIsResolution: true,
      locked: false,
    })
    expect(p).toBeGreaterThan(0)
  })
})

describe('seadrop', () => {
  it('encodes mintPublic', () => {
    const data = encodeMintPublic({
      nftContract: '0x0000000000000000000000000000000000000001',
      quantity: 1,
    })
    expect(data.startsWith('0x')).toBe(true)
    const decoded = seadropInterface.decodeFunctionData('mintPublic', data)
    expect(decoded[3]).toBe(1n)
  })
})

describe('desk snaps', () => {
  it('parses nado equity/opens and ignores unknown desks', () => {
    const snaps = parseSnapPayload({
      snaps: [
        {
          venue: 'nado',
          equityUsd: 1284.5,
          opens: [{ market: 'QQQ-PERP', side: 'LONG', size: '0.14', entry: '722.4' }],
          at: '2026-09-18T22:00:00Z',
        },
        { desk: 'unknown', equity: 1 },
      ],
    })
    expect(snaps).toHaveLength(1)
    expect(snaps[0].venue).toBe('nado')
    expect(snaps[0].equityUsd).toBe(1284.5)
    expect(snaps[0].opens[0].market).toBe('QQQ-PERP')
  })

  it('parses MSI farm health fields', () => {
    const [s] = parseSnapPayload({
      desk: 'nado',
      equityUsd: 23.71,
      sessionPnlPct: 57.72,
      status: 'RUNNING',
      halt: false,
      cfg: 0,
      mode: 'FLATTEN_LONG',
      pair: 'WTI-PERP',
      pos: 0.66,
      antibleedTicks: 16,
      requoteBps: 8,
      ageMaxSec: 300,
      flatten: 'post_only',
      note: 'antibleed_v2',
    })
    expect(s.status).toBe('RUNNING')
    expect(s.mode).toBe('FLATTEN_LONG')
    expect(s.antibleedTicks).toBe(16)
    expect(s.pair).toBe('WTI-PERP')
    expect(s.halt).toBe(false)
  })
})

describe('nado symbols parse', () => {
  it('reads gateway map', () => {
    const rows = parseNadoSymbols({
      data: { symbols: { 'QQQ-PERP': { type: 'perp', product_id: 98, symbol: 'QQQ-PERP' } } },
    })
    expect(rows[0].product_id).toBe(98)
    expect(nadoMarketParam('QQQ-PERP')).toBe('QQQ')
  })
})

describe('sr swings', () => {
  it('finds a pivot high', () => {
    const c = [1, 2, 3, 8, 3, 2, 1].map((h, i) => ({
      t: i,
      o: h,
      h,
      l: h - 1,
      c: h,
      v: 1,
      isFinal: true,
    }))
    const { highs } = swings(c, 2, 2)
    expect(highs).toContain(8)
    expect(atr14(c)).toBeGreaterThan(0)
  })
})
