import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, loadSession, saveSession, type ImageInfo, type Json, type SectionInfo, type Session, type UserInfo } from './api'
import JsonEditor from './JsonEditor'
import { SECTION_LABELS, SECTION_ORDER } from './labels'
import './admin.css'

type Tab = 'content' | 'images' | 'users'
type Notice = { kind: 'ok' | 'error'; text: string } | null

const formatDate = (iso: string) =>
  new Date(iso.endsWith('Z') ? iso : `${iso}Z`).toLocaleString('bs-BA', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [tab, setTab] = useState<Tab>('content')

  useEffect(() => {
    document.title = 'Admin — IKC Düsseldorf'
    const robots = document.head.querySelector('meta[name="robots"]')
    const previous = robots?.getAttribute('content')
    robots?.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (robots && previous) robots.setAttribute('content', previous)
    }
  }, [])

  const logout = useCallback(() => {
    saveSession(null)
    setSession(null)
  }, [])

  // Svaki 401 sa servera znači da je token istekao: vrati na prijavu.
  const handleError = useCallback(
    (error: unknown, setNotice: (n: Notice) => void) => {
      if (error instanceof ApiError && error.status === 401) logout()
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : String(error) })
    },
    [logout]
  )

  if (!session) {
    return (
      <Login
        onLogin={(s) => {
          saveSession(s)
          setSession(s)
        }}
      />
    )
  }

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-brand">
          <strong>IKC Düsseldorf</strong> <span>Admin</span>
        </div>
        <nav className="admin-tabs">
          <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Sadržaj</button>
          <button className={tab === 'images' ? 'active' : ''} onClick={() => setTab('images')}>Slike</button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Korisnici</button>
        </nav>
        <div className="admin-user">
          <span>{session.user.displayName}</span>
          <Link to="/" target="_blank">Stranica ↗</Link>
          <button onClick={logout}>Odjava</button>
        </div>
      </header>

      {tab === 'content' && <ContentTab token={session.token} onError={handleError} />}
      {tab === 'images' && <ImagesTab token={session.token} onError={handleError} />}
      {tab === 'users' && <UsersTab session={session} onError={handleError} />}
    </div>
  )
}

type ErrorHandler = (error: unknown, setNotice: (n: Notice) => void) => void

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null
  return (
    <div className={`admin-notice ${notice.kind}`} role="status">
      <span>{notice.text}</span>
      <button onClick={onClose} aria-label="Zatvori">✕</button>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
    <div className="admin-login">
      <form className="admin-card form" onSubmit={submit}>
        <h1>Admin prijava</h1>
        <p className="admin-muted">IKC Düsseldorf — uređivanje sadržaja stranice</p>
        <div className="field">
          <label htmlFor="admin-user">Korisničko ime</label>
          <input id="admin-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="admin-pass">Lozinka</label>
          <input id="admin-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="admin-notice error">{error}</div>}
        <button className="admin-btn" disabled={busy}>{busy ? 'Prijava…' : 'Prijavi se'}</button>
      </form>
    </div>
  )
}

