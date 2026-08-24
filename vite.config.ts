import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

async function fetchVaktijaDailyData(city: string, locale: string) {
  const cityPageUrl = `https://vaktija.eu/${city}`
  const cityPageResponse = await fetch(cityPageUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'IKC-Duesseldorf/1.0'
    }
  })

  if (!cityPageResponse.ok) {
    throw new Error(`Failed to load city page (${cityPageResponse.status})`)
  }

  const cityPageHtml = await cityPageResponse.text()
  const buildIdMatch = cityPageHtml.match(/"buildId":"([^"]+)"/)
  if (!buildIdMatch?.[1]) {
    throw new Error('Could not detect Vaktija build ID')
  }

  const buildId = buildIdMatch[1]
  const dataUrl = `https://vaktija.eu/_next/data/${buildId}/${locale}/${city}.json`

  const dataResponse = await fetch(dataUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'IKC-Duesseldorf/1.0'
    }
  })

  if (!dataResponse.ok) {
    throw new Error(`Failed to load Vaktija JSON (${dataResponse.status})`)
  }

  const payload = (await dataResponse.json()) as any
  return {
    pageProps: {
      dailyPrayersRes: payload?.pageProps?.dailyPrayersRes ?? null,
      todayGregorian: payload?.pageProps?.todayGregorian ?? null,
      todayHijri: payload?.pageProps?.todayHijri ?? null
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vaktija-dev-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/vaktija/dusseldorf')) {
            next()
            return
          }

          if ((req as any).method !== 'GET') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          try {
            const payload = await fetchVaktijaDailyData('dusseldorf', 'bs')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=120')
            res.end(JSON.stringify(payload))
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Vaktija proxy unavailable' }))
          }
        })
      }
    }
  ]
})
