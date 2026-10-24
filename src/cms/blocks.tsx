import { ReactNode, useEffect, useState } from 'react'
import { useLang } from '../context/LanguageContext'
import RichText, { isEmptyRich } from './RichText'
import { imageUrl, SmartLink } from './links'
import { ui } from './ui'
import type { Block, Button, Lang, LText } from './types'
import { PrayerMonth, PrayerToday } from './prayer'
import MembershipForm from './MembershipForm'

/** Vraća tekst na aktivnom jeziku, a ako ga nema, na drugom. */
export const t = (text: LText | undefined, lang: Lang) => (text ? text[lang] || text[lang === 'bs' ? 'de' : 'bs'] || '' : '')

function Buttons({ buttons, lang }: { buttons: Button[]; lang: Lang }) {
  const visible = buttons.filter((b) => t(b.label, lang) && b.href)
  if (!visible.length) return null
  return (
    <div className="btn-row">
      {visible.map((b, i) => (
        <SmartLink key={i} href={b.href} className={`btn ${b.style === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}>
          {t(b.label, lang)}
        </SmartLink>
      ))}
    </div>
  )
}

function Head({ eyebrow, title, intro, lang, center }: { eyebrow?: LText; title?: LText; intro?: LText; lang: Lang; center?: boolean }) {
  const e = t(eyebrow, lang)
  const h = t(title, lang)
  const p = t(intro, lang)
  if (!e && !h && !p) return null
  return (
    <header className={`blk-head ${center ? 'center' : ''}`}>
      {e && <span className="eyebrow">{e}</span>}
      {h && <h2>{h}</h2>}
      {p && <p className="lead">{p}</p>}
    </header>
  )
}

function Section({ block, children, wide }: { block: Block; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`blk blk-${block.type} tone-${block.tone ?? 'default'}`} data-block={block.id}>
      <div className={`container ${wide ? 'container-wide' : ''} reveal`}>{children}</div>
    </section>
  )
}

const initials = (name: string) =>
  name.replace(/^(mr\.|dr\.|hfz\.)\s*/i, '').split(/\s+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((w) => w[0]).join('')

export function BlockView({ block }: { block: Block }) {
  const { lang } = useLang()
  const s = ui(lang)

  switch (block.type) {
    case 'hero':
      return <Hero block={block} lang={lang} />

    case 'text':
      return (
        <Section block={block}>
          <div className={`text-block ${block.align === 'center' ? 'center' : ''}`}>
            <Head eyebrow={block.eyebrow} title={block.title} lang={lang} center={block.align === 'center'} />
            <RichText doc={block.body[lang]} />
          </div>
        </Section>
      )

    case 'image':
      if (!block.image) return null
      return (
        <Section block={block} wide={block.size === 'wide'}>
          <figure className="figure">
            <img src={imageUrl(block.image)} alt={t(block.alt, lang)} loading="lazy" />
            {t(block.caption, lang) && <figcaption>{t(block.caption, lang)}</figcaption>}
          </figure>
        </Section>
      )

    case 'imageText':
      return (
        <Section block={block}>
          <div className={`split ${block.imageSide === 'right' ? 'image-right' : ''}`}>
            {block.image && (
              <div className="split-media">
                <img src={imageUrl(block.image)} alt={t(block.alt, lang)} loading="lazy" />
              </div>
            )}
            <div className="split-body">
              <Head eyebrow={block.eyebrow} title={block.title} lang={lang} />
              <RichText doc={block.body[lang]} />
              <Buttons buttons={block.buttons} lang={lang} />
            </div>
          </div>
        </Section>
      )

    case 'cards':
      return (
        <Section block={block}>
          <Head eyebrow={block.eyebrow} title={block.title} intro={block.intro} lang={lang} />
          <div className="cards">
            {block.items.map((c, i) => {
              const inner = (
                <>
                  {c.image && (
                    <div className="card-media">
                      <img src={imageUrl(c.image)} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="card-body">
                    <h3>{t(c.title, lang)}</h3>
                    {t(c.text, lang) && <p>{t(c.text, lang)}</p>}
                    {c.href && <span className="card-more" aria-hidden="true">→</span>}
                  </div>
                </>
              )
              return c.href ? (
                <SmartLink key={i} href={c.href} className={`card ${c.image ? '' : 'card-plain'}`}>
                  {inner}
                </SmartLink>
              ) : (
                <article key={i} className={`card ${c.image ? '' : 'card-plain'}`}>
                  {inner}
                </article>
              )
            })}
          </div>
        </Section>
      )

    case 'list': {
      const Tag = block.style === 'numbers' ? 'ol' : 'ul'
      return (
        <Section block={block}>
          <Head eyebrow={block.eyebrow} title={block.title} intro={block.intro} lang={lang} />
          <Tag className={`list list-${block.style}`}>
            {block.items.map((item, i) => (
              <li key={i}>{t(item, lang)}</li>
            ))}
          </Tag>
        </Section>
      )
    }

    case 'stats':
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <dl className="stats">
            {block.items.map((item, i) => (
              <div key={i} className="stat">
                <dt>{t(item.label, lang)}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )

    case 'timeline':
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <ol className="timeline">
            {block.items.map((item, i) => (
              <li key={i}>
                <span className="timeline-date">{item.date}</span>
                <p>{t(item.text, lang)}</p>
              </li>
            ))}
          </ol>
        </Section>
      )

    case 'faq':
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <div className="faq">
            {block.items.map((item, i) => (
              <details key={i}>
                <summary>
                  <span>{t(item.q, lang)}</span>
                </summary>
                <RichText doc={item.a[lang]} />
              </details>
            ))}
          </div>
        </Section>
      )

    case 'people':
      return (
        <Section block={block}>
          <Head title={block.title} intro={block.intro} lang={lang} />
          <ul className={`people ${block.items.some((p) => p.image) ? '' : 'people-compact'}`}>
            {block.items.map((p, i) => (
              <li key={i} className="person">
                {p.image ? (
                  <img src={imageUrl(p.image)} alt="" loading="lazy" className="avatar" />
                ) : (
                  <span className="avatar avatar-initials" aria-hidden="true">{initials(p.name)}</span>
                )}
                <div>
                  <strong>{p.name}</strong>
                  {t(p.role, lang) && <span>{t(p.role, lang)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )

    case 'gallery':
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <Gallery images={block.images.map((g) => ({ src: imageUrl(g.image), alt: t(g.alt, lang) }))} labels={s} />
        </Section>
      )

    case 'quote':
      return (
        <Section block={block}>
          <figure className="quote">
            {block.arabic && <p className="arabic" lang="ar" dir="rtl">{block.arabic}</p>}
            <blockquote>{t(block.text, lang)}</blockquote>
            {t(block.source, lang) && <figcaption>{t(block.source, lang)}</figcaption>}
          </figure>
        </Section>
      )

    case 'cta':
      return (
        <Section block={block}>
          <div className="cta">
            <div>
              <h2>{t(block.title, lang)}</h2>
              {t(block.text, lang) && <p>{t(block.text, lang)}</p>}
            </div>
            <Buttons buttons={block.buttons} lang={lang} />
          </div>
        </Section>
      )

    case 'info':
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <dl className="info">
            {block.items.map((item, i) => (
              <div key={i} className="info-row">
                <dt>{t(item.label, lang)}</dt>
                <dd>{item.href ? <SmartLink href={item.href}>{t(item.value, lang)}</SmartLink> : t(item.value, lang)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )

    case 'prayerTimes':
      return (
        <Section block={block}>
          <Head title={block.title} intro={block.intro} lang={lang} />
          <PrayerToday />
          {block.variant === 'month' && <PrayerMonth />}
        </Section>
      )

    case 'membershipForm':
      return (
        <Section block={block}>
          <Head title={block.title} intro={block.intro} lang={lang} />
          <MembershipForm />
        </Section>
      )

    case 'map': {
      const d = 0.004
      const bbox = [block.lng - d * 1.6, block.lat - d, block.lng + d * 1.6, block.lat + d].join('%2C')
      return (
        <Section block={block}>
          <Head title={block.title} lang={lang} />
          <div className="map">
            <iframe
              title={t(block.title, lang) || block.address}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${block.lat}%2C${block.lng}`}
            />
            <div className="map-footer">
              <span>{block.address}</span>
              <a className="btn btn-secondary btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.address)}`} target="_blank" rel="noreferrer">
                {s.openMap}
              </a>
            </div>
          </div>
        </Section>
      )
    }

    default:
      return null
  }
}

function Hero({ block, lang }: { block: Extract<Block, { type: 'hero' }>; lang: Lang }) {
  // Blagi parallax pozadine; isključen kad korisnik želi manje animacija.
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setOffset(Math.min(window.scrollY, 800)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section className="hero" data-block={block.id}>
      {block.image && (
        <div className="hero-bg" style={{ transform: `translate3d(0, ${offset * 0.25}px, 0)` }}>
          <img src={imageUrl(block.image)} alt="" />
        </div>
      )}
      <div className="container hero-inner">
        <div className="hero-copy">
          {t(block.eyebrow, lang) && <span className="eyebrow">{t(block.eyebrow, lang)}</span>}
          <h1>{t(block.title, lang)}</h1>
          {t(block.text, lang) && <p className="hero-text">{t(block.text, lang)}</p>}
          <Buttons buttons={block.buttons} lang={lang} />
        </div>
        {block.showPrayer && <PrayerToday compact />}
      </div>
    </section>
  )
}

function Gallery({ images, labels }: { images: { src: string; alt: string }[]; labels: ReturnType<typeof ui> }) {
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, images.length])

  return (
    <>
      <ul className="gallery">
        {images.map((img, i) => (
          <li key={i}>
            <button type="button" onClick={() => setOpen(i)} aria-label={img.alt}>
              <img src={img.src} alt={img.alt} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && images[open] && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <img src={images[open].src} alt={images[open].alt} onClick={(e) => e.stopPropagation()} />
          <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen((open - 1 + images.length) % images.length)}>← {labels.previous}</button>
            <span>{open + 1} / {images.length}</span>
            <button type="button" onClick={() => setOpen((open + 1) % images.length)}>{labels.next} →</button>
          </div>
          <button type="button" className="lightbox-close" onClick={() => setOpen(null)} aria-label={labels.close}>✕</button>
        </div>
      )}
    </>
  )
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.filter((b) => !b.hidden).map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </>
  )
}

export { isEmptyRich }
