import { FormEvent, useCallback, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { api, ApiError, loadSession, saveSession, setAuth, type Session } from './api'
import { AdminProvider, useAdmin } from './state'
import { Icon, type IconName } from './icons'
import PagesList from './PagesList'
import PageEditor from './PageEditor'
import SettingsPage from './SettingsPage'
import { ApplicationsPage, ImagesPage, UsersPage } from './OtherPages'
import Preview from './Preview'
import './admin.css'

// Admin otvoren u aplikaciji, vidi admin.css. window.ReactNativeWebView postoji samo uz onMessage,
// pa se Android WebView prepoznaje i po user agentu ("; wv)").
if ('ReactNativeWebView' in window || /; wv\)/.test(navigator.userAgent)) document.documentElement.classList.add('in-app')

const LOGO = `${import.meta.env.BASE_URL}brand/logo.svg`

export default function AdminApp() {
  const { pathname } = useLocation()
  const [session, setSession] = useState<Session | null>(loadSession)

  const logout = useCallback(() => {
    saveSession(null)
    setAuth(null)
    setSession(null)
  }, [])

  useEffect(() => {
    setAuth(session, logout)
  }, [session, logout])

  useEffect(() => {
    const robots = document.head.querySelector('meta[name="robots"]')
    const previous = robots?.getAttribute('content')
    robots?.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (robots && previous) robots.setAttribute('content', previous)
    }
  }, [])

  // Pregled u iframeu editora: bez admin okvira.
  if (pathname === '/admin/preview') return <Preview />

  if (!session) {
    return (
      <Login
        onLogin={(s) => {
          saveSession(s)
          setAuth(s, logout)
          setSession(s)
        }}
      />
    )
  }

  return (
    <AdminProvider user={session.user}>
      <Shell onLogout={logout} />
    </AdminProvider>
  )
}

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/admin', label: 'Stranice', icon: 'pages', end: true },
  { to: '/admin/navigacija', label: 'Navigacija', icon: 'nav' },
  { to: '/admin/slike', label: 'Slike', icon: 'image' },
  { to: '/admin/prijave', label: 'Prijave', icon: 'inbox' },
  { to: '/admin/admini', label: 'Admini', icon: 'users' },
]

function Shell({ onLogout }: { onLogout: () => void }) {
  const { user, loadError, reload } = useAdmin()
  const { pathname } = useLocation()
  const inEditor = pathname.startsWith('/admin/stranice/')
  // Na telefonu se lijevi meni otvara dugmetom ☰ kao ladica.
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = 'Admin — IKC Düsseldorf'
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className={`adm a-shell ${inEditor ? 'in-editor' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && <div className="a-side-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className="a-side" id="a-side">
        <div className="a-brand">
          <img src={LOGO} alt="" width="34" height="34" />
          <span><strong>IKC Düsseldorf</strong><small>Uređivanje stranice</small></span>
        </div>
        <nav className="a-side-nav" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive || (n.end && inEditor) ? 'active' : '')}>
              <Icon name={n.icon} /> <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="a-side-foot">
          <a href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer"><Icon name="external" size={18} /> <span>Otvori stranicu</span></a>
          <button type="button" onClick={onLogout}><Icon name="logout" size={18} /> <span>Odjava ({user.displayName})</span></button>
        </div>
      </aside>

      <header className="a-topbar">
        <button type="button" className="a-icon-btn" aria-label="Meni" aria-expanded={menuOpen} aria-controls="a-side" onClick={() => setMenuOpen(true)}><Icon name="nav" /></button>
        <div className="a-brand">
          <img src={LOGO} alt="" width="30" height="30" />
          <strong>Admin</strong>
        </div>
        <a className="a-icon-btn" href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer" aria-label="Otvori stranicu"><Icon name="external" /></a>
        <button type="button" className="a-icon-btn" onClick={onLogout} aria-label="Odjava"><Icon name="logout" /></button>
      </header>

      <main className="a-main">
        {loadError && (
          <div className="a-alert">
            {loadError} <button type="button" className="a-btn a-btn-sm" onClick={() => void reload()}>Pokušaj ponovo</button>
          </div>
        )}
        <Routes>
          <Route path="/admin" element={<PagesList />} />
          <Route path="/admin/stranice/:slug" element={<PageEditor />} />
          <Route path="/admin/navigacija" element={<SettingsPage />} />
          <Route path="/admin/slike" element={<ImagesPage />} />
          <Route path="/admin/prijave" element={<ApplicationsPage />} />
          <Route path="/admin/admini" element={<UsersPage />} />
          <Route path="*" element={<PagesList />} />
        </Routes>
      </main>

      <nav className="a-tabbar" aria-label="Admin">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive || (n.end && inEditor) ? 'active' : '')}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Prijava — IKC Düsseldorf Admin'
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onLogin(await api.login(username.trim(), password))
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Pogrešno korisničko ime ili lozinka.' : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm a-login">
      <form className="a-login-card" onSubmit={submit}>
        <img src={LOGO} alt="" width="56" height="56" />
        <h1>Admin prijava</h1>
        <p className="a-muted">IKC Düsseldorf — uređivanje stranice i aplikacije</p>
        <label className="a-field">
          <span className="a-label">Korisničko ime</span>
          <input className="a-input" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label className="a-field">
          <span className="a-label">Lozinka</span>
          <input className="a-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="a-form-error" role="alert">{error}</p>}
        <button type="submit" className="a-btn a-btn-primary a-btn-block" disabled={busy}>{busy ? 'Prijava…' : 'Prijavi se'}</button>
        <a className="a-link" href={import.meta.env.BASE_URL}>← Nazad na stranicu</a>
      </form>
    </div>
  )
}
