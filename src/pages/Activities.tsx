import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section, BulletList } from '../components/UI'

export default function Activities() {
  const { lang } = useLang()
  const t = content[lang].activities
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div className="prose">
          <p>{t.intro}</p>
          <h2>{t.lecturesTitle}</h2>
          <BulletList items={t.lectures} />
          <div className="info-box">
            <p><strong>{t.note1}</strong></p>
            <p style={{ marginTop: '0.6rem' }}>{t.note2}</p>
          </div>
        </div>
      </Section>
    </>
  )
}
