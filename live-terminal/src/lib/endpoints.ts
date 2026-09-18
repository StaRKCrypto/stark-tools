/** Browser-dev uses Vite proxies; production uses origin URLs (CORS permitting). */

const DEV = Boolean(import.meta.env?.DEV)

export const ORIGIN = {
  gamma: DEV ? '/proxy/gamma' : 'https://gamma-api.polymarket.com',
  arcus: DEV ? '/proxy/arcus' : 'https://api.arcus.xyz',
  lighter: DEV ? '/proxy/lighter' : 'https://mainnet.zklighter.elliot.ai',
  nado: DEV ? '/proxy/nado' : 'https://api.prod.nado.xyz',
  ensemble: DEV ? '/proxy/ensemble' : 'https://ensemble-api.open-meteo.com',
  metar: DEV ? '/proxy/metar' : 'https://aviationweather.gov',
  synoptic: DEV ? '/proxy/synoptic' : 'https://api.synopticdata.com',
  gov: DEV ? '/proxy/gov' : 'https://www.weather.gov',
  iowa: DEV ? '/proxy/iowa' : 'https://mesonet.agron.iastate.edu',
  clob: DEV ? '/proxy/clob' : 'https://clob.polymarket.com',
} as const

export const UA = 'Mozilla/5.0 (compatible; StaRKLiveTerminal/1.0)'
