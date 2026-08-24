import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

export default function About() {
  const { lang } = useLang()
  const t = content[lang].about
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <Section>
        <div className="prose">
          <div className="timeline">
            {t.timeline.map((it, i) => (
              <div className="tl-item" key={i}>
                <span className="tl-year">{it.year}</span>
                <p>{it.text}</p>
              </div>
            ))}
          </div>
          <div className="info-box"><p>{t.note}</p></div>
        </div>
      </Section>
    </>
  )
}
