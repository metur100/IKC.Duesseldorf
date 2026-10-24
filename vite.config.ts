import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import site from './src/cms/site.json'
import { pagePath, type RichNode, type SiteContent } from './src/cms/types'

const DEFAULT_SITE_URL = 'https://metur100.github.io/IKC.Duesseldorf/'
const content = site as SiteContent

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const plainText = (node: RichNode | undefined): string =>
  !node ? '' : node.text ?? (node.content ?? []).map(plainText).join(node.type === 'doc' ? '\n' : ' ').trim()

/**
 * SEO for a client-rendered site on GitHub Pages. Pages come from the CMS (src/cms/site.json, refreshed from the
 * API before every build by scripts/fetch-content.mjs):
 * - fills absolute URLs (__SITE_URL__) in index.html
 * - writes a real index.html for every page with its own title, description, canonical and social tags,
 *   so every page is served with HTTP 200 instead of the 404.html fallback
 * - adds FAQPage structured data to /faq/, writes a noindex 404.html, sitemap.xml and robots.txt
 * Pages created in the admin panel after the build still work through the 404.html fallback until the next build.
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
      // Bez index.html je build već pao; ne sakrivaj pravu grešku.
      if (!isBuild || !fs.existsSync(path.join(outDir, 'index.html'))) return
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const pages = content.pages.filter((p) => !p.draft)
      const urlOf = (slug: string) => siteUrl + (slug === 'home' ? '' : `${slug}/`)
      const name = content.settings.siteName

      for (const page of pages) {
        const url = urlOf(page.slug)
        const title = escapeHtml(page.slug === 'home' ? `${name} — ${content.settings.tagline.bs}` : `${page.title.bs} | ${name}`)
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

        const faqItems = page.blocks.flatMap((b) => (b.type === 'faq' && !b.hidden ? b.items : []))
        if (faqItems.length) {
          const faq = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: 'bs',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.q.bs,
              acceptedAnswer: { '@type': 'Answer', text: plainText(item.a.bs) },
            })),
          }
          const json = JSON.stringify(faq).replace(/</g, '\\u003c')
          html = html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`)
        }
        const target = path.join(outDir, pagePath(page.slug), 'index.html')
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, html)
      }

      // SPA fallback for unknown URLs (and pages added after the build): status 404, must not be indexed.
      const notFound = template
        .replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex, follow"')
        .replace(/\s*<link rel="canonical" href="[^"]*" ?\/?>/, '')
      fs.writeFileSync(path.join(outDir, '404.html'), notFound)

      const today = new Date().toISOString().slice(0, 10)
      const legal = new Set(['impressum', 'datenschutz'])
      const urls = pages.map((p) =>
        ['  <url>', `    <loc>${urlOf(p.slug)}</loc>`, `    <lastmod>${(p.updatedAt ?? today).slice(0, 10)}</lastmod>`,
          `    <priority>${p.slug === 'home' ? '1.0' : legal.has(p.slug) ? '0.3' : '0.7'}</priority>`, '  </url>'].join('\n'),
      )
      const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n')
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap)
      fs.writeFileSync(path.join(outDir, 'robots.txt'), ['User-agent: *', 'Allow: /', 'Disallow: /admin', '', `Sitemap: ${siteUrl}sitemap.xml`, ''].join('\n'))
    },
  }
}

export default defineConfig({
  plugins: [react(), seoPages()],
  build: {
    rollupOptions: {
      output: {
        // Editor (TipTap/ProseMirror) i drag & drop idu samo u admin chunkove; sadržaj (site.json) u svoj chunk.
        // Svaki chunk ostaje ispod 1 MB (veće esbuild minifikuje preko privremenog fajla).
        manualChunks: (id) => {
          if (id.includes('prosemirror') || id.includes('orderedmap') || id.includes('rope-sequence') || id.includes('linkifyjs')) return 'admin-prosemirror'
          if (id.includes('@tiptap')) return 'admin-tiptap'
          if (id.includes('@dnd-kit')) return 'admin-dnd'
          if (id.endsWith('site.json')) return 'content'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
          return undefined
        },
      },
    },
  },
  server: {
    // Lokalno: /api (vaktija, sadržaj) ide na backend iz backend/IKC.Api (dotnet run).
    proxy: {
      '/api': 'http://localhost:5013',
    },
  },
})
