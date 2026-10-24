import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useSite } from '../cms/site'
import { navHref, SmartLink } from '../cms/links'
import { t } from '../cms/blocks'
import { ui } from '../cms/ui'
import { prayerState, useNow, useVaktija } from '../cms/vaktija'
import { PRAYER_NAMES, type NavItem } from '../cms/types'

const LOGO = `${import.meta.env.BASE_URL}brand/logo.svg`
const LOGO_LIGHT = `${import.meta.env.BASE_URL}brand/logo-light.svg`

export default function Header({ overHero }: { overHero: boolean }) {
  const { lang, setLang } = useLang()
  const { site } = useSite()
  const s = ui(lang)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const transparent = overHero && !scrolled && !open
  const announcement = site.settings.announcement

  return (
    <>
      {announcement?.enabled && t(announcement.text, lang) && (
        <div className="announcement">
          <div className="container">
            {announcement.href ? <SmartLink href={announcement.href}>{t(announcement.text, lang)} →</SmartLink> : t(announcement.text, lang)}
          </div>
        </div>
      )}
      <header className={`site-header ${transparent ? 'is-transparent' : 'is-solid'} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={site.settings.siteName}>
            <img src={transparent ? LOGO_LIGHT : LOGO} alt="" width="36" height="36" />
            <span>
              <strong>{site.settings.siteName}</strong>
              <small>{t(site.settings.tagline, lang)}</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Glavna navigacija">
            {site.settings.nav.map((item) =>
              item.children.length ? <DropDown key={item.id} item={item} /> : (
                <NavLink key={item.id} to={navHref(item)} className="nav-link">
                  {t(item.label, lang)}
                </NavLink>
              ),
            )}
          </nav>

          <div className="header-tools">
            <NextPrayerChip />
            <LangSwitch lang={lang} setLang={setLang} />
            <button type="button" className="burger" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? s.close : s.menu} onClick={() => setOpen(!open)}>
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
        <nav className="container" aria-label="Meni">
          <NavLink to="/" end className="m-link">{lang === 'bs' ? 'Početna' : 'Startseite'}</NavLink>
          {site.settings.nav.map((item) =>
            item.children.length ? (
              <div key={item.id} className="m-group">
                <span className="m-group-title">{t(item.label, lang)}</span>
                {item.children.map((child) => (
                  <NavLink key={child.id} to={navHref(child)} className="m-link m-sub">{t(child.label, lang)}</NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={item.id} to={navHref(item)} className="m-link">{t(item.label, lang)}</NavLink>
            ),
          )}
          <div className="m-footer">
            <LangSwitch lang={lang} setLang={setLang} />
            <a href={`tel:${site.settings.contact.phone.replace(/[^\d+]/g, '')}`}>{site.settings.contact.phone}</a>
          </div>
        </nav>
      </div>
    </>
  )
}

function DropDown({ item }: { item: NavItem }) {
  const { lang } = useLang()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = item.children.some((c) => navHref(c) === pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className={`nav-drop ${open ? 'open' : ''}`} ref={ref} onMouseLeave={() => setOpen(false)}>
      <button type="button" className={`nav-link ${active ? 'active' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)} onMouseEnter={() => setOpen(true)}>
        {t(item.label, lang)}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <div className="nav-menu">
        {item.children.map((child) => (
          <NavLink key={child.id} to={navHref(child)}>{t(child.label, lang)}</NavLink>
        ))}
      </div>
    </div>
  )
}

function LangSwitch({ lang, setLang }: { lang: 'bs' | 'de'; setLang: (l: 'bs' | 'de') => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Jezik / Sprache">
      <button type="button" className={lang === 'bs' ? 'on' : ''} aria-pressed={lang === 'bs'} onClick={() => setLang('bs')}>BS</button>
      <button type="button" className={lang === 'de' ? 'on' : ''} aria-pressed={lang === 'de'} onClick={() => setLang('de')}>DE</button>
    </div>
  )
}

function NextPrayerChip() {
  const { lang } = useLang()
  const { data } = useVaktija()
  const now = useNow(30_000)
  const state = data ? prayerState(data, now) : null
  if (!state) return null
  return (
    <Link to="/vaktija" className="prayer-chip" title={ui(lang).nextPrayer}>
      <span>{PRAYER_NAMES[lang][state.next]}</span>
      <strong className="tabular">{state.nextTime}</strong>
    </Link>
  )
}
