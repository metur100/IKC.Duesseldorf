import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'bs' | 'de'

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const LanguageContext = createContext<Ctx>({ lang: 'bs', setLang: () => {}, toggle: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage?.getItem('ikc-lang') : null
    return saved === 'de' ? 'de' : 'bs'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    try { window.localStorage?.setItem('ikc-lang', l) } catch {}
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const toggle = () => setLang(lang === 'bs' ? 'de' : 'bs')

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