function ContentTab({ token, onError }: { token: string; onError: ErrorHandler }) {
  const [sections, setSections] = useState<SectionInfo[]>([])
  const [lang, setLang] = useState<'bs' | 'de'>('bs')
  const [key, setKey] = useState('home')
  const [original, setOriginal] = useState<Json | null>(null)
  const [draft, setDraft] = useState<Json | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const dirty = useMemo(() => JSON.stringify(original) !== JSON.stringify(draft), [original, draft])

  useEffect(() => {
    api.sections(token).then(setSections).catch((e) => onError(e, setNotice))
  }, [token, onError])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .section(token, lang, key)
      .then((s) => {
        if (cancelled) return
        setOriginal(s.data)
        setDraft(s.data)
      })
      .catch((e) => !cancelled && onError(e, setNotice))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [token, lang, key, onError])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const select = (nextLang: 'bs' | 'de', nextKey: string) => {
    if (nextLang === lang && nextKey === key) return
    if (dirty && !window.confirm('Imate nesačuvane izmjene. Odbaciti ih?')) return
    setNotice(null)
    setLang(nextLang)
    setKey(nextKey)
  }

  const save = async () => {
    if (draft === null) return
    setSaving(true)
    setNotice(null)
    try {
      const result = await api.saveSection(token, lang, key, draft)
      setOriginal(draft)
      setSections((list) => list.map((s) => (s.lang === lang && s.key === key ? { ...s, updatedAt: result.updatedAt, updatedBy: result.updatedBy } : s)))
      setNotice({
        kind: 'ok',
        text: result.rebuildScheduled
          ? 'Sačuvano. Stranica će se automatski objaviti za 2–3 minute.'
          : 'Sačuvano. Automatska objava nije podešena — kliknite „Objavi stranicu“.',
      })
    } catch (e) {
      onError(e, setNotice)
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setNotice(null)
    try {
      await api.publish(token)
      setNotice({ kind: 'ok', text: 'Objava pokrenuta. Promjene će biti vidljive za 2–3 minute.' })
    } catch (e) {
      onError(e, setNotice)
    }
  }

  const info = sections.find((s) => s.lang === lang && s.key === key)
  const keys = [...SECTION_ORDER, ...sections.map((s) => s.key).filter((k) => !SECTION_ORDER.includes(k))].filter(
    (k, i, all) => all.indexOf(k) === i && (sections.length === 0 || sections.some((s) => s.key === k))
  )

  return (
    <div className="admin-layout">
      <aside className="admin-side">
        <div className="admin-lang">
          <button className={lang === 'bs' ? 'active' : ''} onClick={() => select('bs', key)}>Bosanski</button>
          <button className={lang === 'de' ? 'active' : ''} onClick={() => select('de', key)}>Deutsch</button>
        </div>
        <ul>
          {keys.map((k) => (
            <li key={k}>
              <button className={k === key ? 'active' : ''} onClick={() => select(lang, k)}>
                {SECTION_LABELS[k] ?? k}
              </button>
            </li>
          ))}
        </ul>
        <button className="admin-btn admin-btn-light admin-publish" onClick={publish}>Objavi stranicu</button>
      </aside>

      <section className="admin-main">
        <div className="admin-main-head">
          <div>
            <h2>{SECTION_LABELS[key] ?? key} <span className="admin-pill">{lang.toUpperCase()}</span></h2>
            {info && <p className="admin-muted">Zadnja izmjena: {formatDate(info.updatedAt)}{info.updatedBy ? ` · ${info.updatedBy}` : ''}</p>}
          </div>
          <div className="admin-actions">
            <button className="admin-btn admin-btn-light" disabled={!dirty || saving} onClick={() => setDraft(original)}>Poništi</button>
            <button className="admin-btn" disabled={!dirty || saving} onClick={save}>{saving ? 'Čuvanje…' : 'Sačuvaj'}</button>
          </div>
        </div>

        <NoticeBar notice={notice} onClose={() => setNotice(null)} />

        {loading || draft === null ? (
          <p className="admin-muted">Učitavanje…</p>
        ) : (
          <div className="admin-card form">
            <JsonEditor value={draft} original={original ?? undefined} onChange={setDraft} />
          </div>
        )}
      </section>
    </div>
  )
}

