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

export default defineConfig({
  plugins: [react(), seoPages()],
  server: {
    // Lokalno: /api (vaktija, sadržaj) ide na backend iz backend/IKC.Api (dotnet run).
    proxy: {
      '/api': 'http://localhost:5013',
    },
  },
})
