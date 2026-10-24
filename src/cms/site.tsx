import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import type { Page, SiteContent } from './types'
import bundled from './site.json'

// Backend (backend/IKC.Api). Lokalno Vite prosljeđuje /api na backend, u produkciji VITE_API_URL pokazuje na MonsterASP.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const CACHE_KEY = 'ikc-site-v1'

/**
 * Sadržaj stranice: odmah prikazujemo sadržaj ugrađen u build (src/cms/site.json, preuzet sa API-ja prilikom builda)
 * ili zadnji keširani, a u pozadini učitamo aktuelni sa API-ja. Tako izmjene iz admin panela vide svi odmah,
 * bez novog builda, a stranica radi i kad je API spor ili nedostupan.
 */
function initialSite(): SiteContent {
  const fromBuild = withoutDrafts(bundled as SiteContent)
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null') as { site: SiteContent; at: number } | null
    if (cached?.site?.pages?.length) return cached.site
  } catch {
    /* privatni prozor ili pun storage */
  }
  return fromBuild
}

const withoutDrafts = (site: SiteContent): SiteContent => ({ ...site, pages: site.pages.filter((p) => !p.draft) })

interface SiteCtx {
  site: SiteContent
  /** Admin pregled: prikaži ovu verziju stranice umjesto objavljene. */
  preview: Page | null
  setPreview: (page: Page | null) => void
  refresh: () => Promise<void>
}

const Ctx = createContext<SiteCtx | null>(null)

export function SiteProvider({ children, initial }: { children: ReactNode; initial?: SiteContent }) {
  const [site, setSite] = useState<SiteContent>(() => initial ?? initialSite())
  const [preview, setPreview] = useState<Page | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/site`, { cache: 'no-cache' })
      if (!response.ok) return
      const fresh = (await response.json()) as SiteContent
      if (!fresh?.pages?.length) return
      setSite(fresh)
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({ site: fresh, at: Date.now() }))
      } catch {
        /* nije bitno */
      }
    } catch {
      /* API nedostupan: ostaje ugrađeni/keširani sadržaj */
    }
  }, [])

  useEffect(() => {
    if (initial) return
    void refresh()
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [initial, refresh])

  return <Ctx.Provider value={{ site, preview, setPreview, refresh }}>{children}</Ctx.Provider>
}

export function useSite() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSite mora biti unutar SiteProvider')
  return ctx
}

export function usePage(slug: string): Page | undefined {
  const { site, preview } = useSite()
  if (preview && preview.slug === slug) return preview
  return site.pages.find((p) => p.slug === slug)
}
