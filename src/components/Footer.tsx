import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useSite } from '../cms/site'
import { navHref, SmartLink } from '../cms/links'
import { t } from '../cms/blocks'
import { ui } from '../cms/ui'

const LOGO_LIGHT = `${import.meta.env.BASE_URL}brand/logo-light.svg`

export default function Footer() {
  const { lang } = useLang()
  const { site } = useSite()
  const s = ui(lang)
  const { contact } = site.settings
  const links = site.settings.nav.flatMap((item) => (item.children.length ? item.children : [item]))

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <img src={LOGO_LIGHT} alt="" width="44" height="44" />
            <span>
              <strong>{site.settings.siteName}</strong>
              <small>{t(site.settings.tagline, lang)}</small>
            </span>
          </Link>
          <p>{t(site.settings.footerText, lang)}</p>
        </div>
        <div>
          <h2>{s.footerContact}</h2>
          <ul>
            <li>{contact.org}</li>
            <li>{contact.address}</li>
            {contact.phone && <li><a href={`tel:${contact.phone.replace(/[^\d+]/g, '').replace(/^0/, '+49')}`}>{contact.phone}</a></li>}
            {contact.email && <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
          </ul>
        </div>
        <div>
          <h2>{s.footerLinks}</h2>
          <ul className="footer-links">
            {links.map((item) => (
              <li key={item.id}><SmartLink href={navHref(item)}>{t(item.label, lang)}</SmartLink></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {contact.org}. {s.rights}</span>
        <span className="footer-legal">
          {site.settings.footerLinks.map((l, i) => (
            <SmartLink key={i} href={navHref(l)}>{t(l.label, lang)}</SmartLink>
          ))}
          {site.settings.social.map((l, i) => (
            <a key={`s${i}`} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </span>
      </div>
    </footer>
  )
}
