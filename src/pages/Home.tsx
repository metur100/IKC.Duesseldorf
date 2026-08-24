import { Link } from 'react-router-dom'
import { BookOpen, Baby, Handshake, Building2, Users, UserPlus } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { Section } from '../components/UI'

export default function Home() {
  const { lang } = useLang()
  const t = content[lang]
  const h = t.home
  const isBs = lang === 'bs'
  const cardIcons = {
    '/aktivnosti': BookOpen,
    '/za-malisane': Baby,
    '/druge-usluge': Handshake,
    '/okupljanja': Users,
    '/o-nama': Building2,
    '/clanarina': UserPlus
  } as const

  const quickBlocks = isBs
    ? [
        {
          title: 'Džemat na prvi pogled',
          text: '425 članova/porodica, mekteb u 10 grupa i džuma-namaz petkom u 14:00 na adresi Niederstraße 1, 40223 Düsseldorf.'
        },
        {
          title: 'Kako funkcioniše članstvo',
          text: 'Džemat egzistira na principu članstva i finansira se isključivo članarinama džematlija. Jedna porodica, jedan član.'
        },
        {
          title: 'Otvorenost i termini',
          text: 'Džemat je otvoren svakim danom osim ponedjeljka i utorka, posebno pred namaze, tokom predavanja i kurseva.'
        },
        {
          title: 'Organizacija i transparentnost',
          text: 'Rad džemata vode imam, izvršni i nadzorni odbor uz uključeno roditeljsko vijeće i aktivnu omladinu.'
        }
      ]
    : [
        {
          title: 'Gemeinde im Überblick',
          text: '425 Mitglieder/Familien, Mekteb in 10 Gruppen und Freitagsgebet um 14:00 Uhr in der Niederstraße 1, 40223 Düsseldorf.'
        },
        {
          title: 'Wie Mitgliedschaft funktioniert',
          text: 'Die Gemeinde basiert auf Mitgliedschaft und finanziert sich ausschließlich durch Mitgliedsbeiträge. Eine Familie, ein Mitglied.'
        },
        {
          title: 'Öffnungszeiten und Termine',
          text: 'Die Gemeinde ist täglich außer Montag und Dienstag geöffnet, besonders vor den Gebeten sowie während Vorträgen und Kursen.'
        },
        {
          title: 'Organisation und Transparenz',
          text: 'Die Arbeit der Gemeinde wird durch Imam, Vorstand und Aufsichtsrat mit aktivem Elternrat und Jugend getragen.'
        }
      ]

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="arabic">{h.arabic}</p>
            <span className="eyebrow" style={{ color: 'var(--gold-light)' }}>IGBD · Düsseldorf · 1983</span>
            <h1>{h.title}</h1>
            <p className="lead">{h.lead}</p>
            <div className="hero-actions">
              <Link to="/clanarina" className="btn btn-primary">{h.ctaMember}</Link>
              <Link to="/o-nama" className="btn btn-ghost">{h.ctaAbout}</Link>
            </div>
            <div className="hero-quote">
              <p>{h.quote}</p>
              <cite>{h.quoteSrc}</cite>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="section-head">
          <span className="eyebrow">{isBs ? 'Kalendar i termini' : 'Kalender und Termine'}</span>
          <h2>{isBs ? 'Vaktija za Düsseldorf' : 'Gebetszeiten für Düsseldorf'}</h2>
          <p>
            {isBs
              ? 'Aktuelna dnevna namaska vremena možete pratiti direktno kroz Vaktija.eu.'
              : 'Aktuelle tägliche Gebetszeiten können Sie direkt über Vaktija.eu verfolgen.'}
          </p>
        </div>
        <div className="vaktija-wrap">
          <div className="vaktija-crop">
            <iframe
              src="https://vaktija.eu/dusseldorf"
              title="Vaktija Düsseldorf"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="vaktija-frame"
            />
          </div>
          <div className="vaktija-note">
            {isBs ? 'Trebaš puni prikaz?' : 'Vollansicht benötigt?'}{' '}
            <a href="https://vaktija.eu/dusseldorf" target="_blank" rel="noreferrer">
              {isBs ? 'Otvori Vaktiju u novom tabu' : 'Vaktija in neuem Tab öffnen'}
            </a>
          </div>
        </div>
      </Section>

      <Section alt>
        <div className="section-head">
          <span className="eyebrow">{isBs ? 'Džemat' : 'Gemeinde'}</span>
          <h2>{isBs ? 'Kako izgleda naš rad u praksi' : 'Wie unsere Gemeindearbeit konkret aussieht'}</h2>
          <p>
            {isBs
              ? 'Ključne informacije koje članovima najčešće trebaju: članstvo, termini i organizacija rada džemata.'
              : 'Die wichtigsten Informationen für Mitglieder: Mitgliedschaft, Termine und Organisationsstruktur.'}
          </p>
        </div>
        <div className="quick-grid">
          {quickBlocks.map((block) => (
            <article className="quick-card" key={block.title}>
              <h3>{block.title}</h3>
              <p>{block.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="section-head">
          <span className="eyebrow">{h.statsTitle}</span>
        </div>
        <div className="stats">
          {h.stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section alt>
        <div className="section-head">
          <span className="eyebrow">{t.nav.dzemat}</span>
          <h2>{h.activitiesTitle}</h2>
          <p>{h.activitiesSub}</p>
        </div>
        <div className="cards">
          {h.cards.map((c, i) => (
            <Link to={c.to} className="card" key={i}>
              <div className="ico">
                {(() => {
                  const Icon = cardIcons[c.to as keyof typeof cardIcons] ?? BookOpen
                  return <Icon size={24} strokeWidth={2} aria-hidden="true" />
                })()}
              </div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="more">{t.common.readMore} →</span>
            </Link>
          ))}
        </div>
      </Section>

    </>
  )
}
