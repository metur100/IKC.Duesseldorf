import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

export default function Membership() {
  const { lang } = useLang()
  const t = content[lang].membership
  const f = t.fields
  const [sent, setSent] = useState(false)

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <Section>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="contact-card">
            <h3 style={{ marginBottom: '1rem' }}>{t.formTitle}</h3>
            {sent ? (
              <div className="form-success">{t.success}</div>
            ) : (
              <form className="form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <div className="row">
                  <div className="field"><label>{f.firstName}</label><input required /></div>
                  <div className="field"><label>{f.lastName}</label><input required /></div>
                </div>
                <div className="row">
                  <div className="field"><label>{f.birth}</label><input type="date" /></div>
                  <div className="field"><label>{f.birthPlace}</label><input /></div>
                </div>
                <div className="field"><label>{f.job}</label><input /></div>
                <div className="row">
                  <div className="field"><label>{f.street}</label><input /></div>
                  <div className="field"><label>{f.number}</label><input /></div>
                </div>
                <div className="row">
                  <div className="field"><label>{f.city}</label><input /></div>
                  <div className="field"><label>{f.zip}</label><input /></div>
                </div>
                <div className="row">
                  <div className="field"><label>{f.email}</label><input type="email" required /></div>
                  <div className="field"><label>{f.mobile}</label><input /></div>
                </div>
                <div className="field"><label>{f.spouse}</label><input /></div>
                <div className="field"><label>{f.children}</label><input /></div>
                <div className="row">
                  <div className="field">
                    <label>{f.payMethod}</label>
                    <select>{t.payMethods.map((m, i) => <option key={i}>{m}</option>)}</select>
                  </div>
                  <div className="field">
                    <label>{f.interval}</label>
                    <select>{t.intervals.map((m, i) => <option key={i}>{m}</option>)}</select>
                  </div>
                </div>
                <div className="field"><label>{f.amount}</label><input type="number" min={20} defaultValue={25} /></div>
                <label style={{ display: 'flex', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  <input type="checkbox" required style={{ width: 'auto', marginTop: 4 }} />
                  <span>{t.consent}</span>
                </label>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>{t.submit}</button>
              </form>
            )}
          </div>

          <div className="contact-card">
            <h3 style={{ marginBottom: '1rem' }}>Bankverbindung</h3>
            {t.bank.map((b, i) => (
              <div className="contact-row" key={i}>
                <span className="ci">▪</span>
                <span className="ct"><b>{b.label}</b>{b.value}</span>
              </div>
            ))}
            <div className="info-box" style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem' }}>Gläubiger-ID: DE72ZZZ00002401363</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
