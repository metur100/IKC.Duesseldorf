import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'
import { PageHeader, Section } from '../components/UI'

export default function Contact() {
  const { lang } = useLang()
  const t = content[lang].contact
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <Section>
        <div className="contact-grid">
          <div className="contact-card">
            <h3 style={{ marginBottom: '1.2rem' }}>{t.addressTitle}</h3>
            <div className="contact-row"><span className="ci">📍</span><span className="ct"><b>{t.org}</b>{t.address}</span></div>
            <div className="contact-row"><span className="ci">👤</span><span className="ct"><b>{t.repTitle}</b>{t.rep}</span></div>
            <div className="contact-row"><span className="ci">📞</span><span className="ct"><b>Telefon</b><a href={`tel:${t.phone.replace(/\s/g, '')}`}>{t.phone}</a></span></div>
            <div className="contact-row"><span className="ci">✉️</span><span className="ct"><b>E-Mail</b><a href={`mailto:${t.email}`}>{t.email}</a></span></div>
            <div className="contact-row"><span className="ci">🕌</span><span className="ct">{t.imamContact}</span></div>
            <div className="contact-row"><span className="ci">☎️</span><span className="ct">{t.presContact}</span></div>
          </div>
          <div className="contact-card">
            <h3 style={{ marginBottom: '1.2rem' }}>{t.regTitle}</h3>
            <div className="contact-row"><span className="ci">⚖️</span><span className="ct">{t.reg1}</span></div>
            <div className="contact-row"><span className="ci">#️⃣</span><span className="ct">{t.reg2}</span></div>
            <div style={{ marginTop: '1.5rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--parchment-dark)' }}>
              <iframe
                title="map"
                width="100%" height="260" style={{ border: 0, display: 'block' }} loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=6.77%2C51.21%2C6.79%2C51.23&layer=mapnik&marker=51.2217%2C6.7807"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
