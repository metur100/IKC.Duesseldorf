import { ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'
import type { Button, Lang, LText, RichDoc } from '../cms/types'
import { imageUrl } from '../cms/links'
import type { Field } from './schema'
import { L, emptyRich } from './schema'
import { Icon } from './icons'
import MediaLibrary from './MediaLibrary'
import RichEditor from './RichEditor'
import { useAdmin } from './state'

export interface PageRef { slug: string; title: string }

type Obj = Record<string, unknown>

/** Forma za listu polja (blok ili stavka liste). */
export function Fields({ fields, value, onChange, pages }: { fields: Field[]; value: Obj; onChange: (next: Obj) => void; pages: PageRef[] }) {
  return (
    <div className="a-fields">
      {fields.map((field) => (
        <FieldEditor key={field.key} field={field} value={value[field.key]} pages={pages} onChange={(v) => onChange({ ...value, [field.key]: v })} />
      ))}
    </div>
  )
}

const other = (lang: Lang): Lang => (lang === 'bs' ? 'de' : 'bs')

function Label({ field, htmlFor, missing, children }: { field: { label: string; hint?: string }; htmlFor?: string; missing?: boolean; children?: ReactNode }) {
  return (
    <div className="a-label-row">
      <label htmlFor={htmlFor} className="a-label">
        {field.label}
        {missing && <span className="a-badge a-badge-warn">nema prijevoda</span>}
      </label>
      {children}
      {field.hint && <span className="a-hint">{field.hint}</span>}
    </div>
  )
}

function OtherLang({ value, lang }: { value: string; lang: Lang }) {
  if (!value) return null
  return <p className="a-other-lang"><span>{other(lang).toUpperCase()}</span> {value}</p>
}

function AutoTextarea({ id, value, onChange, rows = 3 }: { id: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return <textarea id={id} ref={ref} className="a-input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
}

export function FieldEditor({ field, value, onChange, pages }: { field: Field; value: unknown; onChange: (v: unknown) => void; pages: PageRef[] }) {
  const { editLang: lang } = useAdmin()
  const id = useId()

  switch (field.kind) {
    case 'ltext':
    case 'ltextarea': {
      const v = (value as LText) ?? L()
      const missing = !v[lang] && !!v[other(lang)]
      return (
        <div className="a-field">
          <Label field={field} htmlFor={id} missing={missing} />
          {field.kind === 'ltext' ? (
            <input id={id} className="a-input" value={v[lang]} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} />
          ) : (
            <AutoTextarea id={id} value={v[lang]} onChange={(text) => onChange({ ...v, [lang]: text })} />
          )}
          <OtherLang value={v[other(lang)]} lang={lang} />
        </div>
      )
    }

    case 'rich': {
      const v = (value as Record<Lang, RichDoc>) ?? emptyRich()
      const empty = (d?: RichDoc) => !d?.content?.length || JSON.stringify(d).indexOf('"text"') === -1
      return (
        <div className="a-field">
          <Label field={field} missing={empty(v[lang]) && !empty(v[other(lang)])} />
          <RichEditor key={lang} value={v[lang]} pages={pages} onChange={(doc) => onChange({ ...v, [lang]: doc })} />
        </div>
      )
    }

    case 'text':
      return (
        <div className="a-field">
          <Label field={field} htmlFor={id} />
          <input id={id} className="a-input" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )

    case 'number':
      return (
        <div className="a-field">
          <Label field={field} htmlFor={id} />
          <input id={id} className="a-input" inputMode="decimal" value={String(value ?? '')} onChange={(e) => onChange(Number(e.target.value.replace(',', '.')) || 0)} />
        </div>
      )

    case 'href':
      return (
        <div className="a-field">
          <Label field={field} htmlFor={id} />
          <HrefInput id={id} value={(value as string) ?? ''} onChange={onChange} pages={pages} />
        </div>
      )

    case 'image':
      return (
        <div className="a-field">
          <Label field={field} />
          <ImagePicker value={(value as string) ?? ''} onChange={onChange} />
        </div>
      )

    case 'bool':
      return (
        <label className="a-switch">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="a-switch-ui" aria-hidden="true" />
          <span>
            <strong>{field.label}</strong>
            {field.hint && <small>{field.hint}</small>}
          </span>
        </label>
      )

    case 'select':
      return (
        <div className="a-field">
          <Label field={field} />
          <div className="a-seg a-seg-wrap" role="radiogroup" aria-label={field.label}>
            {field.options.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={(value ?? field.options[0].value) === o.value}
                className={(value ?? field.options[0].value) === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )

    case 'buttons':
      return <ButtonsEditor label={field.label} value={(value as Button[]) ?? []} onChange={onChange} pages={pages} />

    case 'ltextList':
      return <LTextList label={field.label} itemLabel={field.itemLabel} value={(value as LText[]) ?? []} onChange={onChange} />

    case 'items':
      return <ItemsEditor field={field} value={(value as Obj[]) ?? []} onChange={onChange} pages={pages} />
  }
}

export function HrefInput({ id, value, onChange, pages }: { id?: string; value: string; onChange: (v: string) => void; pages: PageRef[] }) {
  const listId = useId()
  return (
    <>
      <input id={id} className="a-input" list={listId} placeholder="/stranica ili https://…" value={value} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {pages.map((p) => <option key={p.slug} value={p.slug === 'home' ? '/' : `/${p.slug}`}>{p.title}</option>)}
      </datalist>
    </>
  )
}

export function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="a-image">
      {value ? (
        <img src={imageUrl(value)} alt="" />
      ) : (
        <div className="a-image-empty"><Icon name="image" size={26} /></div>
      )}
      <div className="a-image-actions">
        <button type="button" className="a-btn a-btn-sm" onClick={() => setOpen(true)}>{value ? 'Promijeni' : 'Odaberi sliku'}</button>
        {value && <button type="button" className="a-btn a-btn-sm a-btn-ghost" onClick={() => onChange('')}>Ukloni</button>}
      </div>
      {open && <MediaLibrary onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false) }} />}
    </div>
  )
}

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function RowTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="a-row-tools">
      <button type="button" className="a-icon-btn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Gore"><Icon name="up" size={18} /></button>
      <button type="button" className="a-icon-btn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Dolje"><Icon name="down" size={18} /></button>
      <button type="button" className="a-icon-btn danger" onClick={onRemove} aria-label="Ukloni"><Icon name="trash" size={18} /></button>
    </div>
  )
}

