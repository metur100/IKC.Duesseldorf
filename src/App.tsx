import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
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

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
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
