/** Public-RPC chain table ported from mint-scout (no Alchemy keys). */

export const CANONICAL_SEADROP = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5'
export const DEFAULT_OPENSEA_FEE = '0x0000a26b00c1F0DF003000390027140000fAa719'

export interface ChainConfig {
  chainId: number
  name: string
  displayName: string
  nativeSymbol: string
  seadrop: string
  openSeaFeeRecipient: string
  explorer: string
  publicRpcs: string[]
  sequencer?: string | null
  readRpc(): string
  sendEndpoints(): string[]
  explorerTx(hash: string): string
}

function chain(row: {
  chainId: number
  name: string
  displayName: string
  nativeSymbol: string
  explorer: string
  publicRpcs: string[]
  sequencer?: string
}): ChainConfig {
  const seadrop = CANONICAL_SEADROP
  const openSeaFeeRecipient = DEFAULT_OPENSEA_FEE
  return {
    ...row,
    sequencer: row.sequencer || null,
    seadrop,
    openSeaFeeRecipient,
    readRpc() {
      return this.publicRpcs[0]
    },
    sendEndpoints() {
      const list: string[] = []
      if (this.sequencer) list.push(this.sequencer)
      list.push(...this.publicRpcs)
      return list
    },
    explorerTx(hash: string) {
      const base = this.explorer.replace(/\/$/, '')
      return `${base}/tx/${hash}`
    },
  }
}

export const CHAINS: ChainConfig[] = [
  chain({
    chainId: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    nativeSymbol: 'ETH',
    explorer: 'https://etherscan.io',
    publicRpcs: ['https://ethereum-rpc.publicnode.com', 'https://rpc.ankr.com/eth'],
  }),
  chain({
    chainId: 8453,
    name: 'base',
    displayName: 'Base',
    nativeSymbol: 'ETH',
    explorer: 'https://basescan.org',
    publicRpcs: ['https://base-rpc.publicnode.com', 'https://mainnet.base.org'],
  }),
  chain({
    chainId: 4663,
    name: 'robinhood',
    displayName: 'Robinhood Chain',
    nativeSymbol: 'ETH',
    explorer: 'https://explorer.robinhood.com',
    publicRpcs: [],
    sequencer: undefined,
  }),
  chain({
    chainId: 57073,
    name: 'ink',
    displayName: 'Ink',
    nativeSymbol: 'ETH',
    explorer: 'https://explorer.inkonchain.com',
    publicRpcs: ['https://rpc-gel.inkonchain.com'],
  }),
].filter((c) => c.publicRpcs.length || c.sequencer)

export function getChain(idOrName: string | number): ChainConfig {
  const n = String(idOrName).toLowerCase()
  const found = CHAINS.find(
    (c) => c.name === n || String(c.chainId) === n,
  )
  if (!found) throw new Error(`Unknown chain: ${idOrName}`)
  return found
}