function ButtonsEditor({ label, value, onChange, pages }: { label: string; value: Button[]; onChange: (v: Button[]) => void; pages: PageRef[] }) {
  const { editLang: lang } = useAdmin()
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-list">
        {value.map((b, i) => (
          <div key={i} className="a-list-item">
            <div className="a-list-item-fields">
              <input className="a-input" placeholder={`Tekst dugmeta (${lang.toUpperCase()})`} value={b.label[lang]} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: { ...x.label, [lang]: e.target.value } } : x)))} />
              <HrefInput value={b.href} pages={pages} onChange={(href) => onChange(value.map((x, j) => (j === i ? { ...x, href } : x)))} />
              <div className="a-seg">
                {(['primary', 'secondary'] as const).map((style) => (
                  <button key={style} type="button" className={(b.style ?? 'primary') === style ? 'on' : ''} onClick={() => onChange(value.map((x, j) => (j === i ? { ...x, style } : x)))}>
                    {style === 'primary' ? 'Zlatno' : 'Obrub'}
                  </button>
                ))}
              </div>
            </div>
            <RowTools index={i} count={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
        <button type="button" className="a-add" onClick={() => onChange([...value, { label: L(), href: '', style: value.length ? 'secondary' : 'primary' }])}>
          <Icon name="plus" size={18} /> Dodaj dugme
        </button>
      </div>
    </div>
  )
}

function LTextList({ label, itemLabel, value, onChange }: { label: string; itemLabel: string; value: LText[]; onChange: (v: LText[]) => void }) {
  const { editLang: lang } = useAdmin()
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-list">
        {value.map((item, i) => (
          <div key={i} className="a-list-item">
            <div className="a-list-item-fields">
              <AutoTextarea id={`l${i}`} rows={1} value={item[lang]} onChange={(text) => onChange(value.map((x, j) => (j === i ? { ...x, [lang]: text } : x)))} />
              <OtherLang value={item[other(lang)]} lang={lang} />
            </div>
            <RowTools index={i} count={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
        <button type="button" className="a-add" onClick={() => onChange([...value, L()])}>
          <Icon name="plus" size={18} /> Dodaj {itemLabel}
        </button>
      </div>
    </div>
  )
}

function ItemsEditor({ field, value, onChange, pages }: { field: Extract<Field, { kind: 'items' }>; value: Obj[]; onChange: (v: Obj[]) => void; pages: PageRef[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="a-field">
      <span className="a-label">{field.label} <span className="a-count">{value.length}</span></span>
      <div className="a-list">
        {value.map((item, i) => {
          const summary = (field.summary as (x: Obj) => string)(item) || `Stavka ${i + 1}`
          const image = typeof item.image === 'string' && item.image ? item.image : ''
          return (
            <div key={i} className={`a-item ${open === i ? 'open' : ''}`}>
              <div className="a-item-head">
                <button type="button" className="a-item-toggle" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  {image && <img src={imageUrl(image)} alt="" />}
                  <span>{summary}</span>
                  <Icon name={open === i ? 'up' : 'down'} size={16} />
                </button>
                <RowTools index={i} count={value.length} onMove={(to) => { onChange(move(value, i, to)); setOpen(to) }} onRemove={() => { onChange(value.filter((_, j) => j !== i)); setOpen(null) }} />
              </div>
              {open === i && (
                <div className="a-item-body">
                  <Fields fields={field.fields} value={item} pages={pages} onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))} />
                </div>
              )}
            </div>
          )
        })}
        <button type="button" className="a-add" onClick={() => { onChange([...value, field.create()]); setOpen(value.length) }}>
          <Icon name="plus" size={18} /> Dodaj {field.itemLabel}
        </button>
      </div>
    </div>
  )
}
