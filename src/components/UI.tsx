import { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <header className="page-head">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {intro && <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 720, marginTop: '0.8rem' }}>{intro}</p>}
      </div>
    </header>
  )
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

export function Section({ children, alt }: { children: ReactNode; alt?: boolean }) {
  return <section className={`section ${alt ? 'section-alt' : ''}`}><div className="container">{children}</div></section>
}
