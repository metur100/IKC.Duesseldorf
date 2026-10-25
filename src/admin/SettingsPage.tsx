import { useEffect, useState } from 'react'
import type { NavItem, SiteSettings } from '../cms/types'
import { api, ApiError } from './api'
import { FieldEditor, type PageRef } from './fields'
import { Icon } from './icons'
import { L } from './schema'
import { useAdmin } from './state'
import { LangToggle } from './ui'
import { missingLangs } from './PageEditor'

const navId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

type Tab = 'menu' | 'general'

export default function SettingsPage() {
  const { site, setSite, editLang, setEditLang, toast, reload } = useAdmin()
  const [settings, setSettings] = useState<SiteSettings | null>(site?.settings ?? null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('menu')

  useEffect(() => {
    if (site && !dirty) setSettings(site.settings)
  }, [site, dirty])

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  if (!site || !settings) return <div className="a-page"><p className="a-muted">Učitavanje…</p></div>

  const pages: PageRef[] = site.pages.map((p) => ({ slug: p.slug, title: p.title.bs }))
  const change = (next: SiteSettings) => {
    setSettings(next)
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const version = await api.saveSettings(settings, site.settingsVersion)
      setSite((s) => ({ ...s, settings, settingsVersion: version }))
      setDirty(false)
      toast('Sačuvano — meni i postavke su odmah vidljivi na stranici.')
    } catch (err) {
      toast((err as Error).message, 'error')
      if (err instanceof ApiError && err.status === 409) void reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="a-page">
      <header className="a-page-head a-sticky-head">
        <div>
          <h1>Navigacija i postavke</h1>
          <p className="a-muted">Meni na vrhu stranice, footer, kontakt podaci i obavještenje.</p>
        </div>
        <div className="a-head-actions">
          <LangToggle lang={editLang} setLang={setEditLang} missing={missingLangs(settings)} />
          <button type="button" className="a-btn a-btn-primary" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? 'Spašavam…' : dirty ? 'Sačuvaj' : 'Sačuvano'}
          </button>
        </div>
      </header>

      <div className="a-seg a-tabs">
        <button type="button" className={tab === 'menu' ? 'on' : ''} onClick={() => setTab('menu')}>Meni</button>
        <button type="button" className={tab === 'general' ? 'on' : ''} onClick={() => setTab('general')}>Kontakt, footer i obavještenje</button>
      </div>

      {tab === 'menu' ? (
        <>
          <section className="a-panel">
            <h2>Glavni meni</h2>
            <p className="a-muted">Stavka može biti stranica, vanjski link ili grupa sa padajućim menijem. Na mobitelu se grupe prikazuju jedna ispod druge.</p>
            <NavEditor items={settings.nav} pages={pages} onChange={(nav) => change({ ...settings, nav })} depth={0} />
          </section>
          <section className="a-panel">
            <h2>Linkovi u dnu stranice</h2>
            <p className="a-muted">Npr. Impressum i zaštita podataka.</p>
            <NavEditor
              items={settings.footerLinks.map((l, i) => ({ id: `f${i}`, label: l.label, page: l.page, href: l.href, children: [] }))}
              pages={pages}
              depth={1}
              onChange={(items) => change({ ...settings, footerLinks: items.map(({ label, page, href }) => ({ label, page, href })) })}
            />
          </section>
        </>
      ) : (
        <GeneralSettings settings={settings} pages={pages} onChange={change} />
      )}
    </div>
  )
}

function NavEditor({ items, pages, onChange, depth }: { items: NavItem[]; pages: PageRef[]; onChange: (items: NavItem[]) => void; depth: number }) {
  const { editLang: lang } = useAdmin()
  const set = (i: number, item: NavItem) => onChange(items.map((x, j) => (j === i ? item : x)))
  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = items.slice()
    const [it] = next.splice(i, 1)
    next.splice(to, 0, it)
    onChange(next)
  }

  return (
    <div className={`a-nav ${depth ? 'a-nav-sub' : ''}`}>
      {items.map((item, i) => {
        const kind = item.children.length || (!item.page && !item.href && depth === 0) ? 'group' : item.page ? 'page' : 'link'
        return (
          <div key={item.id} className="a-nav-item">
            <div className="a-nav-row">
              <input
                className="a-input"
                aria-label="Naziv u meniju"
                placeholder={`Naziv (${lang.toUpperCase()})`}
                value={item.label[lang]}
                onChange={(e) => set(i, { ...item, label: { ...item.label, [lang]: e.target.value } })}
              />
              <select
                className="a-input"
                aria-label="Vrsta"
                value={kind === 'page' ? `page:${item.page}` : kind}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'group') set(i, { ...item, page: '', href: '', children: item.children })
                  else if (v === 'link') set(i, { ...item, page: '', href: item.href || 'https://', children: [] })
                  else set(i, { ...item, page: v.slice(5), href: '', children: [] })
                }}
              >
                <optgroup label="Stranica">
                  {pages.map((p) => <option key={p.slug} value={`page:${p.slug}`}>{p.title}</option>)}
                </optgroup>
                {depth === 0 && <option value="group">Grupa (padajući meni)</option>}
                <option value="link">Vanjski link</option>
              </select>
              <div className="a-row-tools">
                <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Gore"><Icon name="up" size={18} /></button>
                <button type="button" className="a-icon-btn" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Dolje"><Icon name="down" size={18} /></button>
                <button type="button" className="a-icon-btn danger" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Ukloni"><Icon name="trash" size={18} /></button>
              </div>
            </div>
            {kind === 'link' && (
              <input className="a-input" placeholder="https://…" value={item.href} onChange={(e) => set(i, { ...item, href: e.target.value })} />
            )}
            {kind === 'group' && (
              <NavEditor items={item.children} pages={pages} depth={depth + 1} onChange={(children) => set(i, { ...item, children })} />
            )}
          </div>
        )
      })}
      <button
        type="button"
        className="a-add"
        onClick={() => onChange([...items, { id: navId(), label: L(), page: pages[0]?.slug ?? '', href: '', children: [] }])}
      >
        <Icon name="plus" size={18} /> {depth === 0 ? 'Dodaj stavku menija' : 'Dodaj link'}
      </button>
    </div>
  )
}

