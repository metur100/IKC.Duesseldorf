// Prije builda preuzima aktuelni sadržaj sa backend-a (GET /api/content) i prepisuje src/i18n/content.json.
// Ako API nije dostupan ili vrati nepotpun sadržaj, ostaje fajl iz repozitorija i build normalno prolazi.
//
// Upotreba: API_URL=https://ikcduesseldorf.runasp.net node scripts/fetch-content.mjs
import fs from 'node:fs'

const target = new URL('../src/i18n/content.json', import.meta.url)
const apiUrl = process.env.API_URL?.replace(/\/$/, '')

if (!apiUrl) {
  console.log('API_URL nije postavljen, koristi se content.json iz repozitorija.')
  process.exit(0)
}

const local = JSON.parse(fs.readFileSync(target, 'utf8'))

try {
  const response = await fetch(`${apiUrl}/api/content`, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const remote = await response.json()

  // Svaki jezik mora imati sve sekcije koje stranica koristi.
  for (const lang of Object.keys(local)) {
    const missing = Object.keys(local[lang]).filter((key) => !(key in (remote[lang] ?? {})))
    if (missing.length) throw new Error(`nedostaju sekcije za ${lang}: ${missing.join(', ')}`)
  }

  fs.writeFileSync(target, JSON.stringify(remote, null, 2) + '\n')
  console.log(`Sadržaj preuzet sa ${apiUrl}.`)
} catch (error) {
  console.warn(`::warning::Sadržaj nije preuzet sa ${apiUrl} (${error.message}); koristi se content.json iz repozitorija.`)
}
