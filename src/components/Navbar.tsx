import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const t = content[lang]
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand" onClick={close}>
          <span className="brand-mark">☾</span>
          <span>IKC Düsseldorf</span>
        </NavLink>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>{t.nav.home}</NavLink>
          <NavLink to="/aktivnosti" onClick={close}>{t.nav.activities}</NavLink>
          <NavLink to="/za-malisane" onClick={close}>{t.nav.kids}</NavLink>
          <NavLink to="/druge-usluge" onClick={close}>{t.nav.services}</NavLink>
          <NavLink to="/okupljanja" onClick={close}>{t.nav.gatherings}</NavLink>
          <div className="nav-drop">
            <button type="button" className="nav-drop-trigger" aria-label={t.nav.dzemat}>
              <span>{t.nav.dzemat}</span>
              <span className="nav-drop-caret" aria-hidden="true">▾</span>
            </button>
            <div className="nav-drop-menu">
              <NavLink to="/imam" onClick={close}>{t.nav.imam}</NavLink>
              <NavLink to="/odbor" onClick={close}>{t.nav.board}</NavLink>
              <NavLink to="/o-nama" onClick={close}>{t.nav.about}</NavLink>
              <NavLink to="/clanarina" onClick={close}>{t.nav.membershipFee}</NavLink>
            </div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="lang-switch" role="group" aria-label="Language">
            <button className={lang === 'bs' ? 'on' : ''} onClick={() => setLang('bs')}>BS</button>
            <button className={lang === 'de' ? 'on' : ''} onClick={() => setLang('de')}>DE</button>
          </div>
          <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}
