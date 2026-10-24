// Kopira model sadržaja i snapshot sadržaja web stranice u mobilnu aplikaciju.
//   ../src/cms/types.ts  -> src/cms/types.ts
//   ../src/cms/site.json -> src/cms/site.json  (ugrađeni rezervni sadržaj, ako API nije dostupan)
// Ako izvorni fajl ne postoji (npr. na EAS serveru), postojeća kopija ostaje nepromijenjena.
import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, '..', 'src', 'cms')
const dst = resolve(root, 'src', 'cms')

let failed = false
for (const name of ['types.ts', 'site.json']) {
  const from = resolve(src, name)
  const to = resolve(dst, name)
  if (!existsSync(from)) {
    console.warn(`[sync-content] ${from} ne postoji - zadržavam postojeću kopiju.`)
    continue
  }
  if (name.endsWith('.json')) {
    try {
      const data = JSON.parse(readFileSync(from, 'utf8'))
      if (!data.settings || !Array.isArray(data.pages)) throw new Error('nedostaje settings/pages')
      if (!data.pages.some((p) => p.slug === 'home')) {
        console.warn(`[sync-content] ${from} još nema stranicu "home" - zadržavam postojeću kopiju.`)
        continue
      }
    } catch (e) {
      console.error(`[sync-content] ${from} nije ispravan SiteContent JSON: ${e.message}`)
      failed = true
      continue
    }
  }
  copyFileSync(from, to)
  console.log(`[sync-content] ${name} (${statSync(to).size} B)`)
}
if (failed) process.exit(1)
