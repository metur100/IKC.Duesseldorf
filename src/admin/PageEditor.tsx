import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, BlockType, Lang, Page } from '../cms/types'
import { pagePath } from '../cms/types'
import { api, ApiError, type RevisionInfo } from './api'
import { BLOCKS, BLOCK_LIST, blockSummary, L, newId } from './schema'
import { Fields, ImagePicker, type PageRef } from './fields'
import { Icon } from './icons'
import { formatDate, useAdmin } from './state'
import { Empty, LangToggle, Modal, slugify } from './ui'

const SITE_BASE = import.meta.env.BASE_URL

/** Jezici u kojima neki tekst postoji samo na drugom jeziku (za tačkicu na BS/DE prekidaču). */
export function missingLangs(value: unknown): Lang[] {
  const missing = new Set<Lang>()
  const walk = (v: unknown) => {
    if (!v || typeof v !== 'object') return
    if (Array.isArray(v)) return v.forEach(walk)
    const o = v as Record<string, unknown>
    if ('bs' in o && 'de' in o && Object.keys(o).length === 2) {
      const has = (x: unknown) => (typeof x === 'string' ? x.trim() !== '' : JSON.stringify(x ?? '').includes('"text"'))
      if (has(o.bs) && !has(o.de)) missing.add('de')
      if (has(o.de) && !has(o.bs)) missing.add('bs')
      return
    }
    Object.values(o).forEach(walk)
  }
  walk(value)
  return [...missing]
}

