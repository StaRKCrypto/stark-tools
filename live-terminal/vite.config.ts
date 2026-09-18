import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

function proxy(target: string) {
  return {
    target,
    changeOrigin: true,
    secure: true,
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || '/stark-tools/live-terminal/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/proxy/gamma': {
        ...proxy('https://gamma-api.polymarket.com'),
        rewrite: (p) => p.replace(/^\/proxy\/gamma/, ''),
      },
      '/proxy/arcus': {
        ...proxy('https://api.arcus.xyz'),
        rewrite: (p) => p.replace(/^\/proxy\/arcus/, ''),
      },
      '/proxy/lighter': {
        ...proxy('https://mainnet.zklighter.elliot.ai'),
        rewrite: (p) => p.replace(/^\/proxy\/lighter/, ''),
      },
      '/proxy/nado': {
        ...proxy('https://api.prod.nado.xyz'),
        rewrite: (p) => p.replace(/^\/proxy\/nado/, ''),
      },
      '/proxy/ensemble': {
        ...proxy('https://ensemble-api.open-meteo.com'),
        rewrite: (p) => p.replace(/^\/proxy\/ensemble/, ''),
      },
      '/proxy/metar': {
        ...proxy('https://aviationweather.gov'),
        rewrite: (p) => p.replace(/^\/proxy\/metar/, ''),
      },
      '/proxy/synoptic': {
        ...proxy('https://api.synopticdata.com'),
        rewrite: (p) => p.replace(/^\/proxy\/synoptic/, ''),
      },
      '/proxy/gov': {
        ...proxy('https://www.weather.gov'),
        rewrite: (p) => p.replace(/^\/proxy\/gov/, ''),
      },
      '/proxy/iowa': {
        ...proxy('https://mesonet.agron.iastate.edu'),
        rewrite: (p) => p.replace(/^\/proxy\/iowa/, ''),
      },
      '/proxy/clob': {
        ...proxy('https://clob.polymarket.com'),
        rewrite: (p) => p.replace(/^\/proxy\/clob/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
