// Prije builda preuzima aktuelni sadržaj sa backend-a (GET /api/site) i prepisuje src/cms/site.json,
// da statične stranice (naslovi, opisi, sitemap) i ugrađeni sadržaj odgovaraju onome iz admin panela.
// Ako API nije dostupan ili vrati nepotpun sadržaj, ostaje fajl iz repozitorija i build normalno prolazi.
//
// Upotreba: API_URL=https://ikcduesseldorf.runasp.net node scripts/fetch-content.mjs
import fs from 'node:fs'

const target = new URL('../src/cms/site.json', import.meta.url)
const apiUrl = process.env.API_URL?.replace(/\/$/, '')

if (!apiUrl) {
  console.log('API_URL nije postavljen, koristi se site.json iz repozitorija.')
  process.exit(0)
}

try {
  const response = await fetch(`${apiUrl}/api/site`, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const remote = await response.json()

  if (!Array.isArray(remote?.settings?.nav)) throw new Error('nedostaju postavke (settings.nav)')
  if (!remote.pages?.some((p) => p.slug === 'home')) throw new Error('nema početne stranice')

  fs.writeFileSync(target, JSON.stringify(remote, null, 1) + '\n')
  console.log(`Sadržaj preuzet sa ${apiUrl} (${remote.pages.length} stranica).`)
} catch (error) {
  console.warn(`::warning::Sadržaj nije preuzet sa ${apiUrl} (${error.message}); koristi se site.json iz repozitorija.`)
}