export default function PageEditor() {
  const { slug = '' } = useParams()
  const { site, setSite, editLang, setEditLang, toast, reload } = useAdmin()
  const navigate = useNavigate()
  const original = site?.pages.find((p) => p.slug === slug)

  const [page, setPage] = useState<Page | null>(original ?? null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [picker, setPicker] = useState<number | null>(null)
  const [modal, setModal] = useState<'settings' | 'history' | null>(null)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [device, setDevice] = useState<'desktop' | 'mobile'>(() => (window.matchMedia('(min-width: 1200px)').matches ? 'desktop' : 'mobile'))
  const [showPreview, setShowPreview] = useState(() => window.matchMedia('(min-width: 1200px)').matches)

  // Nova verzija sa servera (npr. poslije spašavanja) — samo ako nema lokalnih izmjena.
  useEffect(() => {
    if (original && !dirty) setPage(original)
  }, [original, dirty])

  const update = useCallback((next: Page) => {
    setPage(next)
    setDirty(true)
  }, [])

  const pages: PageRef[] = useMemo(() => (site?.pages ?? []).map((p) => ({ slug: p.slug, title: p.title.bs })), [site])
  const missing = useMemo(() => (page ? missingLangs({ t: page.title, d: page.description, h: page.header, b: page.blocks }) : []), [page])

  const save = useCallback(async () => {
    if (!page || saving) return
    setSaving(true)
    try {
      const version = await api.savePage(slug, page, original?.updatedAt)
      const saved = { ...page, updatedAt: version }
      setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.slug === slug ? saved : p)) }))
      setDirty(false)
      toast(page.draft ? 'Sačuvano kao nacrt.' : 'Sačuvano — izmjene su odmah vidljive na stranici.')
      if (page.slug !== slug) {
        navigate(`/admin/stranice/${page.slug}`, { replace: true })
        void reload() // linkovi u meniju su preimenovani na serveru
      }
    } catch (err) {
      toast((err as Error).message, 'error')
      if (err instanceof ApiError && err.status === 409) void reload()
    } finally {
      setSaving(false)
    }
  }, [page, saving, slug, original?.updatedAt, setSite, toast, navigate, reload])

  // Ctrl/Cmd+S i upozorenje prije zatvaranja sa nesačuvanim izmjenama.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [save, dirty])

  const leave = (to: string) => {
    if (dirty && !window.confirm('Imate nesačuvane izmjene. Želite li izaći bez spašavanja?')) return
    navigate(to)
  }

  if (!site) return <div className="a-page"><p className="a-muted">Učitavanje…</p></div>
  if (!page) return <div className="a-page"><Empty title="Stranica ne postoji" text={`/${slug}`} action={<Link className="a-btn" to="/admin">Nazad na stranice</Link>} /></div>

  const setBlocks = (blocks: Block[]) => update({ ...page, blocks })
  const setBlock = (id: string, block: Block) => setBlocks(page.blocks.map((b) => (b.id === id ? block : b)))
  const insert = (type: BlockType, at: number) => {
    const block = BLOCKS[type].create()
    const blocks = page.blocks.slice()
    blocks.splice(at, 0, block)
    setBlocks(blocks)
    setOpen(block.id)
    setPicker(null)
  }

  return (
    <div className={`a-editor ${showPreview ? 'with-preview' : ''} view-${view}`}>
      <header className="a-editor-bar">
        <button type="button" className="a-icon-btn" onClick={() => leave('/admin')} aria-label="Nazad"><Icon name="left" /></button>
        <div className="a-editor-title">
          <strong>{page.title[editLang] || page.title.bs || 'Bez naslova'}</strong>
          <span>
            {pagePath(page.slug)}
            {page.draft && <span className="a-badge">nacrt</span>}
            {dirty ? <span className="a-badge a-badge-warn">nesačuvano</span> : original?.updatedAt && <span className="a-hide-sm"> · {formatDate(original.updatedAt)}</span>}
          </span>
        </div>
        <LangToggle lang={editLang} setLang={setEditLang} missing={missing} />
        <div className="a-seg a-only-sm">
          <button type="button" className={view === 'edit' ? 'on' : ''} onClick={() => setView('edit')}>Uredi</button>
          <button type="button" className={view === 'preview' ? 'on' : ''} onClick={() => setView('preview')}>Pregled</button>
        </div>
        <button type="button" className={`a-icon-btn a-hide-sm ${showPreview ? 'on' : ''}`} onClick={() => setShowPreview(!showPreview)} title="Pregled uživo" aria-label="Pregled uživo"><Icon name="eye" /></button>
        <button type="button" className="a-icon-btn" onClick={() => setModal('settings')} title="Postavke stranice" aria-label="Postavke stranice"><Icon name="settings" /></button>
        <button type="button" className="a-icon-btn" onClick={() => setModal('history')} title="Historija izmjena" aria-label="Historija izmjena"><Icon name="history" /></button>
        <button type="button" className="a-btn a-btn-primary" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? 'Spašavam…' : dirty ? 'Sačuvaj' : 'Sačuvano'}
        </button>
      </header>

      <div className="a-editor-main">
        <div className="a-editor-blocks">
          {page.blocks.length === 0 && <Empty title="Stranica je prazna" text="Dodajte prvi blok: tekst, sliku, listu…" />}
          <BlockList
            page={page}
            open={open}
            setOpen={setOpen}
            pages={pages}
            onChange={setBlocks}
            onBlockChange={setBlock}
            onInsert={(at) => setPicker(at)}
          />
          <button type="button" className="a-add a-add-block" onClick={() => setPicker(page.blocks.length)}>
            <Icon name="plus" /> Dodaj blok
          </button>
        </div>

        {(showPreview || view === 'preview') && (
          <div className="a-preview">
            <div className="a-preview-bar">
              <div className="a-seg">
                <button type="button" className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')} aria-label="Računar"><Icon name="desktop" size={18} /></button>
                <button type="button" className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')} aria-label="Mobitel"><Icon name="phone" size={18} /></button>
              </div>
              <a className="a-link" href={`${SITE_BASE}${pagePath(page.slug).slice(1)}`} target="_blank" rel="noreferrer">Otvori stranicu <Icon name="external" size={14} /></a>
            </div>
            <PreviewFrame page={page} lang={editLang} device={device} onSelect={(id) => { setOpen(id); setView('edit') }} focus={open} />
          </div>
        )}
      </div>

      {picker !== null && <BlockPicker onClose={() => setPicker(null)} onPick={(type) => insert(type, picker)} />}
      {modal === 'settings' && (
        <PageSettings
          page={page}
          onClose={() => setModal(null)}
          onChange={update}
          onDeleted={() => {
            setDirty(false)
            navigate('/admin')
          }}
        />
      )}
      {modal === 'history' && (
        <History
          slug={slug}
          onClose={() => setModal(null)}
          onRestore={(restored) => {
            update({ ...restored, slug: page.slug })
            setModal(null)
            toast('Stara verzija je učitana. Pregledajte je i kliknite "Sačuvaj" da je vratite.')
          }}
        />
      )}
    </div>
  )
}

