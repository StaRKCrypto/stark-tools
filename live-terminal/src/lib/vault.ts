import { Wallet, JsonRpcProvider, formatEther } from 'ethers'
import { maskKey } from './redact'

export type SignatureType = 0 | 1 | 2

export interface VaultRecord {
  privateKey: string
  funderAddress?: string
  signatureType: SignatureType
  savedAt: string
}

const VAULT_KEY = 'stark.live.vault.v1'
const DRY_KEY = 'stark.live.dryrun.v1'
const ARM_KEY = 'stark.live.armed.v1'

export const PUBLIC_RPCS = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  polygon: 'https://polygon-bor-rpc.publicnode.com',
  base: 'https://base-rpc.publicnode.com',
} as const

function normalizeKey(raw: string): string {
  const t = raw.trim()
  if (/^0x[0-9a-fA-F]{64}$/.test(t)) return t
  if (/^[0-9a-fA-F]{64}$/.test(t)) return `0x${t}`
  throw new Error('Expected 32-byte hex private key (64 hex chars, optional 0x)')
}

export function addressFromKey(privateKey: string): string {
  const pk = normalizeKey(privateKey)
  return new Wallet(pk).address
}

export function loadVault(): VaultRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as VaultRecord
    if (!v?.privateKey) return null
    return v
  } catch {
    return null
  }
}

export function saveVault(input: {
  privateKey: string
  funderAddress?: string
  signatureType?: SignatureType
}): VaultRecord {
  const pk = normalizeKey(input.privateKey)
  // validate
  void new Wallet(pk)
  const vault: VaultRecord = {
    privateKey: pk,
    funderAddress: input.funderAddress?.trim() || undefined,
    signatureType: (input.signatureType ?? 1) as SignatureType,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
  return vault
}

export function clearVault() {
  localStorage.removeItem(VAULT_KEY)
  sessionStorage.removeItem(ARM_KEY)
}

export function isDryRun(): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(DRY_KEY)
  if (v == null) return true
  return v !== '0'
}

export function setDryRun(on: boolean) {
  localStorage.setItem(DRY_KEY, on ? '1' : '0')
  if (on) sessionStorage.removeItem(ARM_KEY)
}

export function isArmed(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(ARM_KEY) === '1'
}

export function setArmed(on: boolean) {
  if (on) sessionStorage.setItem(ARM_KEY, '1')
  else sessionStorage.removeItem(ARM_KEY)
}

export function vaultSnapshot() {
  const v = loadVault()
  if (!v) {
    return {
      hasKey: false,
      address: undefined as string | undefined,
      maskedKey: undefined as string | undefined,
      funderAddress: undefined as string | undefined,
      signatureType: 1 as SignatureType,
      dryRun: isDryRun(),
      armed: false,
    }
  }
  let address: string | undefined
  try {
    address = addressFromKey(v.privateKey)
  } catch {
    address = undefined
  }
  return {
    hasKey: true,
    address,
    maskedKey: maskKey(v.privateKey),
    funderAddress: v.funderAddress,
    signatureType: v.signatureType,
    dryRun: isDryRun(),
    armed: isArmed(),
  }
}

export function getSigner() {
  const v = loadVault()
  if (!v?.privateKey) return null
  return new Wallet(normalizeKey(v.privateKey))
}

export async function fetchNativeBalances(address: string) {
  const out: Record<string, { eth: string; error?: string }> = {}
  await Promise.all(
    Object.entries(PUBLIC_RPCS).map(async ([name, url]) => {
      try {
        const p = new JsonRpcProvider(url, undefined, { staticNetwork: true })
        const wei = await p.getBalance(address)
        out[name] = { eth: formatEther(wei) }
      } catch (e) {
        out[name] = {
          eth: '—',
          error: e instanceof Error ? e.message : String(e),
        }
      }
    }),
  )
  return out
}
