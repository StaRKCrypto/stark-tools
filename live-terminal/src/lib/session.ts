import { create } from 'zustand'
import { vaultSnapshot, type SignatureType } from './vault'

export interface SessionState {
  hasKey: boolean
  address?: string
  maskedKey?: string
  funderAddress?: string
  signatureType: SignatureType
  dryRun: boolean
  armed: boolean
  vaultOpen: boolean
  lastError?: string
  refresh: () => void
  setVaultOpen: (open: boolean) => void
  setLastError: (msg?: string) => void
}

export const useSession = create<SessionState>((set) => ({
  ...vaultSnapshot(),
  vaultOpen: false,
  lastError: undefined,
  refresh: () => set({ ...vaultSnapshot() }),
  setVaultOpen: (vaultOpen) => set({ vaultOpen }),
  setLastError: (lastError) => set({ lastError }),
}))
