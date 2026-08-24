import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

export default function Imam() {
  const { lang } = useLang()
  const t = content[lang].imam
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div className="prose">
          <div className="person" style={{ maxWidth: 260, margin: '0 0 2rem' }}>
            <div className="av">MM</div>
            <div className="nm">{t.name}</div>
            <div className="rl">{t.title}</div>
          </div>
          {t.bio.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Section>
    </>
  )
}
