import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('')
}

export default function Boards() {
  const { lang } = useLang()
  const t = content[lang].boards
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div className="prose"><p>{t.execIntro}</p></div>

        <h3 style={{ margin: '2rem 0 1rem' }}>{t.supervisoryTitle}</h3>
        <div className="people">
          {t.supervisory.map((n, i) => (
            <div className="person" key={i}>
              <div className="av">{initials(n)}</div>
              <div className="nm">{n}</div>
              <div className="rl">{t.supervisoryTitle}</div>
            </div>
          ))}
        </div>

        <h3 style={{ margin: '2.5rem 0 1rem' }}>{t.parentTitle}</h3>
        <div className="people">
          {t.parents.map((n, i) => (
            <div className="person" key={i}>
              <div className="av">{initials(n)}</div>
              <div className="nm">{n}</div>
              <div className="rl">{t.parentTitle}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
