// Sav sadržaj sajta na dva jezika: bosanski (bs) i njemački (de).
// Sve informacije preuzete sa ikc-d.org.

export interface Content {
  nav: Record<string, string>
  common: Record<string, string>
  prayer: { sabah: string; sabahNote: string; dzuma: string }
  home: {
    arabic: string
    title: string
    lead: string
    ctaMember: string
    ctaAbout: string
    quote: string
    quoteSrc: string
    statsTitle: string
    stats: { num: string; lbl: string }[]
    activitiesTitle: string
    activitiesSub: string
    cards: { icon: string; title: string; text: string; to: string }[]
  }
  about: { title: string; eyebrow: string; intro: string; timeline: { year: string; text: string }[]; note: string }
  activities: { title: string; eyebrow: string; intro: string; lecturesTitle: string; lectures: string[]; note1: string; note2: string }
  kids: { title: string; eyebrow: string; intro: string; items: string[] }
  gatherings: { title: string; eyebrow: string; intro: string; items: string[] }
  services: { title: string; eyebrow: string; intro: string; items: string[] }
  imam: { title: string; eyebrow: string; name: string; bio: string[] }
  boards: { title: string; eyebrow: string; execIntro: string; supervisoryTitle: string; supervisory: string[]; parentTitle: string; parents: string[] }
  membership: { title: string; eyebrow: string; intro: string; bank: { label: string; value: string }[]; formTitle: string; fields: Record<string, string>; consent: string; submit: string; success: string; payMethods: string[]; intervals: string[] }
  faq: { title: string; eyebrow: string; items: { q: string; a: string }[] }
  contact: { title: string; eyebrow: string; addressTitle: string; org: string; address: string; repTitle: string; rep: string; phone: string; email: string; regTitle: string; reg1: string; reg2: string; imamContact: string; presContact: string }
  footer: { about: string; quickLinks: string; contact: string; rights: string }
}

// Tekstovi su u content.json. Admini ih uređuju preko backend-a (backend/), a GitHub Actions prije
// svakog builda preuzme aktuelni sadržaj sa API-ja i prepiše ovaj fajl (scripts/fetch-content.mjs).
// Fajl u repozitoriju služi kao početni sadržaj baze i kao rezerva ako API nije dostupan.
import data from './content.json'

export const content: Record<'bs' | 'de', Content> = data
