import type { Json } from './api'
import { fieldLabel } from './labels'

// Forma koja se gradi iz oblika JSON-a sekcije: tekst → input/textarea, lista → stavke koje se mogu
// dodavati, brisati i pomjerati, objekat → grupa polja. Nova stavka liste kopira oblik prve originalne
// stavke (`original`), jer backend prihvata samo izmjene koje zadržavaju oblik sadržaja.

type JsonObject = { [key: string]: Json }

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function blank(template: Json): Json {
  if (typeof template === 'string') return ''
  if (typeof template === 'number') return 0
  if (typeof template === 'boolean') return false
  if (Array.isArray(template)) return []
  if (isObject(template)) return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, blank(v)]))
  return null
}

function summary(value: Json): string {
  if (typeof value === 'string') return value
  if (isObject(value)) {
    const first = Object.values(value).find((v) => typeof v === 'string' && v.trim())
    return typeof first === 'string' ? first : ''
  }
  return ''
}

interface EditorProps {
  value: Json
  original: Json | undefined
  onChange: (value: Json) => void
  label?: string
}

export default function JsonEditor({ value, original, onChange, label }: EditorProps) {
  if (typeof value === 'string') return <TextField label={label} value={value} onChange={onChange} />

  if (typeof value === 'number') {
    return (
      <div className="field">
        {label && <label>{label}</label>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <label className="admin-check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}
      </label>
    )
  }

  if (Array.isArray(value)) {
    const template = Array.isArray(original) && original.length > 0 ? original[0] : value[0]
    return <ArrayEditor label={label} value={value} template={template} onChange={onChange} />
  }

  if (isObject(value)) {
    const fields = Object.entries(value).map(([key, child]) => (
      <JsonEditor
        key={key}
        label={fieldLabel(key)}
        value={child}
        original={isObject(original) ? original[key] : undefined}
        onChange={(next) => onChange({ ...value, [key]: next })}
      />
    ))
    return label ? (
      <fieldset className="admin-group">
        <legend>{label}</legend>
        {fields}
      </fieldset>
    ) : (
      <>{fields}</>
    )
  }

  return null
}

function TextField({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const long = value.length > 70 || value.includes('\n')
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {long ? (
        <textarea
          value={value}
          rows={Math.min(14, Math.max(3, Math.ceil(value.length / 90)))}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function ArrayEditor({ label, value, template, onChange }: {
  label?: string
  value: Json[]
  template: Json | undefined
  onChange: (value: Json[]) => void
}) {
  const move = (from: number, to: number) => {
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const remove = (index: number) => {
    const text = summary(value[index])
    if (text && !window.confirm(`Obrisati stavku „${text.slice(0, 60)}“?`)) return
    onChange(value.filter((_, i) => i !== index))
  }
  const add = () => onChange([...value, template === undefined ? '' : blank(template)])

  return (
    <fieldset className="admin-group">
      {label && <legend>{label} <span className="admin-count">{value.length}</span></legend>}
      <ol className="admin-list">
        {value.map((item, index) => (
          <li key={index} className="admin-list-item">
            <div className="admin-list-body">
              <JsonEditor value={item} original={template} onChange={(next) => onChange(value.map((v, i) => (i === index ? next : v)))} />
            </div>
            <div className="admin-list-tools">
              <button type="button" title="Pomjeri gore" disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button>
              <button type="button" title="Pomjeri dole" disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>↓</button>
              <button type="button" title="Obriši" className="danger" onClick={() => remove(index)}>✕</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="admin-btn admin-btn-light" onClick={add} disabled={template === undefined}>
        + Dodaj stavku
      </button>
    </fieldset>
  )
}
