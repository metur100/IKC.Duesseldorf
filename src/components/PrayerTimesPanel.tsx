import { useLang } from '../context/LanguageContext'

// Vaktija.eu ugrađena kao web view (iframe). vaktija.eu dozvoljava prikaz u iframeu,
// a nema poseban widget, pa prikazujemo njihovu stranicu za Düsseldorf na jeziku sajta.
const VAKTIJA_URL = {
  bs: 'https://vaktija.eu/dusseldorf',
  de: 'https://vaktija.eu/de/dusseldorf'
}

export default function PrayerTimesPanel() {
  const { lang } = useLang()
  const url = VAKTIJA_URL[lang]

  return (
    <div className="prayer-times-widget">
      <iframe
        key={lang}
        className="prayer-times-frame"
        src={url}
        title={lang === 'bs' ? 'Vaktija za Düsseldorf (vaktija.eu)' : 'Gebetszeiten für Düsseldorf (vaktija.eu)'}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <p className="prayer-times-note">
        {lang === 'bs' ? 'Izvor:' : 'Quelle:'}{' '}
        <a href={url} target="_blank" rel="noreferrer">
          Vaktija.eu
        </a>
      </p>
    </div>
  )
}
