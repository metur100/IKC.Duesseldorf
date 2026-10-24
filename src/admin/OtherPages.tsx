import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, type MembershipRequest, type UserInfo } from './api'
import { Icon } from './icons'
import MediaLibrary from './MediaLibrary'
import { formatDate, useAdmin } from './state'
import { Empty, Modal } from './ui'

// ── Slike ───────────────────────────────────────────────────────────────────

export function ImagesPage() {
  const { images, loadImages, toast } = useAdmin()
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    if (!images) void loadImages()
  }, [images, loadImages])

  const remove = async (id: number) => {
    if (!window.confirm('Ukloniti sliku iz biblioteke? Stranice koje je koriste će je i dalje prikazivati.')) return
    setBusy(id)
    try {
      const { deleteUrl } = await api.deleteImage(id)
      await loadImages()
      toast('Slika je uklonjena iz biblioteke.')
      if (deleteUrl && window.confirm('Da li želite trajno obrisati sliku i sa ImgBB? Otvoriće se njihova stranica za brisanje.')) window.open(deleteUrl, '_blank', 'noopener')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link slike je kopiran.')
    } catch {
      window.prompt('Link slike:', url)
    }
  }

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Slike</h1>
          <p className="a-muted">Sve učitane slike. Slike birate direktno u bloku, a ovdje ih možete učitati unaprijed.</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn a-btn-primary" onClick={() => setUploading(true)}><Icon name="upload" size={18} /> Učitaj slike</button>
        </div>
      </header>
      {!images ? <p className="a-muted">Učitavanje…</p> : images.length === 0 ? <Empty title="Još nema slika" text="Učitajte prve fotografije džemata." /> : (
        <ul className="a-gallery">
          {images.map((img) => (
            <li key={img.id}>
              <img src={img.thumbUrl ?? img.displayUrl} alt={img.title ?? ''} loading="lazy" />
              <div className="a-gallery-meta">
                <strong title={img.title ?? ''}>{img.title || 'Bez naziva'}</strong>
                <span>{img.width}×{img.height} · {formatDate(img.createdAt)}</span>
              </div>
              <div className="a-gallery-tools">
                <button type="button" className="a-icon-btn" onClick={() => void copy(img.url)} aria-label="Kopiraj link"><Icon name="link" size={18} /></button>
                <a className="a-icon-btn" href={img.url} target="_blank" rel="noreferrer" aria-label="Otvori"><Icon name="external" size={18} /></a>
                <button type="button" className="a-icon-btn danger" disabled={busy === img.id} onClick={() => void remove(img.id)} aria-label="Ukloni"><Icon name="trash" size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {uploading && <MediaLibrary onClose={() => setUploading(false)} onSelect={() => setUploading(false)} />}
    </div>
  )
}

// ── Prijave za članstvo ─────────────────────────────────────────────────────

const PAY: Record<string, string> = { sepa: 'SEPA', transfer: 'Trajni nalog / uplata', cash: 'Gotovina' }
const INTERVAL: Record<string, string> = { monthly: 'mjesečno', halfyear: 'polugodišnje', yearly: 'godišnje' }
const LABELS: [string, string][] = [
  ['firstName', 'Ime'], ['lastName', 'Prezime'], ['birthDate', 'Datum rođenja'], ['birthPlace', 'Mjesto rođenja'], ['job', 'Zanimanje'],
  ['street', 'Ulica'], ['houseNumber', 'Broj'], ['zip', 'PLZ'], ['city', 'Grad'],
  ['email', 'E-mail'], ['phone', 'Mobilni'], ['homePhone', 'Kućni broj'],
  ['spouse', 'Supruga / suprug'], ['spouseBirthDate', 'Datum rođenja supruge/supruga'], ['spouseJob', 'Zanimanje supruge/supruga'], ['children', 'Djeca'],
  ['payMethod', 'Način plaćanja'], ['interval', 'Period'], ['amount', 'Iznos (€)'],
  ['accountHolder', 'Vlasnik računa'], ['bank', 'Banka'], ['iban', 'IBAN'], ['bic', 'BIC'],
  ['consentData', 'Saglasnost (podaci, statut)'], ['consentSepa', 'SEPA mandat'], ['lang', 'Jezik obrasca'],
]

const display = (key: string, value: unknown) => {
  if (typeof value === 'boolean') return value ? 'da' : 'ne'
  if (key === 'payMethod') return PAY[String(value)] ?? String(value ?? '')
  if (key === 'interval') return INTERVAL[String(value)] ?? String(value ?? '')
  return String(value ?? '')
}

export function ApplicationsPage() {
  const { toast } = useAdmin()
  const [list, setList] = useState<MembershipRequest[] | null>(null)
  const [open, setOpen] = useState<MembershipRequest | null>(null)
  const [show, setShow] = useState<'new' | 'all'>('new')

  const load = useCallback(() => api.membership().then(setList).catch((err) => toast((err as Error).message, 'error')), [toast])
  useEffect(() => {
    void load()
  }, [load])

  const setStatus = async (row: MembershipRequest, status: 'new' | 'done') => {
    try {
      await api.setMembershipStatus(row.id, status)
      await load()
      setOpen(null)
      toast(status === 'done' ? 'Označeno kao obrađeno.' : 'Vraćeno u nove.')
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const remove = async (row: MembershipRequest) => {
    if (!window.confirm(`Trajno obrisati prijavu: ${row.name}?`)) return
    try {
      await api.deleteMembership(row.id)
      await load()
      setOpen(null)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const exportCsv = () => {
    if (!list?.length) return
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows = [['Primljeno', 'Status', ...LABELS.map(([, l]) => l)].map(esc).join(';')]
    for (const r of list) rows.push([formatDate(r.createdAt), r.status === 'done' ? 'obrađeno' : 'novo', ...LABELS.map(([k]) => display(k, (r.data as Record<string, unknown>)[k]))].map(esc).join(';'))
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prijave-clanstvo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const visible = (list ?? []).filter((r) => show === 'all' || r.status === 'new')

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Prijave za članstvo</h1>
          <p className="a-muted">Prijave poslane preko obrasca na stranici i u aplikaciji.</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn" disabled={!list?.length} onClick={exportCsv}><Icon name="download" size={18} /> Excel (CSV)</button>
        </div>
      </header>
      <div className="a-seg a-tabs">
        <button type="button" className={show === 'new' ? 'on' : ''} onClick={() => setShow('new')}>Nove ({list?.filter((r) => r.status === 'new').length ?? 0})</button>
        <button type="button" className={show === 'all' ? 'on' : ''} onClick={() => setShow('all')}>Sve ({list?.length ?? 0})</button>
      </div>
      {!list ? <p className="a-muted">Učitavanje…</p> : visible.length === 0 ? <Empty title={show === 'new' ? 'Nema novih prijava' : 'Još nema prijava'} /> : (
        <ul className="a-rows a-rows-card">
          {visible.map((r) => (
            <li key={r.id} className="a-row">
              <button type="button" className="a-row-main" onClick={() => setOpen(r)}>
                <strong>{r.name}</strong>
                <span className="a-muted">{r.email} · {formatDate(r.createdAt)}</span>
                <span className="a-muted">{display('amount', r.data.amount)} € {display('interval', r.data.interval)} · {display('payMethod', r.data.payMethod)}</span>
              </button>
              {r.status === 'done' ? <span className="a-badge a-badge-green">obrađeno</span> : <span className="a-badge a-badge-warn">novo</span>}
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Modal
          title={open.name}
          onClose={() => setOpen(null)}
          footer={
            <>
              <button type="button" className="a-btn a-btn-danger" onClick={() => void remove(open)}>Obriši</button>
              {open.status === 'new'
                ? <button type="button" className="a-btn a-btn-primary" onClick={() => void setStatus(open, 'done')}><Icon name="check" size={18} /> Obrađeno</button>
                : <button type="button" className="a-btn" onClick={() => void setStatus(open, 'new')}>Vrati u nove</button>}
            </>
          }
        >
          <p className="a-muted">Primljeno {formatDate(open.createdAt)}{open.handledBy ? ` · obradio: ${open.handledBy}` : ''}</p>
          <dl className="a-dl">
            {LABELS.map(([k, label]) => {
              const v = display(k, (open.data as Record<string, unknown>)[k])
              return v ? (
                <div key={k}>
                  <dt>{label}</dt>
                  <dd>{k === 'email' ? <a href={`mailto:${v}`}>{v}</a> : k === 'phone' || k === 'homePhone' ? <a href={`tel:${v}`}>{v}</a> : v}</dd>
                </div>
              ) : null
            })}
          </dl>
        </Modal>
      )}
    </div>
  )
}

// ── Korisnici ───────────────────────────────────────────────────────────────

export function UsersPage() {
  const { user, toast } = useAdmin()
  const [users, setUsers] = useState<UserInfo[] | null>(null)
  const [form, setForm] = useState({ username: '', displayName: '', password: '' })
  const [pw, setPw] = useState({ current: '', next: '' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api.users().then(setUsers).catch((err) => toast((err as Error).message, 'error')), [toast])
  useEffect(() => {
    void load()
  }, [load])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createUser(form.username.trim(), form.displayName.trim() || form.username.trim(), form.password)
      setForm({ username: '', displayName: '', password: '' })
      await load()
      toast('Admin je dodan.')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (u: UserInfo) => {
    if (!window.confirm(`Ukloniti admina ${u.displayName}?`)) return
    try {
      await api.deleteUser(u.id)
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '' })
      toast('Lozinka je promijenjena.')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Admini</h1>
          <p className="a-muted">Ko može uređivati stranicu i vidjeti prijave.</p>
        </div>
      </header>
      <section className="a-panel">
        <h2>Svi admini</h2>
        {!users ? <p className="a-muted">Učitavanje…</p> : (
          <ul className="a-rows">
            {users.map((u) => (
              <li key={u.id} className="a-row">
                <div>
                  <strong>{u.displayName}</strong>
                  <span className="a-muted">{u.username} · od {formatDate(u.createdAt)}</span>
                </div>
                {u.username === user.username ? <span className="a-badge a-badge-green">vi</span> : (
                  <button type="button" className="a-icon-btn danger" onClick={() => void remove(u)} aria-label="Ukloni"><Icon name="trash" size={18} /></button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="a-two">
        <form className="a-panel" onSubmit={create}>
          <h2>Dodaj admina</h2>
          <div className="a-fields">
            <label className="a-field"><span className="a-label">Korisničko ime</span><input className="a-input" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
            <label className="a-field"><span className="a-label">Ime za prikaz</span><input className="a-input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>
            <label className="a-field"><span className="a-label">Lozinka (min. 10 znakova)</span><input className="a-input" type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
            <button type="submit" className="a-btn a-btn-primary" disabled={busy}>Dodaj</button>
          </div>
        </form>
        <form className="a-panel" onSubmit={changePassword}>
          <h2>Moja lozinka</h2>
          <div className="a-fields">
            <input type="text" autoComplete="username" value={user.username} readOnly hidden />
            <label className="a-field"><span className="a-label">Trenutna lozinka</span><input className="a-input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></label>
            <label className="a-field"><span className="a-label">Nova lozinka (min. 10 znakova)</span><input className="a-input" type="password" autoComplete="new-password" minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
            <button type="submit" className="a-btn" disabled={busy}>Promijeni lozinku</button>
          </div>
        </form>
      </div>
    </div>
  )
}
