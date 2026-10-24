// Model sadržaja (CMS). Isti oblik koriste web stranica, admin panel, backend (čuva JSON)
// i mobilna aplikacija (mobile/src/cms/types.ts je kopija ovog fajla).
//
// Stranica = lista blokova. Svaki tekst postoji na oba jezika ({ bs, de }).
// Formatirani tekst (RichDoc) je ProseMirror/TipTap JSON: doc > paragraph | heading | bulletList | orderedList | blockquote,
// a tekst može imati oznake bold, italic, link.

export type Lang = 'bs' | 'de'
export const LANGS: Lang[] = ['bs', 'de']

export type LText = Record<Lang, string>

export interface RichMark {
  type: 'bold' | 'italic' | 'link' | string
  attrs?: { href?: string; [key: string]: unknown }
}

export interface RichNode {
  type: string
  attrs?: { level?: number; [key: string]: unknown }
  marks?: RichMark[]
  text?: string
  content?: RichNode[]
}

/** Uvijek { type: 'doc', content: [...] } */
export type RichDoc = RichNode
export type LRich = Record<Lang, RichDoc>

export interface Button {
  label: LText
  /** Interni link ("/clanstvo") ili vanjski ("https://...", "tel:...", "mailto:...") */
  href: string
  style?: 'primary' | 'secondary'
}

/** URL slike: apsolutni (ImgBB) ili relativan od korijena stranice ("/images/imam.jpg"). */
export type ImageUrl = string

export type Tone = 'default' | 'light' | 'dark'

interface BlockBase {
  id: string
  /** Sakriven blok se ne prikazuje posjetiocima. */
  hidden?: boolean
  /** Pozadina sekcije. */
  tone?: Tone
}

export interface HeroBlock extends BlockBase {
  type: 'hero'
  eyebrow: LText
  title: LText
  text: LText
  image: ImageUrl
  buttons: Button[]
  /** Prikaži karticu sa sljedećim namazom u heroju. */
  showPrayer: boolean
}

export interface TextBlock extends BlockBase {
  type: 'text'
  eyebrow: LText
  title: LText
  body: LRich
  align: 'left' | 'center'
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  image: ImageUrl
  alt: LText
  caption: LText
  size: 'normal' | 'wide'
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  image: ImageUrl
  alt: LText
  eyebrow: LText
  title: LText
  body: LRich
  imageSide: 'left' | 'right'
  buttons: Button[]
}

export interface CardsBlock extends BlockBase {
  type: 'cards'
  eyebrow: LText
  title: LText
  intro: LText
  items: { title: LText; text: LText; image: ImageUrl; href: string }[]
}

export interface ListBlock extends BlockBase {
  type: 'list'
  eyebrow: LText
  title: LText
  intro: LText
  items: LText[]
  style: 'bullets' | 'numbers'
}

export interface StatsBlock extends BlockBase {
  type: 'stats'
  title: LText
  items: { value: string; label: LText }[]
}

export interface TimelineBlock extends BlockBase {
  type: 'timeline'
  title: LText
  items: { date: string; text: LText }[]
}

export interface FaqBlock extends BlockBase {
  type: 'faq'
  title: LText
  items: { q: LText; a: LRich }[]
}

export interface PeopleBlock extends BlockBase {
  type: 'people'
  title: LText
  intro: LText
  items: { name: string; role: LText; image: ImageUrl }[]
}

export interface GalleryBlock extends BlockBase {
  type: 'gallery'
  title: LText
  images: { image: ImageUrl; alt: LText }[]
}

export interface QuoteBlock extends BlockBase {
  type: 'quote'
  arabic: string
  text: LText
  source: LText
}

export interface CtaBlock extends BlockBase {
  type: 'cta'
  title: LText
  text: LText
  buttons: Button[]
}

/** Redovi "naziv: vrijednost", npr. bankovni podaci ili kontakti. */
export interface InfoBlock extends BlockBase {
  type: 'info'
  title: LText
  items: { label: LText; value: LText; href: string }[]
}

export interface PrayerTimesBlock extends BlockBase {
  type: 'prayerTimes'
  title: LText
  intro: LText
  /** today: današnja vremena + odbrojavanje; month: i tabela za cijeli mjesec */
  variant: 'today' | 'month'
}

export interface MembershipFormBlock extends BlockBase {
  type: 'membershipForm'
  title: LText
  intro: LText
}

export interface MapBlock extends BlockBase {
  type: 'map'
  title: LText
  address: string
  lat: number
  lng: number
}

export type Block =
  | HeroBlock
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | CardsBlock
  | ListBlock
  | StatsBlock
  | TimelineBlock
  | FaqBlock
  | PeopleBlock
  | GalleryBlock
  | QuoteBlock
  | CtaBlock
  | InfoBlock
  | PrayerTimesBlock
  | MembershipFormBlock
  | MapBlock

export type BlockType = Block['type']

export interface Page {
  /** "home" je početna (/). Ostale: /{slug} */
  slug: string
  title: LText
  /** Opis za Google i dijeljenje linka. */
  description: LText
  /** Zaglavlje podstranice (početna ga ne prikazuje, ona ima hero blok). */
  header: { eyebrow: LText; intro: LText; image: ImageUrl }
  blocks: Block[]
  /** Nacrt: vidljiv samo adminima. */
  draft?: boolean
  updatedAt?: string
  updatedBy?: string | null
}

