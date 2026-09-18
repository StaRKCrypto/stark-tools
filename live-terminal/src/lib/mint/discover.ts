import { id } from 'ethers'
import { CANONICAL_SEADROP, type ChainConfig } from './chains'
import { ethBlockNumber, ethGetCode, ethGetLogs } from './rpc'

export const SEADROP_MINT_TOPIC0 = id(
  'SeaDropMint(address,address,address,address,uint256,uint256,uint256)',
)

function topicAddress(topic: string | undefined): string | null {
  if (!topic || topic.length < 66) return null
  const hex = topic.replace(/^0x/i, '')
  if (hex.length !== 64) return null
  return ('0x' + hex.slice(24)).toLowerCase()
}

/** Browser-safe lookback: small pages on public RPCs. */
export async function discoverRecentSeaDropMints(
  chain: ChainConfig,
  lookbackBlocks = 400,
): Promise<{
  chain: string
  contracts: string[]
  logCount: number
  notes: string[]
}> {
  const notes: string[] = []
  const url = chain.readRpc()
  if (!url) {
    return { chain: chain.name, contracts: [], logCount: 0, notes: ['no public RPC'] }
  }
  const code = await ethGetCode(url, chain.seadrop || CANONICAL_SEADROP)
  if (!code.ok || !code.result || code.result === '0x') {
    notes.push('SeaDrop undeployed or RPC fail')
    return { chain: chain.name, contracts: [], logCount: 0, notes }
  }
  const bn = await ethBlockNumber(url)
  if (!bn.ok) {
    notes.push(`eth_blockNumber fail: ${bn.error}`)
    return { chain: chain.name, contracts: [], logCount: 0, notes }
  }
  const latest = parseInt(String(bn.result), 16)
  const toBlock = Math.max(0, latest - 2)
  const fromBlock = Math.max(0, toBlock - lookbackBlocks)
  const r = await ethGetLogs(url, {
    address: chain.seadrop || CANONICAL_SEADROP,
    fromBlock: '0x' + fromBlock.toString(16),
    toBlock: '0x' + toBlock.toString(16),
    topics: [SEADROP_MINT_TOPIC0],
  })
  if (!r.ok) {
    notes.push(`getLogs: ${r.error}`)
    return { chain: chain.name, contracts: [], logCount: 0, notes }
  }
  const logs = (r.result as { topics?: string[] }[]) || []
  const contracts = new Set<string>()
  for (const log of logs) {
    const addr = topicAddress(log.topics?.[1])
    if (addr) contracts.add(addr)
  }
  notes.push(
    `getLogs blocks=${lookbackBlocks} [${fromBlock}-${toBlock}] logs=${logs.length} unique=${contracts.size}`,
  )
  return {
    chain: chain.name,
    contracts: [...contracts],
    logCount: logs.length,
    notes,
  }
}
