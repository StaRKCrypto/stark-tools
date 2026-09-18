import { redactSecrets } from '../redact'

export async function rpcCall(
  url: string,
  method: string,
  params: unknown[] = [],
) {
  const t0 = performance.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    const text = await res.text()
    const rtt = performance.now() - t0
    let json: { result?: unknown; error?: { message?: string } }
    try {
      json = JSON.parse(text)
    } catch {
      return {
        ok: false as const,
        url,
        rtt,
        error: `non-json (${res.status}): ${text.slice(0, 80)}`,
      }
    }
    if (json.error) {
      return {
        ok: false as const,
        url,
        rtt,
        error: json.error.message || JSON.stringify(json.error),
      }
    }
    return { ok: true as const, url, rtt, result: json.result }
  } catch (err) {
    return {
      ok: false as const,
      url,
      rtt: performance.now() - t0,
      error: redactSecrets(err instanceof Error ? err.message : String(err)),
    }
  }
}

export function ethBlockNumber(url: string) {
  return rpcCall(url, 'eth_blockNumber', [])
}
export function ethGetBalance(url: string, address: string) {
  return rpcCall(url, 'eth_getBalance', [address, 'latest'])
}
export function ethGetTransactionCount(url: string, address: string) {
  return rpcCall(url, 'eth_getTransactionCount', [address, 'pending'])
}
export function ethGetCode(url: string, address: string) {
  return rpcCall(url, 'eth_getCode', [address, 'latest'])
}
export function ethCall(url: string, tx: object, block = 'latest') {
  return rpcCall(url, 'eth_call', [tx, block])
}
export function ethSendRawTransaction(url: string, rawTx: string) {
  return rpcCall(url, 'eth_sendRawTransaction', [rawTx])
}
export function ethGetLogs(url: string, filter: object) {
  return rpcCall(url, 'eth_getLogs', [filter])
}

export async function pickWorkingRpc(urls: string[]): Promise<string> {
  for (const url of urls) {
    const r = await ethBlockNumber(url)
    if (r.ok && r.result) return url
  }
  if (!urls.length) throw new Error('no RPCs')
  return urls[0]
}

export function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    let path = u.pathname
    if (path.includes('/v2/')) path = '/v2/<redacted>'
    return `${u.host}${path === '/' ? '' : path}`
  } catch {
    return String(url).slice(0, 48)
  }
}
