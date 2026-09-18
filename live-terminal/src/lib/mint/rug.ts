import { Interface } from 'ethers'
import { ethCall, ethGetCode } from './rpc'
import { formatDrop, getPublicDrop } from './seadrop'
import type { ChainConfig } from './chains'

const OWNER_IFACE = new Interface([
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
])

async function tryEthCall(rpcUrl: string, to: string, data: string | null) {
  if (!rpcUrl || !to || !data) return null
  const r = await ethCall(rpcUrl, { to, data })
  if (!r.ok || !r.result || r.result === '0x') return null
  return r.result as string
}

export interface ScoredMint {
  slug: string | null
  name: string
  contract: string
  chain: string
  chainId: number
  source: string
  score: number
  fail: boolean
  pass: boolean
  flags: string[]
  reasons: string[]
  drop: ReturnType<typeof formatDrop> | null
}

export async function scoreCandidate(
  candidate: {
    contract: string
    chain: ChainConfig
    slug?: string | null
    name?: string
    price?: number | null
    source?: string
  },
): Promise<ScoredMint> {
  const flags: string[] = []
  const reasons: string[] = []
  let score = 70
  let fail = false
  let dropFmt: ReturnType<typeof formatDrop> | null = null
  const contract = candidate.contract
  const chainCfg = candidate.chain
  const rpcUrl = chainCfg.readRpc()

  if (candidate.price != null && Number(candidate.price) > 0) {
    return {
      slug: candidate.slug ?? null,
      name: candidate.name || contract,
      contract,
      chain: chainCfg.name,
      chainId: chainCfg.chainId,
      source: candidate.source || 'watchlist',
      score: 0,
      fail: true,
      pass: false,
      flags: ['paid'],
      reasons: [`price=${candidate.price} > 0`],
      drop: null,
    }
  }

  try {
    const drop = await getPublicDrop(chainCfg, contract)
    dropFmt = formatDrop(drop)
    if (drop.mintPrice > 0n) {
      return {
        slug: candidate.slug ?? null,
        name: candidate.name || contract,
        contract,
        chain: chainCfg.name,
        chainId: chainCfg.chainId,
        source: candidate.source || 'watchlist',
        score: 0,
        fail: true,
        pass: false,
        flags: ['paid'],
        reasons: [`on-chain mintPrice=${drop.mintPrice} wei > 0`],
        drop: dropFmt,
      }
    }
    if (!drop.startTime) {
      flags.push('no_public_stage')
      score -= 25
      reasons.push('SeaDrop startTime=0 / no public stage')
    } else {
      score += 15
      reasons.push('free SeaDrop public stage present')
    }
    const now = Math.floor(Date.now() / 1000)
    if (drop.endTime > 0 && drop.endTime < now) {
      flags.push('ended')
      score -= 30
      reasons.push('public drop endTime in the past')
    }
  } catch (e) {
    flags.push('seadrop_unreadable')
    score -= 20
    reasons.push(`getPublicDrop failed: ${e instanceof Error ? e.message : e}`)
  }

  try {
    const codeRes = await ethGetCode(rpcUrl, contract)
    const code = codeRes.ok ? (codeRes.result as string) : null
    if (!code || code === '0x' || code === '0x0') {
      flags.push('no_code')
      score -= 35
      reasons.push('eth_getCode empty')
    } else {
      score += 5
    }
  } catch {
    flags.push('unverified')
    score -= 5
  }

  try {
    const ownerData = OWNER_IFACE.encodeFunctionData('owner', [])
    const ownerRaw = await tryEthCall(rpcUrl, contract, ownerData)
    if (ownerRaw) {
      flags.push('owner_powered')
      score -= 10
      reasons.push('owner() callable')
    }
  } catch {
    /* ignore */
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const strictPass =
    !fail &&
    dropFmt &&
    dropFmt.mintPriceWei === '0' &&
    dropFmt.startTime > 0 &&
    !flags.includes('no_code')

  return {
    slug: candidate.slug ?? null,
    name: candidate.name || contract,
    contract,
    chain: chainCfg.name,
    chainId: chainCfg.chainId,
    source: candidate.source || 'watchlist',
    score,
    fail,
    pass: Boolean(strictPass),
    flags: [...new Set(flags)],
    reasons,
    drop: dropFmt,
  }
}
