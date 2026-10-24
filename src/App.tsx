import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import PageView from './pages/PageView'
import { useLang } from './context/LanguageContext'
import { usePage, useSite } from './cms/site'
import { t } from './cms/blocks'
import { pagePath } from './cms/types'

// Admin panel se učitava tek kad se otvori /admin, pa ne povećava javnu stranicu.
const AdminApp = lazy(() => import('./admin/AdminApp'))

// Adrese sa prethodne verzije stranice.
const RENAMED: Record<string, string> = { 'za-malisane': 'mekteb', 'druge-usluge': 'usluge', clanarina: 'clanstvo' }

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

/** Naslov, opis, canonical i tagovi za dijeljenje prate otvorenu stranicu. */
function PageMeta({ slug }: { slug: string }) {
  const { lang } = useLang()
  const { site } = useSite()
  const page = usePage(slug)
  useEffect(() => {
    if (!page) return
    const name = site.settings.siteName
    const title = slug === 'home' ? `${name} — ${t(site.settings.tagline, lang)}` : `${t(page.title, lang)} | ${name}`
    const description = t(page.description, lang)
    const url = new URL(pagePath(slug).replace(/^\//, ''), window.location.origin + import.meta.env.BASE_URL).href
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
  }, [page, slug, lang, site.settings])
  return null
}

function SlugPage() {
  const { slug = '' } = useParams()
  if (RENAMED[slug]) return <Navigate to={`/${RENAMED[slug]}`} replace />
  return <Layout slug={slug.toLowerCase()} />
}

function Layout({ slug }: { slug: string }) {
  const page = usePage(slug)
  const overHero = page?.blocks.find((b) => !b.hidden)?.type === 'hero'
  return (
    <>
      <PageMeta slug={slug} />
      <a href="#main" className="skip-link">Sadržaj / Inhalt</a>
      <Header overHero={overHero} />
      <main id="main" className={overHero ? 'has-hero' : ''}>
        <PageView slug={slug} />
      </main>
      <Footer />
    </>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Layout slug="home" />} />
        <Route path="/:slug" element={<SlugPage />} />
        <Route path="*" element={<Layout slug="__not-found__" />} />
      </Routes>
    </>
  )
}
