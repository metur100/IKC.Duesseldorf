import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'
import type { Lang } from '../cms/types'

/** Prozor preko ekrana; na mobitelu se otvara odozdo preko cijele širine. */
export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('a-modal-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('a-modal-open')
    }
  }, [onClose])

  return createPortal(
    <div className="adm a-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="a-modal-head">
          <h2>{title}</h2>
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Zatvori"><Icon name="close" /></button>
        </header>
        <div className="a-modal-body">{children}</div>
        {footer && <footer className="a-modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export function LangToggle({ lang, setLang, missing }: { lang: Lang; setLang: (l: Lang) => void; missing?: Lang[] }) {
  return (
    <div className="a-seg" role="group" aria-label="Jezik koji uređujete">
      {(['bs', 'de'] as Lang[]).map((l) => (
        <button key={l} type="button" className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
          {missing?.includes(l) && <span className="a-dot" title="Nedostaje prijevod" />}
        </button>
      ))}
    </div>
  )
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="a-empty">
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
