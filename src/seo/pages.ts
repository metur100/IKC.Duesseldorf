/**
 * SEO data for every page. Used in the browser (title/description while navigating) and at build
 * time (vite.config.ts writes a real index.html per route, plus sitemap.xml and robots.txt).
 * Bosnian is the primary language of the site; German texts are used when the visitor switches.
 */
export type SeoLang = 'bs' | 'de'

export interface PageSeo {
  path: string
  title: Record<SeoLang, string>
  description: Record<SeoLang, string>
  /** Sitemap priority. */
  priority: number
}

export const SITE_NAME = 'IKC Düsseldorf'

export const PAGES: PageSeo[] = [
  {
    path: '/',
    priority: 1,
    title: {
      bs: 'IKC Düsseldorf — Islamski kulturni centar | Bošnjački džemat u Düsseldorfu',
      de: 'IKC Düsseldorf — Islamisches Kulturzentrum | Bosniakische Moschee in Düsseldorf',
    },
    description: {
      bs: 'IGBD – Gemeinde IKC Düsseldorf e.V.: bošnjački džemat i islamski kulturni centar u Düsseldorfu od 1983. Vaktija, džuma-namaz u 14:00, mekteb, predavanja i članstvo.',
      de: 'IGBD – Gemeinde IKC Düsseldorf e.V.: bosniakische Moschee und islamisches Kulturzentrum in Düsseldorf seit 1983. Gebetszeiten, Freitagsgebet um 14 Uhr, Mekteb, Vorträge und Mitgliedschaft.',
    },
  },
  {
    path: '/o-nama/',
    priority: 0.8,
    title: { bs: 'O nama — historijat džemata od 1983.', de: 'Über uns — Geschichte der Gemeinde seit 1983' },
    description: {
      bs: 'Historijat IKC Düsseldorf od osnivanja 1983. do danas — priča o zajedništvu i požrtvovanju bošnjačke zajednice u Düsseldorfu.',
      de: 'Die Geschichte des IKC Düsseldorf von der Gründung 1983 bis heute — Zusammenhalt der bosniakischen Gemeinde in Düsseldorf.',
    },
  },
  {
    path: '/aktivnosti/',
    priority: 0.8,
    title: { bs: 'Aktivnosti i predavanja', de: 'Aktivitäten und Vorträge' },
    description: {
      bs: 'Redovna sedmična predavanja, hutbe i predavanja za omladinu, žene i roditelje u IKC Düsseldorf.',
      de: 'Wöchentliche Vorträge, Hutbas sowie Vorträge für Jugendliche, Frauen und Eltern im IKC Düsseldorf.',
    },
  },
  {
    path: '/za-malisane/',
    priority: 0.8,
    title: { bs: 'Za mališane — mekteb i učenje Kur’ana', de: 'Für Kinder — Mekteb und Koranunterricht' },
    description: {
      bs: 'Mekteb u 10 grupa, učenje Kur’ana, radionice i edukativni izleti za djecu u IKC Düsseldorf. Upis od 4. godine.',
      de: 'Mekteb in 10 Gruppen, Koranunterricht, Workshops und Bildungsausflüge für Kinder im IKC Düsseldorf. Anmeldung ab 4 Jahren.',
    },
  },
  {
    path: '/druge-usluge/',
    priority: 0.7,
    title: { bs: 'Druge usluge — vjenčanja, akike, dženaze', de: 'Weitere Dienste — Trauungen, Aqiqa, Beerdigungen' },
    description: {
      bs: 'Šerijatska vjenčanja, akike, dženaze, dušebrižništvo i posjete džematlijama — usluge IKC Düsseldorf.',
      de: 'Islamische Eheschließungen, Aqiqa, Beerdigungen, Seelsorge und Hausbesuche — Dienste des IKC Düsseldorf.',
    },
  },
  {
    path: '/okupljanja/',
    priority: 0.6,
    title: { bs: 'Okupljanja i druženja', de: 'Zusammenkünfte und Begegnungen' },
    description: {
      bs: 'Zajednički namazi, druženja poslije džume i sabaha te radionice za omladinu i žene u IKC Düsseldorf.',
      de: 'Gemeinsame Gebete, Begegnungen nach dem Freitags- und Morgengebet sowie Workshops für Jugend und Frauen.',
    },
  },
  {
    path: '/imam/',
    priority: 0.6,
    title: { bs: 'Imam džemata', de: 'Imam der Gemeinde' },
    description: {
      bs: 'Upoznajte imama IKC Düsseldorf — vođstvo džemata, kontakt i vjerske usluge.',
      de: 'Lernen Sie den Imam des IKC Düsseldorf kennen — Leitung der Gemeinde, Kontakt und religiöse Dienste.',
    },
  },
  {
    path: '/odbor/',
    priority: 0.5,
    title: { bs: 'Odbori i vijeća', de: 'Vorstand und Räte' },
    description: {
      bs: 'Izvršni odbor, nadzorni odbor i vijeće roditelja IKC Düsseldorf — organizacija džemata.',
      de: 'Vorstand, Aufsichtsrat und Elternrat des IKC Düsseldorf — Organisation der Gemeinde.',
    },
  },
  {
    path: '/clanarina/',
    priority: 0.8,
    title: { bs: 'Postani član — zahtjev za članstvo', de: 'Mitglied werden — Mitgliedsantrag' },
    description: {
      bs: 'Pridružite se IKC Düsseldorf: zahtjev za članstvo online, članarina (vazifa) i podaci za uplatu. Jedna porodica — jedan član.',
      de: 'Werden Sie Mitglied im IKC Düsseldorf: Mitgliedsantrag online, Mitgliedsbeitrag und Bankverbindung. Eine Familie — ein Mitglied.',
    },
  },
  {
    path: '/faq/',
    priority: 0.7,
    title: { bs: 'Često postavljena pitanja', de: 'Häufig gestellte Fragen' },
    description: {
      bs: 'Odgovori o članstvu, uplatama, radnom vremenu, dženazi i upisu u mekteb u IKC Düsseldorf.',
      de: 'Antworten zu Mitgliedschaft, Zahlungen, Öffnungszeiten, Beerdigungen und Mekteb-Anmeldung im IKC Düsseldorf.',
    },
  },
  {
    path: '/kontakt/',
    priority: 0.8,
    title: { bs: 'Kontakt i Impressum — Niederstraße 1, Düsseldorf', de: 'Kontakt und Impressum — Niederstraße 1, Düsseldorf' },
    description: {
      bs: 'Adresa: Niederstraße 1, 40223 Düsseldorf. Telefon 0211 9304619, e-mail duesseldorf@igbd.org. Kontakt imama i predsjednika, Impressum.',
      de: 'Adresse: Niederstraße 1, 40223 Düsseldorf. Telefon 0211 9304619, E-Mail duesseldorf@igbd.org. Kontakt zu Imam und Vorstand, Impressum.',
    },
  },
]

/** Page data for a router pathname (with or without trailing slash). */
export function pageFor(pathname: string): PageSeo {
  const normalized = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}/`
  return PAGES.find((p) => p.path === normalized) ?? PAGES[0]
}

/** "Page — IKC Düsseldorf" for subpages; the home title stands alone. */
export function fullTitle(page: PageSeo, lang: SeoLang): string {
  return page.path === '/' ? page.title[lang] : `${page.title[lang]} | ${SITE_NAME}`
}
