import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, type AdminSite, type ImageInfo } from './api'
import type { Lang } from '../cms/types'

type ToastKind = 'ok' | 'error'
interface Toast { id: number; kind: ToastKind; text: string }

interface AdminCtx {
  site: AdminSite | null
  setSite: (update: (site: AdminSite) => AdminSite) => void
  reload: () => Promise<void>
  loadError: string
  /** Jezik koji admin trenutno uređuje (ne mijenja jezik stranice). */
  editLang: Lang
  setEditLang: (lang: Lang) => void
  toast: (text: string, kind?: ToastKind) => void
  images: ImageInfo[] | null
  loadImages: () => Promise<void>
  addImage: (image: ImageInfo) => void
  user: { username: string; displayName: string }
}

const Ctx = createContext<AdminCtx | null>(null)

export function AdminProvider({ children, user }: { children: ReactNode; user: AdminCtx['user'] }) {
  const [site, setSiteState] = useState<AdminSite | null>(null)
  const [loadError, setLoadError] = useState('')
  const [editLang, setEditLang] = useState<Lang>('bs')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [images, setImages] = useState<ImageInfo[] | null>(null)
  const seq = useRef(0)

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = ++seq.current
    setToasts((list) => [...list, { id, kind, text }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === 'error' ? 7000 : 3500)
  }, [])

  const reload = useCallback(async () => {
    try {
      setSiteState(await api.site())
      setLoadError('')
    } catch (err) {
      setLoadError((err as Error).message)
    }
  }, [])

  const loadImages = useCallback(async () => {
    try {
      setImages(await api.images())
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }, [toast])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo<AdminCtx>(() => ({
    site,
    setSite: (update) => setSiteState((s) => (s ? update(s) : s)),
    reload,
    loadError,
    editLang,
    setEditLang,
    toast,
    images,
    loadImages,
    addImage: (image) => setImages((list) => [image, ...(list ?? [])]),
    user,
  }), [site, reload, loadError, editLang, toast, images, loadImages, user])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="a-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.text}
            <button type="button" aria-label="Zatvori" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdmin mora biti unutar AdminProvider')
  return ctx
}

export const formatDate = (iso?: string | null) =>
  iso ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
