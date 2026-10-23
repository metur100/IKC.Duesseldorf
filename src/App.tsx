import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PrayerBanner from './components/PrayerBanner'
import Home from './pages/Home'
import About from './pages/About'
import Activities from './pages/Activities'
import Kids from './pages/Kids'
import Services from './pages/Services'
import Gatherings from './pages/Gatherings'
import Imam from './pages/Imam'
import Boards from './pages/Boards'
import Membership from './pages/Membership'
import Faq from './pages/Faq'
import Contact from './pages/Contact'
import { useLang } from './context/LanguageContext'
import { fullTitle, pageFor } from './seo/pages'

// Admin panel se učitava tek kad se otvori /admin, pa ne povećava javnu stranicu.
const AdminApp = lazy(() => import('./admin/AdminApp'))

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/** Keeps the document title, description, canonical and social tags in sync with the page. */
function PageMeta() {
  const { pathname } = useLocation()
  const { lang } = useLang()
  useEffect(() => {
    const page = pageFor(pathname)
    const title = fullTitle(page, lang)
    const url = new URL(page.path.replace(/^\//, ''), window.location.origin + import.meta.env.BASE_URL).href
    document.title = title
    setMeta('meta[name="description"]', 'content', page.description[lang])
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', page.description[lang])
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', page.description[lang])
  }, [pathname, lang])
  return null
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
      <PageMeta />
      <Navbar />
      <PrayerBanner />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/o-nama" element={<About />} />
          <Route path="/aktivnosti" element={<Activities />} />
          <Route path="/za-malisane" element={<Kids />} />
          <Route path="/druge-usluge" element={<Services />} />
          <Route path="/okupljanja" element={<Gatherings />} />
          <Route path="/imam" element={<Imam />} />
          <Route path="/odbor" element={<Boards />} />
          <Route path="/clanarina" element={<Membership />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
