import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { usePage } from '../cms/site'
import { Blocks, t } from '../cms/blocks'
import { imageUrl } from '../cms/links'
import { ui } from '../cms/ui'
import type { Page } from '../cms/types'

/** Elementi sa klasom .reveal se blago pojave kad uđu u ekran. */
export function useReveal(dep: unknown) {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'))
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}

export function PageContent({ page }: { page: Page }) {
  const { lang } = useLang()
  const isHome = page.slug === 'home'
  const startsWithHero = page.blocks.find((b) => !b.hidden)?.type === 'hero'
  useReveal(page)

  return (
    <>
      {page.draft && <div className="draft-banner">{ui(lang).draft}</div>}
      {!isHome && !startsWithHero && (
        <header className={`page-head ${page.header.image ? 'has-image' : ''}`}>
          {page.header.image && (
            <div className="page-head-bg">
              <img src={imageUrl(page.header.image)} alt="" />
            </div>
          )}
          <div className="container">
            {t(page.header.eyebrow, lang) && <span className="eyebrow">{t(page.header.eyebrow, lang)}</span>}
            <h1>{t(page.title, lang)}</h1>
            {t(page.header.intro, lang) && <p>{t(page.header.intro, lang)}</p>}
          </div>
        </header>
      )}
      <Blocks blocks={page.blocks} />
    </>
  )
}

export default function PageView({ slug }: { slug: string }) {
  const page = usePage(slug)
  if (!page) return <NotFound />
  return <PageContent page={page} />
}

export function NotFound() {
  const { lang } = useLang()
  const s = ui(lang)
  const { pathname } = useLocation()
  return (
    <header className="page-head not-found">
      <div className="container">
        <span className="eyebrow">404 · {pathname}</span>
        <h1>{s.notFoundTitle}</h1>
        <p>{s.notFoundText}</p>
        <Link to="/" className="btn btn-primary">{s.backHome}</Link>
      </div>
    </header>
  )
}
