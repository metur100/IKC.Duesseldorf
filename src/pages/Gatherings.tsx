import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section, BulletList } from '../components/UI'

export default function Gatherings() {
  const { lang } = useLang()
  const t = content[lang].gatherings
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div className="prose">
          <p>{t.intro}</p>
          <BulletList items={t.items} />
        </div>
      </Section>
    </>
  )
}
