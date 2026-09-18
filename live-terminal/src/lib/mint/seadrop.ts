import { Contract, Interface, JsonRpcProvider, ZeroAddress } from 'ethers'
import { CANONICAL_SEADROP, DEFAULT_OPENSEA_FEE, type ChainConfig } from './chains'

export const SEADROP_ABI = [
  'function getPublicDrop(address nftContract) view returns (tuple(uint80 mintPrice, uint48 startTime, uint48 endTime, uint16 maxTotalMintableByWallet, uint16 feeBps, bool restrictFeeRecipients))',
  'function mintPublic(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity) payable',
]

export const seadropInterface = new Interface(SEADROP_ABI)

export function getSeadropContract(
  providerOrRunner: JsonRpcProvider,
  seadropAddress = CANONICAL_SEADROP,
) {
  return new Contract(seadropAddress, SEADROP_ABI, providerOrRunner)
}

export async function getPublicDrop(chain: ChainConfig, nftContract: string) {
  const provider = new JsonRpcProvider(chain.readRpc(), chain.chainId, {
    staticNetwork: true,
  })
  const seadrop = chain.seadrop || CANONICAL_SEADROP
  const c = getSeadropContract(provider, seadrop)
  const drop = await c.getPublicDrop(nftContract)
  const mintPrice = BigInt(drop.mintPrice ?? drop[0] ?? 0)
  const startTime = Number(drop.startTime ?? drop[1] ?? 0)
  const endTime = Number(drop.endTime ?? drop[2] ?? 0)
  const maxTotalMintableByWallet = Number(
    drop.maxTotalMintableByWallet ?? drop[3] ?? 0,
  )
  const feeBps = Number(drop.feeBps ?? drop[4] ?? 0)
  const restrictFeeRecipients = Boolean(
    drop.restrictFeeRecipients ?? drop[5] ?? false,
  )
  return {
    mintPrice,
    startTime,
    endTime,
    maxTotalMintableByWallet,
    feeBps,
    restrictFeeRecipients,
    seadrop,
  }
}

export function encodeMintPublic({
  nftContract,
  feeRecipient = DEFAULT_OPENSEA_FEE,
  minterIfNotPayer = ZeroAddress,
  quantity = 1,
}: {
  nftContract: string
  feeRecipient?: string
  minterIfNotPayer?: string
  quantity?: number
}) {
  if (!nftContract) throw new Error('encodeMintPublic: nftContract required')
  return seadropInterface.encodeFunctionData('mintPublic', [
    nftContract,
    feeRecipient,
    minterIfNotPayer,
    quantity,
  ])
}

export function formatDrop(drop: {
  mintPrice: bigint
  startTime: number
  endTime: number
  maxTotalMintableByWallet: number
  feeBps: number
  restrictFeeRecipients: boolean
  seadrop: string
}) {
  const priceEth = Number(drop.mintPrice) / 1e18
  const startIso =
    drop.startTime > 0 ? new Date(drop.startTime * 1000).toISOString() : 'n/a'
  const endIso =
    drop.endTime > 0 ? new Date(drop.endTime * 1000).toISOString() : 'n/a'
  return {
    mintPriceWei: drop.mintPrice.toString(),
    mintPriceEth: priceEth,
    startTime: drop.startTime,
    endTime: drop.endTime,
    startIso,
    endIso,
    maxTotalMintableByWallet: drop.maxTotalMintableByWallet,
    feeBps: drop.feeBps,
    restrictFeeRecipients: drop.restrictFeeRecipients,
    seadrop: drop.seadrop,
    free: drop.mintPrice === 0n,
    open:
      drop.startTime > 0 &&
      (drop.endTime === 0 || drop.endTime * 1000 > Date.now()),
  }
}
