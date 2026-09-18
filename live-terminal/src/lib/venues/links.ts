export type DeskId = 'nimbus' | 'mint' | 'arcus' | 'lighter' | 'nado'

export const VENUE = {
  lighterTrade: (symbol = 'BTC') =>
    `https://app.lighter.xyz/trade/${encodeURIComponent(symbol)}`,
  lighterMarkets: 'https://app.lighter.xyz/markets',
  arcusTrade: (symbol = 'BTC-USD') =>
    `https://app.arcus.xyz/trade/${encodeURIComponent(symbol)}`,
  arcusHome: 'https://app.arcus.xyz/',
  nadoPerp: (market = 'QQQ') =>
    `https://app.nado.xyz/perpetuals?market=${encodeURIComponent(market)}`,
  nadoHome: 'https://app.nado.xyz/perpetuals',
  openseaDrops: 'https://opensea.io/drops',
  openseaCollection: (slug: string) =>
    `https://opensea.io/collection/${encodeURIComponent(slug)}`,
  openseaAsset: (chain: string, contract: string) =>
    `https://opensea.io/item/${encodeURIComponent(chain)}/${contract}`,
  polymarketEvent: (slug: string) =>
    `https://polymarket.com/event/${encodeURIComponent(slug)}`,
  polymarketHome: 'https://polymarket.com/',
} as const

export function nadoMarketParam(symbol: string) {
  return symbol.replace(/-PERP$/i, '')
}