function ImagesTab({ token, onError }: { token: string; onError: ErrorHandler }) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [inputKey, setInputKey] = useState(0)

  useEffect(() => {
    api.images(token).then(setImages).catch((e) => onError(e, setNotice))
  }, [token, onError])

  const upload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setNotice(null)
    try {
      const image = await api.uploadImage(token, file, title.trim())
      setImages((list) => [image, ...list])
      setFile(null)
      setTitle('')
      setInputKey((k) => k + 1)
      setNotice({ kind: 'ok', text: 'Slika je uploadovana. Kopirajte link i zalijepite ga gdje treba.' })
    } catch (err) {
      onError(err, setNotice)
    } finally {
      setUploading(false)
    }
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setNotice({ kind: 'ok', text: 'Link kopiran.' })
    } catch {
      window.prompt('Kopirajte link:', url)
    }
  }

  const remove = async (image: ImageInfo) => {
    if (!window.confirm(`Ukloniti sliku „${image.title || image.id}“ iz liste?`)) return
    try {
      const { deleteUrl } = await api.deleteImage(token, image.id)
      setImages((list) => list.filter((i) => i.id !== image.id))
      if (deleteUrl && window.confirm('Slika je uklonjena iz liste. Otvoriti ImgBB stranicu da se obriše i sa ImgBB-a?')) {
        window.open(deleteUrl, '_blank', 'noopener')
      }
    } catch (e) {
      onError(e, setNotice)
    }
  }

  return (
    <div className="admin-page">
      <form className="admin-card form admin-upload" onSubmit={upload}>
        <h2>Nova slika</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="img-file">Slika (JPG, PNG, WEBP, GIF, do 32 MB)</label>
            <input key={inputKey} id="img-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          <div className="field">
            <label htmlFor="img-title">Naziv (opcionalno)</label>
            <input id="img-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div>
          <button className="admin-btn" disabled={!file || uploading}>{uploading ? 'Upload…' : 'Uploaduj'}</button>
        </div>
        <p className="form-note">Slike se čuvaju na ImgBB i javno su dostupne preko linka. Ne uploadujte slike djece bez saglasnosti roditelja.</p>
      </form>

      <NoticeBar notice={notice} onClose={() => setNotice(null)} />

      {images.length === 0 ? (
        <p className="admin-muted">Još nema slika.</p>
      ) : (
        <ul className="admin-images">
          {images.map((image) => (
            <li key={image.id} className="admin-card">
              <a href={image.url} target="_blank" rel="noreferrer">
                <img src={image.thumbUrl ?? image.displayUrl} alt={image.title ?? ''} loading="lazy" />
              </a>
              <div className="admin-image-meta">
                <strong>{image.title || `Slika #${image.id}`}</strong>
                <span className="admin-muted">{image.width}×{image.height} · {(image.size / 1024).toFixed(0)} KB · {formatDate(image.createdAt)}</span>
              </div>
              <div className="admin-actions">
                <button className="admin-btn admin-btn-light" onClick={() => copy(image.url)}>Kopiraj link</button>
                <button className="admin-btn admin-btn-danger" onClick={() => remove(image)}>Ukloni</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UsersTab({ session, onError }: { session: Session; onError: ErrorHandler }) {
  const { token } = session
  const [users, setUsers] = useState<UserInfo[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  const [form, setForm] = useState({ username: '', displayName: '', password: '' })
  const [pw, setPw] = useState({ current: '', next: '', repeat: '' })

  useEffect(() => {
    api.users(token).then(setUsers).catch((e) => onError(e, setNotice))
  }, [token, onError])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    try {
      const user = await api.createUser(token, form.username.trim(), form.displayName.trim() || form.username.trim(), form.password)
      setUsers((list) => [...list, { ...user, createdAt: new Date().toISOString() }])
      setForm({ username: '', displayName: '', password: '' })
      setNotice({ kind: 'ok', text: `Korisnik ${user.username} je kreiran.` })
    } catch (err) {
      onError(err, setNotice)
    }
  }

  const remove = async (user: UserInfo) => {
    if (!window.confirm(`Obrisati korisnika ${user.username}?`)) return
    try {
      await api.deleteUser(token, user.id)
      setUsers((list) => list.filter((u) => u.id !== user.id))
    } catch (e) {
      onError(e, setNotice)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    if (pw.next !== pw.repeat) {
      setNotice({ kind: 'error', text: 'Nove lozinke se ne podudaraju.' })
      return
    }
    try {
      await api.changePassword(token, pw.current, pw.next)
      setPw({ current: '', next: '', repeat: '' })
      setNotice({ kind: 'ok', text: 'Lozinka je promijenjena.' })
    } catch (err) {
      onError(err, setNotice)
    }
  }

  return (
    <div className="admin-page">
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />

      <div className="admin-card">
        <h2>Administratori</h2>
        <table className="admin-table">
          <thead>
            <tr><th>Korisničko ime</th><th>Ime</th><th>Kreiran</th><th /></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.displayName}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  {user.username !== session.user.username && (
                    <button className="admin-btn admin-btn-danger" onClick={() => remove(user)}>Obriši</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-two">
        <form className="admin-card form" onSubmit={create}>
          <h2>Novi administrator</h2>
          <div className="field"><label>Korisničko ime</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="field"><label>Ime i prezime</label><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
          <div className="field"><label>Lozinka (najmanje 10 znakova)</label><input type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div><button className="admin-btn">Kreiraj</button></div>
        </form>

        <form className="admin-card form" onSubmit={changePassword}>
          <h2>Moja lozinka</h2>
          <div className="field"><label>Trenutna lozinka</label><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
          <div className="field"><label>Nova lozinka (najmanje 10 znakova)</label><input type="password" autoComplete="new-password" minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
          <div className="field"><label>Ponovi novu lozinku</label><input type="password" autoComplete="new-password" minLength={10} value={pw.repeat} onChange={(e) => setPw({ ...pw, repeat: e.target.value })} required /></div>
          <div><button className="admin-btn">Promijeni lozinku</button></div>
        </form>
      </div>
    </div>
  )
}
