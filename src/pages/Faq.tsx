import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

export default function Faq() {
  const { lang } = useLang()
  const t = content[lang].faq
  const [open, setOpen] = useState<number | null>(0)

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div style={{ maxWidth: 820 }}>
          {t.items.map((it, i) => (
            <div className={`acc-item ${open === i ? 'open' : ''}`} key={i}>
              <button className="acc-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span>{i + 1}. {it.q}</span>
                <span className="plus">+</span>
              </button>
              <div className="acc-a"><p>{it.a}</p></div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
