import sharp from 'sharp'
import fs from 'node:fs'
import { markSvg } from './mark.mjs'
// Upotreba: npm i sharp && node brand/gen.mjs .   (iz korijena repozitorija)
const R = process.argv[2]
const G = '#0b4636', GOLD = '#c9a24a', CREAM = '#f7f1e3'
// shift up a bit so the mark is optically centered
const fix = (svg) => svg
const w = (p, s) => fs.writeFileSync(p, s)
const png = (svg, p, size) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(p)

const logo = fix(markSvg({ bowl: GOLD, sky: G, size: 512 }))
const logoLight = fix(markSvg({ bowl: GOLD, sky: CREAM, size: 512 }))
const appIcon = fix(markSvg({ bowl: GOLD, sky: CREAM, bg: G, pad: 115, size: 1024 }))
const favicon = fix(markSvg({ bowl: GOLD, sky: CREAM, bg: G, pad: 70, radius: 150, size: 64 }))
const adaptive = fix(markSvg({ bowl: GOLD, sky: CREAM, pad: 330, size: 1024 }))
w(`${R}/public/brand/logo.svg`, logo)
w(`${R}/public/brand/logo-light.svg`, logoLight)
w(`${R}/public/favicon.svg`, favicon)
w(`${R}/brand/logo.svg`, logo); w(`${R}/brand/logo-light.svg`, logoLight); w(`${R}/brand/app-icon.svg`, appIcon)
await png(appIcon, `${R}/public/icon-512.png`, 512)
await png(appIcon, `${R}/public/icon-192.png`, 192)
await png(appIcon, `${R}/public/apple-touch-icon.png`, 180)
await png(logo, `${R}/public/logo.png`, 512)
fs.mkdirSync(`${R}/brand/app`, { recursive: true })
await png(appIcon, `${R}/brand/app/icon.png`, 1024)
await png(adaptive, `${R}/brand/app/adaptive-icon.png`, 1024)
await png(fix(markSvg({ bowl: GOLD, sky: CREAM, size: 1024 })), `${R}/brand/app/splash-icon.png`, 1024)
await png(fix(markSvg({ bowl: '#ffffff', sky: '#ffffff', pad: 330, size: 1024 })), `${R}/brand/app/notification-icon.png`, 96)

// OG image: mosque photo, green overlay, mark + name
const photo = await sharp(`${R}/public/images/mesdzid.jpg`).resize(1200, 630, { fit: 'cover' }).toBuffer()
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
 <rect width="1200" height="630" fill="${G}" opacity="0.86"/>
 <text x="600" y="455" text-anchor="middle" font-family="Georgia, serif" font-size="68" font-weight="700" fill="${CREAM}">IKC Düsseldorf</text>
 <text x="600" y="515" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" letter-spacing="4" fill="${GOLD}">ISLAMSKI KULTURNI CENTAR · SEIT 1983</text>
</svg>`
const mark = await sharp(Buffer.from(logoLight)).resize(300, 300).png().toBuffer()
await sharp(photo).composite([{ input: Buffer.from(overlay) }, { input: mark, top: 70, left: 450 }]).jpeg({ quality: 84 }).toFile(`${R}/public/og-image.jpg`)

console.log('ok')
