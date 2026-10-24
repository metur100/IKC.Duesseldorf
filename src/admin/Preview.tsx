import { useEffect, useState } from 'react'
import { FixedLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { PageContent } from '../pages/PageView'
import type { Lang, Page } from '../cms/types'

/**
 * /admin/preview: otvara se u iframeu editora. Prikazuje stranicu tačno kao na sajtu (isti CSS i komponente),
 * a sadržaj (i nesačuvane izmjene) dobija od editora preko postMessage. Klik na blok ga otvara u editoru.
 */
export default function Preview() {
  const [state, setState] = useState<{ page: Page; lang: Lang } | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('is-preview')
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return
      if (e.data?.type === 'ikc-preview') setState({ page: e.data.page, lang: e.data.lang })
      if (e.data?.type === 'ikc-preview-focus') {
        document.querySelector(`[data-block="${CSS.escape(e.data.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Linkovi u pregledu ne vode nigdje, da se ne izgubi pregled.
      if (target.closest('a')) e.preventDefault()
      const block = target.closest<HTMLElement>('[data-block]')
      if (block) window.parent.postMessage({ type: 'ikc-preview-select', id: block.dataset.block }, window.location.origin)
    }
    window.addEventListener('message', onMessage)
    document.addEventListener('click', onClick, true)
    window.parent.postMessage({ type: 'ikc-preview-ready' }, window.location.origin)
    return () => {
      window.removeEventListener('message', onMessage)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  if (!state) return null
  const overHero = state.page.blocks.find((b) => !b.hidden)?.type === 'hero'

  return (
    <FixedLanguage lang={state.lang}>
      <Header overHero={overHero} />
      <main className={overHero ? 'has-hero' : ''}>
        <PageContent page={state.page} />
      </main>
      <Footer />
    </FixedLanguage>
  )
}