export interface NavItem {
  id: string
  label: LText
  /** Slug stranice, ili prazno ako je ovo samo grupa / vanjski link. */
  page: string
  href: string
  children: NavItem[]
}

export interface SiteSettings {
  siteName: string
  tagline: LText
  nav: NavItem[]
  /** Linkovi u footeru (npr. Impressum, Datenschutz). */
  footerLinks: { label: LText; page: string; href: string }[]
  footerText: LText
  contact: {
    org: string
    address: string
    phone: string
    email: string
    lat: number
    lng: number
  }
  jumuah: { time: string; note: LText }
  /** Traka na vrhu stranice (obavještenje). */
  announcement: { enabled: boolean; text: LText; href: string }
  social: { label: string; href: string }[]
}

export interface SiteContent {
  settings: SiteSettings
  pages: Page[]
}

export const pagePath = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)

// ── Vaktija (GET /api/vaktija/dusseldorf) ────────────────────────────────────

export interface PrayerDay {
  day: number
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

export interface VaktijaResponse {
  location: string
  /** Datum za koji važi "today" (yyyy-MM-dd, Europe/Berlin) */
  date: string
  gregorian: LText
  hijri: LText
  today: PrayerDay
  /** Sutra (ako je u istom mjesecu), za odbrojavanje do sabaha poslije jacije. */
  tomorrow: PrayerDay | null
  /** Prvi dan mjeseca, yyyy-MM-dd */
  monthStart: string
  month: PrayerDay[]
  fetchedAt: string
  /** true ako vaktija.eu danas nije odgovorila i podaci su iz ranije preuzetog mjeseca. */
  stale: boolean
}

// ── Online prijava za članstvo (POST /api/membership) ────────────────────────

export interface MembershipApplication {
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  job: string
  street: string
  houseNumber: string
  zip: string
  city: string
  email: string
  /** Mobilni */
  phone: string
  /** Kućni broj (opcionalno) */
  homePhone: string
  spouse: string
  spouseBirthDate: string
  spouseJob: string
  children: string
  /** 'sepa' | 'transfer' | 'cash' */
  payMethod: string
  /** 'monthly' | 'halfyear' | 'yearly' */
  interval: string
  /** Iznos u eurima za odabrani interval (min. 20 mjesečno / 120 polugodišnje / 240 godišnje) */
  amount: number
  /** Samo za SEPA */
  accountHolder: string
  bank: string
  iban: string
  bic: string
  /** Saglasnost sa obradom podataka i Statutom (obavezno) */
  consentData: boolean
  /** SEPA mandat (obavezno ako je payMethod 'sepa') */
  consentSepa: boolean
  lang: Lang
}

/** Najmanji iznos članarine po intervalu (Pravilnik o članarini, § 3) i ponuđeni iznosi. */
export const MEMBERSHIP_FEES: Record<string, { min: number; options: number[] }> = {
  monthly: { min: 20, options: [20, 25] },
  halfyear: { min: 120, options: [120, 150] },
  yearly: { min: 240, options: [240, 300] },
}

/** Saglasnosti sa stare stranice (pravno relevantan tekst je njemački). */
export const MEMBERSHIP_CONSENT = {
  data: {
    bs: 'Saglasan/na sam da IKC Düsseldorf prikuplja, obrađuje i koristi gore navedene lične podatke za vođenje članstva. Potvrđujem tačnost svojih kontakt i bankovnih podataka i prihvatam Statut IGBD – Gemeinde IKC Düsseldorf e.V. kao obavezujući.',
    de: 'Ich bin mit der Erhebung, Verarbeitung und Nutzung der oben angegebenen personenbezogenen Daten durch den Verein zur Mitgliederverwaltung im Wege der elektronischen Datenverarbeitung einverstanden. Mir ist bekannt, dass dem Aufnahmeantrag ohne dieses Einverständnis nicht stattgegeben werden kann. Hiermit bestätige ich die Gültigkeit meiner Kontakt- und Kontodaten sowie die ausreichende Deckung des Kontos und erkenne die Satzung der IGBD – Gemeinde IKC Düsseldorf e.V. als verbindlich an.',
  },
  sepa: {
    bs: 'Ovlašćujem IGBD – Gemeinde IKC Düsseldorf e.V. (Gläubiger-ID: DE72ZZZ00002401363) da do opoziva naplaćuje članarinu sa mog računa putem SEPA direktnog zaduženja.',
    de: 'Hiermit ermächtige ich die IGBD – Gemeinde IKC Düsseldorf e.V. (Gläubiger-ID: DE72ZZZ00002401363) widerruflich, die von mir/uns zu entrichtenden Mitgliedsbeiträge bei Fälligkeit zu Lasten meines Kontos mittels Lastschrift einzuziehen.',
  },
}

export const PRAYER_KEYS =['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
export type PrayerKey = (typeof PRAYER_KEYS)[number]

export const PRAYER_NAMES: Record<Lang, Record<PrayerKey, string>> = {
  bs: { fajr: 'Zora', sunrise: 'Izlazak sunca', dhuhr: 'Podne', asr: 'Ikindija', maghrib: 'Akšam', isha: 'Jacija' },
  de: { fajr: 'Morgendämmerung', sunrise: 'Sonnenaufgang', dhuhr: 'Mittag', asr: 'Nachmittag', maghrib: 'Abend', isha: 'Nacht' },
}
