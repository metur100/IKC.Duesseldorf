import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DeletedPage } from './api'
import { Icon } from './icons'
import { NewPageModal, missingLangs } from './PageEditor'
import { formatDate, useAdmin } from './state'
import { Empty, Modal } from './ui'
import type { NavItem, Page } from '../cms/types'
import { pagePath } from '../cms/types'

/** Gdje se stranica nalazi u meniju (npr. "Džemat › Imam"). */
function navPlaces(nav: NavItem[], slug: string): string[] {
  const out: string[] = []
  for (const item of nav) {
    if (item.page === slug) out.push(item.label.bs)
    for (const child of item.children) if (child.page === slug) out.push(`${item.label.bs} › ${child.label.bs}`)
  }
  return out
}

export default function PagesList() {
  const { site, user } = useAdmin()
  const [filter, setFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const pages = useMemo(() => {
    const list = site?.pages ?? []
    const f = filter.trim().toLowerCase()
    return f ? list.filter((p) => `${p.title.bs} ${p.title.de} ${p.slug}`.toLowerCase().includes(f)) : list
  }, [site, filter])

  if (!site) return <div className="a-page"><p className="a-muted">Učitavanje…</p></div>

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Stranice</h1>
          <p className="a-muted">Selam, {user.displayName}. Kliknite stranicu da uredite tekst, slike i redoslijed blokova.</p>
        </div>
        <div className="a-head-actions">
          <button type="button" className="a-btn" onClick={() => setRestoring(true)}><Icon name="history" size={18} /> Obrisane</button>
          <button type="button" className="a-btn a-btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={18} /> Nova stranica</button>
        </div>
      </header>

      <div className="a-search">
        <Icon name="search" size={18} />
        <input className="a-input" placeholder="Traži stranicu…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {pages.length === 0 ? <Empty title="Nema stranica" /> : (
        <ul className="a-cards">
          {pages.map((p) => <PageCard key={p.slug} page={p} places={navPlaces(site.settings.nav, p.slug)} />)}
        </ul>
      )}

      {creating && <NewPageModal onClose={() => setCreating(false)} />}
      {restoring && <DeletedPages onClose={() => setRestoring(false)} />}
    </div>
  )
}

function PageCard({ page, places }: { page: Page; places: string[] }) {
  const missing = missingLangs({ t: page.title, b: page.blocks })
  const legal = page.slug === 'impressum' || page.slug === 'datenschutz'
  return (
    <li>
      <Link to={`/admin/stranice/${page.slug}`} className="a-card">
        <div className="a-card-main">
          <strong>{page.title.bs || page.slug}</strong>
          <span className="a-card-path">{pagePath(page.slug)}</span>
        </div>
        <div className="a-card-meta">
          {page.slug === 'home' && <span className="a-badge a-badge-green">početna</span>}
          {page.draft && <span className="a-badge">nacrt</span>}
          {missing.map((l) => <span key={l} className="a-badge a-badge-warn">fali {l.toUpperCase()}</span>)}
          {places.length ? places.map((pl) => <span key={pl} className="a-badge a-badge-line">{pl}</span>) : !legal && page.slug !== 'home' && <span className="a-badge a-badge-line">nije u meniju</span>}
        </div>
        <span className="a-card-foot">{page.blocks.length} blokova · {formatDate(page.updatedAt)}{page.updatedBy ? ` · ${page.updatedBy}` : ''}</span>
      </Link>
    </li>
  )
}

function DeletedPages({ onClose }: { onClose: () => void }) {
  const { setSite, toast } = useAdmin()
  const [list, setList] = useState<DeletedPage[] | null>(null)
  useEffect(() => {
    api.deletedPages().then(setList).catch((err) => toast((err as Error).message, 'error'))
  }, [toast])

  const restore = async (item: DeletedPage) => {
    try {
      const rev = await api.revision<Page>(item.id)
      const page = { ...rev.data, slug: item.key, draft: true }
      const version = await api.createPage(page)
      setSite((s) => ({ ...s, pages: [...s.pages, { ...page, updatedAt: version }] }))
      setList((l) => l?.filter((x) => x.key !== item.key) ?? null)
      toast(`Stranica /${item.key} je vraćena kao nacrt.`)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <Modal title="Obrisane stranice" onClose={onClose}>
      {!list ? <p className="a-muted">Učitavanje…</p> : list.length === 0 ? <Empty title="Nema obrisanih stranica" /> : (
        <ul className="a-rows">
          {list.map((item) => (
            <li key={item.key} className="a-row">
              <div>
                <strong>/{item.key}</strong>
                <span className="a-muted">{formatDate(item.createdAt)}</span>
              </div>
              <button type="button" className="a-btn a-btn-sm" onClick={() => void restore(item)}>Vrati</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
