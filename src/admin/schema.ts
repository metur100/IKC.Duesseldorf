// Opis svakog tipa bloka za editor: naziv, kratko objašnjenje, polja i prazan blok.
// Forma za uređivanje se pravi automatski iz liste polja (fields.tsx).
import type { Block, BlockType, LRich, LText } from '../cms/types'

export type Field =
  | { kind: 'ltext'; key: string; label: string; hint?: string }
  | { kind: 'ltextarea'; key: string; label: string; hint?: string }
  | { kind: 'rich'; key: string; label: string }
  | { kind: 'text'; key: string; label: string; hint?: string }
  | { kind: 'number'; key: string; label: string }
  | { kind: 'image'; key: string; label: string }
  | { kind: 'href'; key: string; label: string; hint?: string }
  | { kind: 'bool'; key: string; label: string; hint?: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'buttons'; key: string; label: string }
  | { kind: 'ltextList'; key: string; label: string; itemLabel: string }
  | { kind: 'items'; key: string; label: string; itemLabel: string; fields: Field[]; create: () => Record<string, unknown>; summary: (item: never) => string }

export const L = (bs = '', de = ''): LText => ({ bs, de })
export const emptyRich = (): LRich => ({ bs: { type: 'doc', content: [] }, de: { type: 'doc', content: [] } })
export const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const tone: Field = {
  kind: 'select', key: 'tone', label: 'Pozadina sekcije',
  options: [{ value: 'default', label: 'Svijetla (standard)' }, { value: 'light', label: 'Krem' }, { value: 'dark', label: 'Tamno zelena' }],
}
const eyebrow: Field = { kind: 'ltext', key: 'eyebrow', label: 'Nadnaslov', hint: 'Mali tekst iznad naslova (opcionalno)' }
const title: Field = { kind: 'ltext', key: 'title', label: 'Naslov' }
const intro: Field = { kind: 'ltextarea', key: 'intro', label: 'Uvodni tekst' }

export interface BlockDef {
  type: BlockType
  label: string
  description: string
  group: 'Tekst' | 'Mediji' | 'Liste' | 'Posebno'
  fields: Field[]
  create: () => Block
}

