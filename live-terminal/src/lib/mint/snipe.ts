import { JsonRpcProvider, parseUnits } from 'ethers'
import { CHAINS, getChain, type ChainConfig } from './chains'
import { encodeMintPublic, formatDrop, getPublicDrop } from './seadrop'
import { ethCall, ethGetTransactionCount, ethSendRawTransaction } from './rpc'
import { getSigner, isArmed, isDryRun, loadVault } from '../vault'
import { pushTape } from '../activity'
import { safeError } from '../redact'

export interface ArmedTarget {
  chain: string
  nftContract: string
  slug: string
  quantity: number
}

const ARM_TARGET = 'stark.live.mint.armed.v1'

export function loadArmedTarget(): ArmedTarget | null {
  try {
    const raw = sessionStorage.getItem(ARM_TARGET)
    if (!raw) return null
    return JSON.parse(raw) as ArmedTarget
  } catch {
    return null
  }
}

export function saveArmedTarget(t: ArmedTarget) {
  sessionStorage.setItem(ARM_TARGET, JSON.stringify(t))
}

export function clearArmedTarget() {
  sessionStorage.removeItem(ARM_TARGET)
}

function refuseIfPaid(valueWei: bigint, context: string) {
  if (valueWei > 0n) {
    throw new Error(`REFUSED: ${context} value=${valueWei} wei (>0). Free mints only.`)
  }
}

export async function probeContract(chainName: string, nftContract: string) {
  const chain = getChain(chainName)
  const drop = await getPublicDrop(chain, nftContract)
  return { chain, drop, formatted: formatDrop(drop) }
}

export async function runSnipe(opts?: { forceLive?: boolean }) {
  const target = loadArmedTarget()
  if (!target?.nftContract) {
    throw new Error('Arm a collection first (contract + chain). Scout never auto-mints.')
  }
  if (!isArmed()) {
    throw new Error('Desk disarmed. Arm from the header after the burner warning.')
  }
  const vault = loadVault()
  const wallet = getSigner()
  if (!vault || !wallet) throw new Error('No burner in vault')

  const chain: ChainConfig = getChain(target.chain)
  const provider = new JsonRpcProvider(chain.readRpc(), chain.chainId, {
    staticNetwork: true,
  })
  const drop = await getPublicDrop(chain, target.nftContract)
  refuseIfPaid(drop.mintPrice, 'SeaDrop mintPrice')
  const qty = Math.max(1, Math.min(target.quantity || 1, drop.maxTotalMintableByWallet || 1))
  const data = encodeMintPublic({
    nftContract: target.nftContract,
    feeRecipient: chain.openSeaFeeRecipient,
    quantity: qty,
  })
  const to = chain.seadrop
  const value = drop.mintPrice

  const nonceRes = await ethGetTransactionCount(chain.readRpc(), wallet.address)
  if (!nonceRes.ok) throw new Error(`nonce: ${nonceRes.error}`)
  const nonce = Number.parseInt(String(nonceRes.result), 16)
  let maxPriorityFeePerGas = parseUnits('0.001', 'gwei')
  let maxFeePerGas = parseUnits('0.02', 'gwei')
  try {
    const fee = await provider.getFeeData()
    if (fee.maxPriorityFeePerGas && fee.maxPriorityFeePerGas > 0n) {
      maxPriorityFeePerGas = fee.maxPriorityFeePerGas
    }
    if (fee.maxFeePerGas && fee.maxFeePerGas > 0n) {
      maxFeePerGas = fee.maxFeePerGas
    }
  } catch {
    /* defaults */
  }

  const unsigned = {
    type: 2 as const,
    chainId: chain.chainId,
    to,
    data,
    value,
    nonce,
    gasLimit: 300_000n,
    maxFeePerGas,
    maxPriorityFeePerGas,
  }
  const signed = await wallet.signTransaction(unsigned)

  const dry = isDryRun() && !opts?.forceLive
  if (dry) {
    const sim = await ethCall(chain.readRpc(), {
      from: wallet.address,
      to,
      data,
      value: '0x' + value.toString(16),
      gas: '0x493e0',
    })
    pushTape(
      'mint',
      'paper',
      `DRY_RUN eth_call ${chain.name} ${target.nftContract.slice(0, 10)}… qty=${qty} ${sim.ok ? 'OK' : 'FAIL ' + sim.error}`,
      { chain: chain.name, ok: sim.ok },
      sim.ok,
    )
    return { dryRun: true, sim, chain: chain.name, to, quantity: qty }
  }

  const send = await ethSendRawTransaction(chain.readRpc(), signed)
  pushTape(
    'mint',
    send.ok ? 'live' : 'error',
    send.ok
      ? `LIVE mintPublic broadcast ${String(send.result)}`
      : `LIVE send failed: ${send.error}`,
    { chain: chain.name },
    send.ok,
  )
  return {
    dryRun: false,
    send,
    explorer: send.ok ? chain.explorerTx(String(send.result)) : undefined,
    chain: chain.name,
  }
}

export { CHAINS }