function BlockList({ page, open, setOpen, pages, onChange, onBlockChange, onInsert }: {
  page: Page
  open: string | null
  setOpen: (id: string | null) => void
  pages: PageRef[]
  onChange: (blocks: Block[]) => void
  onBlockChange: (id: string, block: Block) => void
  onInsert: (at: number) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = page.blocks.findIndex((b) => b.id === active.id)
    const to = page.blocks.findIndex((b) => b.id === over.id)
    onChange(arrayMove(page.blocks, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ol className="a-blocks">
          {page.blocks.map((block, i) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={i}
              count={page.blocks.length}
              open={open === block.id}
              pages={pages}
              onToggle={() => setOpen(open === block.id ? null : block.id)}
              onChange={(b) => onBlockChange(block.id, b)}
              onMove={(to) => onChange(arrayMove(page.blocks, i, to))}
              onDuplicate={() => {
                const copy = { ...structuredClone(block), id: newId() }
                const blocks = page.blocks.slice()
                blocks.splice(i + 1, 0, copy)
                onChange(blocks)
                setOpen(copy.id)
              }}
              onRemove={() => {
                if (window.confirm(`Obrisati blok "${BLOCKS[block.type]?.label ?? block.type}"?`)) onChange(page.blocks.filter((b) => b.id !== block.id))
              }}
              onInsertAfter={() => onInsert(i + 1)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function SortableBlock({ block, index, count, open, pages, onToggle, onChange, onMove, onDuplicate, onRemove, onInsertAfter }: {
  block: Block
  index: number
  count: number
  open: boolean
  pages: PageRef[]
  onToggle: () => void
  onChange: (b: Block) => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onRemove: () => void
  onInsertAfter: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const def = BLOCKS[block.type]
  const ref = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open])

  return (
    <li
      ref={(el) => { setNodeRef(el); ref.current = el }}
      className={`a-block ${open ? 'open' : ''} ${block.hidden ? 'is-hidden' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="a-block-head">
        <button type="button" className="a-grip" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Prevuci za promjenu redoslijeda"><Icon name="grip" /></button>
        <button type="button" className="a-block-title" onClick={onToggle} aria-expanded={open}>
          <span className="a-block-type">{def?.label ?? block.type}{block.hidden && <span className="a-badge">sakriveno</span>}</span>
          <span className="a-block-summary">{blockSummary(block) || def?.description}</span>
        </button>
        <div className="a-block-tools">
          <button type="button" className="a-icon-btn a-hide-xs" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Pomjeri gore"><Icon name="up" size={18} /></button>
          <button type="button" className="a-icon-btn a-hide-xs" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Pomjeri dolje"><Icon name="down" size={18} /></button>
          <button type="button" className="a-icon-btn" onClick={() => onChange({ ...block, hidden: !block.hidden })} aria-label={block.hidden ? 'Prikaži' : 'Sakrij'} title={block.hidden ? 'Prikaži na stranici' : 'Sakrij sa stranice'}><Icon name={block.hidden ? 'eyeOff' : 'eye'} size={18} /></button>
          <button type="button" className="a-icon-btn" onClick={onToggle} aria-label={open ? 'Zatvori' : 'Uredi'}><Icon name={open ? 'up' : 'edit'} size={18} /></button>
        </div>
      </div>
      {open && def && (
        <div className="a-block-body">
          <Fields fields={def.fields} value={block as unknown as Record<string, unknown>} pages={pages} onChange={(next) => onChange(next as unknown as Block)} />
          <div className="a-block-foot">
            <button type="button" className="a-btn a-btn-sm" onClick={onDuplicate}><Icon name="copy" size={16} /> Dupliraj</button>
            <button type="button" className="a-btn a-btn-sm a-only-xs" disabled={index === 0} onClick={() => onMove(index - 1)}><Icon name="up" size={16} /> Gore</button>
            <button type="button" className="a-btn a-btn-sm a-only-xs" disabled={index === count - 1} onClick={() => onMove(index + 1)}><Icon name="down" size={16} /> Dolje</button>
            <button type="button" className="a-btn a-btn-sm a-btn-danger" onClick={onRemove}><Icon name="trash" size={16} /> Obriši blok</button>
          </div>
        </div>
      )}
      <button type="button" className="a-insert" onClick={onInsertAfter} aria-label="Dodaj blok ovdje" title="Dodaj blok ovdje"><Icon name="plus" size={16} /></button>
    </li>
  )
}

export function BlockPicker({ onClose, onPick }: { onClose: () => void; onPick: (type: BlockType) => void }) {
  const groups = ['Tekst', 'Mediji', 'Liste', 'Posebno'] as const
  return (
    <Modal title="Dodaj blok" onClose={onClose} wide>
      {groups.map((g) => (
        <section key={g} className="a-picker-group">
          <h3>{g}</h3>
          <div className="a-picker">
            {BLOCK_LIST.filter((d) => d.group === g).map((d) => (
              <button key={d.type} type="button" className="a-picker-item" onClick={() => onPick(d.type)}>
                <strong>{d.label}</strong>
                <span>{d.description}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </Modal>
  )
}

function PageSettings({ page, onClose, onChange, onDeleted }: { page: Page; onClose: () => void; onChange: (p: Page) => void; onDeleted: () => void }) {
  const { editLang: lang, setSite, toast } = useAdmin()
  const [busy, setBusy] = useState(false)
  const isHome = page.slug === 'home'
  const setL = (key: 'title' | 'description', value: string) => onChange({ ...page, [key]: { ...page[key], [lang]: value } })
  const setH = (key: 'eyebrow' | 'intro', value: string) => onChange({ ...page, header: { ...page.header, [key]: { ...page.header[key], [lang]: value } } })

  const remove = async () => {
    if (!window.confirm(`Obrisati stranicu "${page.title.bs}"? Može se vratiti iz liste obrisanih stranica.`)) return
    setBusy(true)
    try {
      await api.deletePage(page.slug)
      setSite((s) => ({ ...s, pages: s.pages.filter((p) => p.slug !== page.slug) }))
      toast('Stranica je obrisana.')
      onDeleted()
    } catch (err) {
      toast((err as Error).message, 'error')
      setBusy(false)
    }
  }

  return (
    <Modal title="Postavke stranice" onClose={onClose} footer={<button type="button" className="a-btn a-btn-primary" onClick={onClose}>Gotovo</button>}>
      <p className="a-muted">Tekstovi se unose za jezik: <strong>{lang.toUpperCase()}</strong> (promijenite gore desno).</p>
      <div className="a-fields">
        <div className="a-field">
          <label className="a-label" htmlFor="ps-title">Naslov stranice</label>
          <input id="ps-title" className="a-input" value={page.title[lang]} onChange={(e) => setL('title', e.target.value)} />
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="ps-slug">Adresa (URL)</label>
          <div className="a-prefix">
            <span>/</span>
            <input id="ps-slug" className="a-input" value={isHome ? '' : page.slug} disabled={isHome} placeholder={isHome ? 'početna' : ''} onChange={(e) => onChange({ ...page, slug: slugify(e.target.value) || page.slug })} />
          </div>
          {!isHome && <span className="a-hint">Ako promijenite adresu, linkovi u meniju se automatski ažuriraju.</span>}
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="ps-desc">Opis za Google i dijeljenje</label>
          <textarea id="ps-desc" className="a-input" rows={3} value={page.description[lang]} onChange={(e) => setL('description', e.target.value)} />
          <span className="a-hint">{page.description[lang].length}/160 znakova</span>
        </div>
        {!isHome && (
          <>
            <h3 className="a-subhead">Zaglavlje stranice</h3>
            <div className="a-field">
              <label className="a-label" htmlFor="ps-eyebrow">Nadnaslov</label>
              <input id="ps-eyebrow" className="a-input" value={page.header.eyebrow[lang]} onChange={(e) => setH('eyebrow', e.target.value)} />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ps-intro">Uvod</label>
              <textarea id="ps-intro" className="a-input" rows={3} value={page.header.intro[lang]} onChange={(e) => setH('intro', e.target.value)} />
            </div>
            <div className="a-field">
              <span className="a-label">Pozadinska slika zaglavlja (opcionalno)</span>
              <ImagePicker value={page.header.image} onChange={(image) => onChange({ ...page, header: { ...page.header, image } })} />
            </div>
          </>
        )}
        {!isHome && (
          <label className="a-switch">
            <input type="checkbox" checked={!!page.draft} onChange={(e) => onChange({ ...page, draft: e.target.checked })} />
            <span className="a-switch-ui" aria-hidden="true" />
            <span>
              <strong>Nacrt (nije objavljeno)</strong>
              <small>Posjetioci ne vide stranicu dok ovo ne isključite i sačuvate.</small>
            </span>
          </label>
        )}
        {!isHome && (
          <div className="a-danger-zone">
            <button type="button" className="a-btn a-btn-danger" disabled={busy} onClick={() => void remove()}><Icon name="trash" size={16} /> Obriši stranicu</button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function History({ slug, onClose, onRestore }: { slug: string; onClose: () => void; onRestore: (page: Page) => void }) {
  const { toast } = useAdmin()
  const [list, setList] = useState<RevisionInfo[] | null>(null)
  useEffect(() => {
    api.revisions('page', slug).then(setList).catch((err) => toast((err as Error).message, 'error'))
  }, [slug, toast])

  const load = async (id: number) => {
    try {
      const rev = await api.revision<Page>(id)
      onRestore(rev.data)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <Modal title="Historija izmjena" onClose={onClose}>
      <p className="a-muted">Čuva se zadnjih 30 verzija. Odaberite verziju, pregledajte je i sačuvajte da je vratite.</p>
      {!list ? <p className="a-muted">Učitavanje…</p> : list.length === 0 ? <Empty title="Još nema ranijih verzija" /> : (
        <ul className="a-rows">
          {list.map((r) => (
            <li key={r.id} className="a-row">
              <div>
                <strong>{formatDate(r.createdAt)}</strong>
                <span className="a-muted">{r.createdBy ?? '—'}</span>
              </div>
              <button type="button" className="a-btn a-btn-sm" onClick={() => void load(r.id)}>Učitaj</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

/** Pregled uživo: prava stranica u iframeu (prava širina ekrana za mobilni prikaz), sadržaj dolazi preko postMessage. */
function PreviewFrame({ page, lang, device, onSelect, focus }: { page: Page; lang: Lang; device: 'desktop' | 'mobile'; onSelect: (id: string) => void; focus: string | null }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)

  const post = useCallback((message: unknown) => frame.current?.contentWindow?.postMessage(message, window.location.origin), [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'ikc-preview-ready') {
        ready.current = true
        post({ type: 'ikc-preview', page, lang })
      }
      if (e.data?.type === 'ikc-preview-select' && typeof e.data.id === 'string') onSelect(e.data.id)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [page, lang, post, onSelect])

  useEffect(() => {
    if (!ready.current) return
    const t = window.setTimeout(() => post({ type: 'ikc-preview', page, lang }), 150)
    return () => window.clearTimeout(t)
  }, [page, lang, post])

  useEffect(() => {
    if (focus && ready.current) post({ type: 'ikc-preview-focus', id: focus })
  }, [focus, post])

  // Desktop pregled: stranica široka 1280px, umanjena da stane u panel.
  const stage = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const DESKTOP = 1280
  const scale = device === 'desktop' && box.w > 0 && box.w < DESKTOP ? box.w / DESKTOP : 1
  const style = device === 'desktop' && scale < 1
    ? { width: DESKTOP, height: box.h / scale, transform: `scale(${scale})`, transformOrigin: '0 0' }
    : undefined

  return (
    <div ref={stage} className={`a-preview-stage ${device}`}>
      <iframe ref={frame} title="Pregled stranice" src={`${SITE_BASE}admin/preview`} style={style} />
    </div>
  )
}

/** Nova stranica: naslov → adresa se pravi sama. */
export function NewPageModal({ onClose }: { onClose: () => void }) {
  const { site, setSite, toast } = useAdmin()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const finalSlug = touched ? slug : slugify(title)
  const exists = !!site?.pages.some((p) => p.slug === finalSlug)

  const create = async () => {
    if (!title.trim() || !finalSlug || exists) return
    setBusy(true)
    const page: Page = {
      slug: finalSlug,
      title: L(title.trim(), ''),
      description: L(),
      header: { eyebrow: L(), intro: L(), image: '' },
      blocks: [BLOCKS.text.create()],
      draft: true,
    }
    try {
      const version = await api.createPage(page)
      setSite((s) => ({ ...s, pages: [...s.pages, { ...page, updatedAt: version }] }))
      toast('Stranica je napravljena kao nacrt.')
      navigate(`/admin/stranice/${finalSlug}`)
    } catch (err) {
      toast((err as Error).message, 'error')
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Nova stranica"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="a-btn" onClick={onClose}>Odustani</button>
          <button type="button" className="a-btn a-btn-primary" disabled={busy || !title.trim() || !finalSlug || exists} onClick={() => void create()}>Napravi stranicu</button>
        </>
      }
    >
      <div className="a-fields">
        <div className="a-field">
          <label className="a-label" htmlFor="np-title">Naslov (BS)</label>
          <input id="np-title" className="a-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void create()} placeholder="npr. Ramazan 2027" />
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="np-slug">Adresa</label>
          <div className="a-prefix">
            <span>/</span>
            <input id="np-slug" className="a-input" value={finalSlug} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)) }} />
          </div>
          {exists && <span className="a-hint a-error">Ova adresa već postoji.</span>}
        </div>
        <p className="a-muted">Stranica se pravi kao nacrt. Kad je spremna, isključite "Nacrt" u postavkama stranice i dodajte je u meni pod "Navigacija".</p>
      </div>
    </Modal>
  )
}