const defs: BlockDef[] = [
  {
    type: 'text', label: 'Tekst', group: 'Tekst',
    description: 'Naslov i formatirani tekst: paragrafi, podnaslovi, liste, linkovi.',
    fields: [eyebrow, title, { kind: 'rich', key: 'body', label: 'Tekst' }, { kind: 'select', key: 'align', label: 'Poravnanje', options: [{ value: 'left', label: 'Lijevo' }, { value: 'center', label: 'Centrirano' }] }, tone],
    create: () => ({ id: newId(), type: 'text', eyebrow: L(), title: L(), body: emptyRich(), align: 'left' }),
  },
  {
    type: 'imageText', label: 'Slika i tekst', group: 'Mediji',
    description: 'Slika pored teksta, sa dugmadima. Na mobitelu slika ide iznad teksta.',
    fields: [
      { kind: 'image', key: 'image', label: 'Slika' }, { kind: 'ltext', key: 'alt', label: 'Opis slike', hint: 'Za slijepe i Google' },
      eyebrow, title, { kind: 'rich', key: 'body', label: 'Tekst' },
      { kind: 'select', key: 'imageSide', label: 'Slika je', options: [{ value: 'left', label: 'Lijevo' }, { value: 'right', label: 'Desno' }] },
      { kind: 'buttons', key: 'buttons', label: 'Dugmad' }, tone,
    ],
    create: () => ({ id: newId(), type: 'imageText', image: '', alt: L(), eyebrow: L(), title: L(), body: emptyRich(), imageSide: 'left', buttons: [] }),
  },
  {
    type: 'image', label: 'Slika', group: 'Mediji',
    description: 'Jedna velika slika sa opisom.',
    fields: [
      { kind: 'image', key: 'image', label: 'Slika' }, { kind: 'ltext', key: 'alt', label: 'Opis slike', hint: 'Za slijepe i Google' },
      { kind: 'ltext', key: 'caption', label: 'Tekst ispod slike' },
      { kind: 'select', key: 'size', label: 'Širina', options: [{ value: 'normal', label: 'Normalna' }, { value: 'wide', label: 'Široka' }] }, tone,
    ],
    create: () => ({ id: newId(), type: 'image', image: '', alt: L(), caption: L(), size: 'normal' }),
  },
  {
    type: 'gallery', label: 'Galerija', group: 'Mediji',
    description: 'Mreža fotografija; klik otvara sliku preko cijelog ekrana.',
    fields: [title, {
      kind: 'items', key: 'images', label: 'Fotografije', itemLabel: 'fotografiju',
      fields: [{ kind: 'image', key: 'image', label: 'Slika' }, { kind: 'ltext', key: 'alt', label: 'Opis' }],
      create: () => ({ image: '', alt: L() }),
      summary: (item: { alt: LText }) => item.alt.bs,
    }, tone],
    create: () => ({ id: newId(), type: 'gallery', title: L(), images: [] }),
  },
  {
    type: 'hero', label: 'Velika naslovna', group: 'Posebno',
    description: 'Velika fotografija preko cijelog ekrana sa naslovom, dugmadima i karticom sljedećeg namaza.',
    fields: [
      { kind: 'image', key: 'image', label: 'Pozadinska slika' }, eyebrow, title,
      { kind: 'ltextarea', key: 'text', label: 'Tekst' }, { kind: 'buttons', key: 'buttons', label: 'Dugmad' },
      { kind: 'bool', key: 'showPrayer', label: 'Prikaži karticu vaktije', hint: 'Sljedeći namaz sa odbrojavanjem' },
    ],
    create: () => ({ id: newId(), type: 'hero', eyebrow: L(), title: L(), text: L(), image: '', buttons: [], showPrayer: false }),
  },
  {
    type: 'cards', label: 'Kartice', group: 'Liste',
    description: 'Mreža kartica sa slikom, naslovom i tekstom; svaka može voditi na stranicu.',
    fields: [eyebrow, title, intro, {
      kind: 'items', key: 'items', label: 'Kartice', itemLabel: 'karticu',
      fields: [{ kind: 'image', key: 'image', label: 'Slika (opcionalno)' }, { kind: 'ltext', key: 'title', label: 'Naslov' }, { kind: 'ltextarea', key: 'text', label: 'Tekst' }, { kind: 'href', key: 'href', label: 'Link' }],
      create: () => ({ title: L(), text: L(), image: '', href: '' }),
      summary: (item: { title: LText }) => item.title.bs,
    }, tone],
    create: () => ({ id: newId(), type: 'cards', eyebrow: L(), title: L(), intro: L(), items: [] }),
  },
  {
    type: 'list', label: 'Lista', group: 'Liste',
    description: 'Lista stavki sa oznakama ili brojevima.',
    fields: [eyebrow, title, intro, { kind: 'ltextList', key: 'items', label: 'Stavke', itemLabel: 'stavku' },
      { kind: 'select', key: 'style', label: 'Izgled', options: [{ value: 'bullets', label: 'Oznake' }, { value: 'numbers', label: 'Brojevi' }] }, tone],
    create: () => ({ id: newId(), type: 'list', eyebrow: L(), title: L(), intro: L(), items: [], style: 'bullets' }),
  },
  {
    type: 'info', label: 'Podaci (naziv: vrijednost)', group: 'Liste',
    description: 'Redovi kao "Telefon: 0211 …" — za kontakte, bankovne podatke, termine.',
    fields: [title, {
      kind: 'items', key: 'items', label: 'Redovi', itemLabel: 'red',
      fields: [{ kind: 'ltext', key: 'label', label: 'Naziv' }, { kind: 'ltext', key: 'value', label: 'Vrijednost' }, { kind: 'href', key: 'href', label: 'Link (opcionalno)', hint: 'npr. tel:+49211…, mailto:…, /stranica' }],
      create: () => ({ label: L(), value: L(), href: '' }),
      summary: (item: { label: LText; value: LText }) => `${item.label.bs}: ${item.value.bs}`,
    }, tone],
    create: () => ({ id: newId(), type: 'info', title: L(), items: [] }),
  },
  {
    type: 'faq', label: 'Pitanja i odgovori', group: 'Liste',
    description: 'Pitanja koja se otvaraju klikom.',
    fields: [title, {
      kind: 'items', key: 'items', label: 'Pitanja', itemLabel: 'pitanje',
      fields: [{ kind: 'ltext', key: 'q', label: 'Pitanje' }, { kind: 'rich', key: 'a', label: 'Odgovor' }],
      create: () => ({ q: L(), a: emptyRich() }),
      summary: (item: { q: LText }) => item.q.bs,
    }, tone],
    create: () => ({ id: newId(), type: 'faq', title: L(), items: [] }),
  },
  {
    type: 'people', label: 'Osobe', group: 'Liste',
    description: 'Ljudi sa fotografijom i funkcijom (odbor, muallimi…). Bez slike se prikažu inicijali.',
    fields: [title, intro, {
      kind: 'items', key: 'items', label: 'Osobe', itemLabel: 'osobu',
      fields: [{ kind: 'text', key: 'name', label: 'Ime i prezime' }, { kind: 'ltext', key: 'role', label: 'Funkcija' }, { kind: 'image', key: 'image', label: 'Fotografija' }],
      create: () => ({ name: '', role: L(), image: '' }),
      summary: (item: { name: string }) => item.name,
    }, tone],
    create: () => ({ id: newId(), type: 'people', title: L(), intro: L(), items: [] }),
  },
  {
    type: 'timeline', label: 'Hronologija', group: 'Liste',
    description: 'Datumi i događaji jedan ispod drugog (npr. historijat).',
    fields: [title, {
      kind: 'items', key: 'items', label: 'Događaji', itemLabel: 'događaj',
      fields: [{ kind: 'text', key: 'date', label: 'Datum / godina' }, { kind: 'ltextarea', key: 'text', label: 'Tekst' }],
      create: () => ({ date: '', text: L() }),
      summary: (item: { date: string }) => item.date,
    }, tone],
    create: () => ({ id: newId(), type: 'timeline', title: L(), items: [] }),
  },
  {
    type: 'stats', label: 'Brojke', group: 'Liste',
    description: 'Velike brojke sa opisom (npr. 425 članova).',
    fields: [title, {
      kind: 'items', key: 'items', label: 'Brojke', itemLabel: 'brojku',
      fields: [{ kind: 'text', key: 'value', label: 'Broj' }, { kind: 'ltext', key: 'label', label: 'Opis' }],
      create: () => ({ value: '', label: L() }),
      summary: (item: { value: string; label: LText }) => `${item.value} ${item.label.bs}`,
    }, tone],
    create: () => ({ id: newId(), type: 'stats', title: L(), items: [] }),
  },
  {
    type: 'quote', label: 'Citat', group: 'Tekst',
    description: 'Ajet, hadis ili citat, opcionalno i na arapskom.',
    fields: [{ kind: 'text', key: 'arabic', label: 'Arapski tekst (opcionalno)' }, { kind: 'ltextarea', key: 'text', label: 'Citat' }, { kind: 'ltext', key: 'source', label: 'Izvor' }, tone],
    create: () => ({ id: newId(), type: 'quote', arabic: '', text: L(), source: L(), tone: 'dark' }),
  },
  {
    type: 'cta', label: 'Poziv na akciju', group: 'Tekst',
    description: 'Istaknuti okvir sa naslovom i dugmadima (npr. "Postani član").',
    fields: [title, { kind: 'ltextarea', key: 'text', label: 'Tekst' }, { kind: 'buttons', key: 'buttons', label: 'Dugmad' }, tone],
    create: () => ({ id: newId(), type: 'cta', title: L(), text: L(), buttons: [] }),
  },
  {
    type: 'prayerTimes', label: 'Vaktija', group: 'Posebno',
    description: 'Današnja namaska vremena sa odbrojavanjem, opcionalno i tabela za cijeli mjesec.',
    fields: [title, intro, { kind: 'select', key: 'variant', label: 'Prikaz', options: [{ value: 'today', label: 'Samo danas' }, { value: 'month', label: 'Danas i cijeli mjesec' }] }, tone],
    create: () => ({ id: newId(), type: 'prayerTimes', title: L('Vaktija', 'Gebetszeiten'), intro: L(), variant: 'today' }),
  },
  {
    type: 'membershipForm', label: 'Obrazac za članstvo', group: 'Posebno',
    description: 'Online prijava za članstvo. Prijave stižu u admin pod "Prijave".',
    fields: [title, intro, tone],
    create: () => ({ id: newId(), type: 'membershipForm', title: L('Online prijava za članstvo', 'Online-Mitgliedsantrag'), intro: L() }),
  },
  {
    type: 'map', label: 'Mapa', group: 'Posebno',
    description: 'Mapa sa lokacijom džemata.',
    fields: [title, { kind: 'text', key: 'address', label: 'Adresa' }, { kind: 'number', key: 'lat', label: 'Geografska širina (lat)' }, { kind: 'number', key: 'lng', label: 'Geografska dužina (lng)' }, tone],
    create: () => ({ id: newId(), type: 'map', title: L(), address: 'Niederstraße 1, 40223 Düsseldorf', lat: 51.20802, lng: 6.76696 }),
  },
]

export const BLOCKS: Record<BlockType, BlockDef> = Object.fromEntries(defs.map((d) => [d.type, d])) as Record<BlockType, BlockDef>
export const BLOCK_LIST = defs

/** Kratak opis bloka za listu u editoru. */
export function blockSummary(block: Block): string {
  const b = block as unknown as Record<string, unknown>
  for (const key of ['title', 'text', 'caption', 'address']) {
    const v = b[key]
    if (typeof v === 'string' && v) return v
    if (v && typeof v === 'object' && 'bs' in v) {
      const text = (v as LText).bs || (v as LText).de
      if (text) return text
    }
  }
  if (block.type === 'text' || block.type === 'imageText') {
    const first = JSON.stringify(block.body.bs).match(/"text":"([^"]{1,80})/)
    if (first) return first[1]
  }
  if ('items' in block && Array.isArray(block.items)) return `${block.items.length} stavki`
  if (block.type === 'gallery') return `${block.images.length} slika`
  return ''
}
