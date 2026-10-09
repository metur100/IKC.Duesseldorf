import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { content } from './src/i18n/content'
import { PAGES, fullTitle } from './src/seo/pages'

const DEFAULT_SITE_URL = 'https://metur100.github.io/IKC.Duesseldorf/'

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * SEO for a client-rendered site on GitHub Pages:
 * - fills absolute URLs (__SITE_URL__) in index.html
 * - writes a real index.html for every route with its own title, description, canonical and
 *   social tags, so every page is served with HTTP 200 instead of the 404.html fallback
 * - adds FAQPage structured data to /faq/, writes a noindex 404.html, sitemap.xml and robots.txt
 */
function seoPages(): Plugin {
  let siteUrl = DEFAULT_SITE_URL
  let outDir = 'dist'
  let isBuild = false
  return {
    name: 'ikc-seo-pages',
    configResolved(config) {
      isBuild = config.command === 'build'
      outDir = path.resolve(config.root, config.build.outDir)
      const fromBase = config.base && config.base !== '/' ? `https://metur100.github.io${config.base}` : DEFAULT_SITE_URL
      siteUrl = process.env.SITE_URL ?? (isBuild ? fromBase : `http://localhost:5173${config.base}`)
      if (!siteUrl.endsWith('/')) siteUrl += '/'
    },
    transformIndexHtml(html) {
      return html.replace(/__SITE_URL__/g, siteUrl)
    },
    closeBundle() {
      if (!isBuild) return
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const pageUrl = (pagePath: string) => siteUrl + pagePath.replace(/^\//, '')

      for (const page of PAGES) {
        const url = pageUrl(page.path)
        const title = escapeHtml(fullTitle(page, 'bs'))
        const description = escapeHtml(page.description.bs)
        let html = template
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`)
          .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
          .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
          .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
          .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
          .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
          .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`)
        if (page.path === '/faq/') {
          const faq = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: 'bs',
            mainEntity: content.bs.faq.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }
          const json = JSON.stringify(faq).replace(/</g, '\\u003c')
          html = html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`)
        }
        const target = path.join(outDir, page.path, 'index.html')
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, html)
      }

      // SPA fallback for unknown URLs: served by GitHub Pages with status 404 and must not be indexed.
      const notFound = template
        .replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex, follow"')
        .replace(/\s*<link rel="canonical" href="[^"]*" ?\/?>/, '')
      fs.writeFileSync(path.join(outDir, '404.html'), notFound)

      const today = new Date().toISOString().slice(0, 10)
      const urls = PAGES.map((p) =>
        ['  <url>', `    <loc>${pageUrl(p.path)}</loc>`, `    <lastmod>${today}</lastmod>`, `    <priority>${p.priority.toFixed(1)}</priority>`, '  </url>'].join('\n'),
      )
      const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n')
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap)
      fs.writeFileSync(path.join(outDir, 'robots.txt'), ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl}sitemap.xml`, ''].join('\n'))
    },
  }
}

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
    seoPages(),
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
