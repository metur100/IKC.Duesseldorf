import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import bundled from '@/cms/site.json'
import type { Page, SiteContent } from '@/cms/types'
import { fetchJson } from './config'

const KEY = 'ikcd:site:v1'
/** Nacrti (draft) su vidljivi samo adminima na webu. */
const clean = (s: SiteContent): SiteContent => ({ ...s, pages: s.pages.filter((p) => p && !p.draft) })
const BUNDLED = clean(bundled as unknown as SiteContent)

function isValid(x: unknown): x is SiteContent {
  const s = x as SiteContent | null
  return !!s && typeof s === 'object' && !!s.settings && Array.isArray(s.pages) && s.pages.some((p) => p?.slug === 'home')
}

interface ContentCtx {
  site: SiteContent
  /** 'bundled' | 'cache' | 'live' */
  source: 'bundled' | 'cache' | 'live'
  refreshing: boolean
  /** Zadnje osvježavanje nije uspjelo */
  offline: boolean
  refresh: () => Promise<void>
  getPage: (slug: string) => Page | undefined
}

const Ctx = createContext<ContentCtx | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteContent>(BUNDLED)
  const [source, setSource] = useState<ContentCtx['source']>('bundled')
  const [refreshing, setRefreshing] = useState(false)
  const [offline, setOffline] = useState(false)
  const lastFetch = useRef(0)
  const gotLive = useRef(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await fetchJson<SiteContent>('/api/site')
      if (!isValid(data)) throw new Error('invalid content')
      gotLive.current = true
      setSite(clean(data))
      setSource('live')
      setOffline(false)
      lastFetch.current = Date.now()
      AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {})
    } catch {
      setOffline(true)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw || gotLive.current) return
        const data = JSON.parse(raw)
        if (isValid(data)) {
          setSite(clean(data))
          setSource('cache')
        }
      })
      .catch(() => {})
      .finally(() => {
        refresh()
      })
    // Osvježi kad se aplikacija vrati u prvi plan (najviše svakih 10 min)
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && Date.now() - lastFetch.current > 10 * 60 * 1000) refresh()
    })
    return () => {
      alive = false
      sub.remove()
    }
  }, [refresh])

  const value = useMemo<ContentCtx>(() => {
    const bySlug = new Map(site.pages.map((p) => [p.slug, p]))
    return { site, source, refreshing, offline, refresh, getPage: (slug) => bySlug.get(slug) }
  }, [site, source, refreshing, offline, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useContent() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useContent outside ContentProvider')
  return c
}
