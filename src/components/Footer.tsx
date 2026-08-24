import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'

export default function Footer() {
  const { lang } = useLang()
  const t = content[lang]
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
              <img src="/logo.png" alt="IKC Düsseldorf logo" className="brand-logo" />
              IKC Düsseldorf
            </div>
            <p>{t.footer.about}</p>
          </div>
          <div>
            <h4>{t.footer.quickLinks}</h4>
            <ul>
              <li><Link to="/o-nama">{t.nav.about}</Link></li>
              <li><Link to="/aktivnosti">{t.nav.activities}</Link></li>
              <li><Link to="/za-malisane">{t.nav.kids}</Link></li>
              <li><Link to="/clanarina">{t.nav.membership}</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/kontakt">{t.nav.contact}</Link></li>
              <li><a href="https://ikc-d.org/dzemat/kalendar-i-termini/" target="_blank" rel="noreferrer">Kalendar i termini</a></li>
              <li><a href="https://ikc-d.org/impressum/" target="_blank" rel="noreferrer">Impressum</a></li>
              <li><a href="https://ikc-d.org/datenschutzerklaerung/" target="_blank" rel="noreferrer">Datenschutzerklärung</a></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.contact}</h4>
            <ul>
              <li>{t.contact.org}</li>
              <li>{t.contact.address}</li>
              <li><a href={`tel:${t.contact.phone.replace(/\s/g, '')}`}>{t.contact.phone}</a></li>
              <li><a href={`mailto:${t.contact.email}`}>{t.contact.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">{t.footer.rights}</div>
      </div>
    </footer>
  )
}
