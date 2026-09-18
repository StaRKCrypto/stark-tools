import { describe, expect, it } from 'vitest'
import { parseBucket, bucketContains } from '../lib/nimbus/buckets'
import { edgeAfterFee, modelBucketProbability, STRATEGY } from '../lib/nimbus/engine'
import { encodeMintPublic, seadropInterface } from '../lib/mint/seadrop'
import { swings, atr14 } from '../lib/venues/sr'

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
