/** Never log or persist full private keys. */

export function maskKey(pk: string): string {
  if (!pk) return ''
  const s = pk.startsWith('0x') ? pk : `0x${pk}`
  return `${s.slice(0, 6)}…${s.slice(-4)}`
}

export function maskAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function redactSecrets(text: string): string {
  if (!text) return text
  return String(text)
    .replace(/0x[0-9a-fA-F]{64}/g, '0x<redacted-key>')
    .replace(/\/v2\/[A-Za-z0-9_-]+/g, '/v2/<redacted>')
}

export function safeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  return redactSecrets(msg)
}