function GeneralSettings({ settings, pages, onChange }: { settings: SiteSettings; pages: PageRef[]; onChange: (s: SiteSettings) => void }) {
  const c = settings.contact
  const setContact = (key: keyof SiteSettings['contact'], value: unknown) => onChange({ ...settings, contact: { ...c, [key]: value } })
  return (
    <>
      <section className="a-panel">
        <h2>Obavještenje na vrhu stranice</h2>
        <div className="a-fields">
          <FieldEditor field={{ kind: 'bool', key: 'enabled', label: 'Prikaži obavještenje', hint: 'Zlatna traka iznad menija na svim stranicama' }} value={settings.announcement.enabled} pages={pages}
            onChange={(v) => onChange({ ...settings, announcement: { ...settings.announcement, enabled: v as boolean } })} />
          <FieldEditor field={{ kind: 'ltext', key: 'text', label: 'Tekst obavještenja' }} value={settings.announcement.text} pages={pages}
            onChange={(v) => onChange({ ...settings, announcement: { ...settings.announcement, text: v as SiteSettings['announcement']['text'] } })} />
          <FieldEditor field={{ kind: 'href', key: 'href', label: 'Link (opcionalno)' }} value={settings.announcement.href} pages={pages}
            onChange={(v) => onChange({ ...settings, announcement: { ...settings.announcement, href: v as string } })} />
        </div>
      </section>

      <section className="a-panel">
        <h2>Džuma-namaz</h2>
        <div className="a-fields">
          <FieldEditor field={{ kind: 'text', key: 'time', label: 'Vrijeme' }} value={settings.jumuah.time} pages={pages} onChange={(v) => onChange({ ...settings, jumuah: { ...settings.jumuah, time: v as string } })} />
          <FieldEditor field={{ kind: 'ltext', key: 'note', label: 'Tekst uz vaktiju', hint: 'npr. "Džuma-namaz petkom u 13:00"' }} value={settings.jumuah.note} pages={pages}
            onChange={(v) => onChange({ ...settings, jumuah: { ...settings.jumuah, note: v as SiteSettings['jumuah']['note'] } })} />
        </div>
      </section>

      <section className="a-panel">
        <h2>Kontakt (footer)</h2>
        <div className="a-fields a-fields-2">
          <FieldEditor field={{ kind: 'text', key: 'org', label: 'Naziv udruženja' }} value={c.org} pages={pages} onChange={(v) => setContact('org', v)} />
          <FieldEditor field={{ kind: 'text', key: 'address', label: 'Adresa' }} value={c.address} pages={pages} onChange={(v) => setContact('address', v)} />
          <FieldEditor field={{ kind: 'text', key: 'phone', label: 'Telefon' }} value={c.phone} pages={pages} onChange={(v) => setContact('phone', v)} />
          <FieldEditor field={{ kind: 'text', key: 'email', label: 'E-mail' }} value={c.email} pages={pages} onChange={(v) => setContact('email', v)} />
        </div>
      </section>

      <section className="a-panel">
        <h2>Naziv i footer</h2>
        <div className="a-fields">
          <FieldEditor field={{ kind: 'text', key: 'siteName', label: 'Naziv stranice' }} value={settings.siteName} pages={pages} onChange={(v) => onChange({ ...settings, siteName: v as string })} />
          <FieldEditor field={{ kind: 'ltext', key: 'tagline', label: 'Podnaslov uz naziv' }} value={settings.tagline} pages={pages} onChange={(v) => onChange({ ...settings, tagline: v as SiteSettings['tagline'] })} />
          <FieldEditor field={{ kind: 'ltextarea', key: 'footerText', label: 'Tekst u footeru' }} value={settings.footerText} pages={pages} onChange={(v) => onChange({ ...settings, footerText: v as SiteSettings['footerText'] })} />
          <FieldEditor
            field={{
              kind: 'items', key: 'social', label: 'Društvene mreže', itemLabel: 'link',
              fields: [{ kind: 'text', key: 'label', label: 'Naziv (npr. Facebook)' }, { kind: 'href', key: 'href', label: 'Link' }],
              create: () => ({ label: '', href: 'https://' }),
              summary: (item: { label: string }) => item.label,
            }}
            value={settings.social}
            pages={pages}
            onChange={(v) => onChange({ ...settings, social: v as SiteSettings['social'] })}
          />
        </div>
      </section>
    </>
  )
}
