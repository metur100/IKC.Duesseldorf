import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../context/LanguageContext'

// Vremena dolaze sa vaktija.eu preko našeg backend-a (backend/IKC.Api, GET /api/vaktija/dusseldorf).
// Lokalno Vite prosljeđuje /api na backend (vite.config.ts), u produkciji VITE_API_URL pokazuje na MonsterASP.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const VAKTIJA_URL = 'https://vaktija.eu/dusseldorf'

type VaktijaResponse = {
  source: string
  location: string
  date: string
  gregorian: string
  hijri: string | null
  times: {
    fajr: string
    sunrise: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  }
  stale: boolean
}

export default function PrayerTimesPanel() {
  const { lang } = useLang()
  const [vaktija, setVaktija] = useState<VaktijaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const labels = useMemo(
    () =>
      lang === 'bs'
        ? {
            title: 'Današnja vremena namaza',
            source: 'Izvor',
            fallback: 'Vaktija trenutno nije dostupna. Pogledajte vremena na',
            date: 'Datum',
            hijri: 'Hidžri',
            prayers: {
              fajr: 'Sabah',
              sunrise: 'Izlazak',
              dhuhr: 'Podne',
              asr: 'Ikindija',
              maghrib: 'Akšam',
              isha: 'Jacija'
            }
          }
        : {
            title: 'Heutige Gebetszeiten',
            source: 'Quelle',
            fallback: 'Die Gebetszeiten sind gerade nicht verfügbar. Sie finden sie auf',
            date: 'Datum',
            hijri: 'Hidschri',
            prayers: {
              fajr: 'Fajr',
              sunrise: 'Sonnenaufgang',
              dhuhr: 'Dhuhr',
              asr: 'Asr',
              maghrib: 'Maghrib',
              isha: 'Isha'
            }
          },
    [lang]
  )

  const prayerRows = useMemo(
    () =>
      vaktija
        ? (Object.keys(labels.prayers) as (keyof VaktijaResponse['times'])[]).map((key) => ({
            key,
            label: labels.prayers[key],
            value: vaktija.times[key]
          }))
        : [],
    [labels.prayers, vaktija]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(false)

      try {
        const response = await fetch(`${API_URL}/api/vaktija/dusseldorf?lang=${lang}`, {
          headers: { Accept: 'application/json' }
        })
        if (!response.ok) {
          throw new Error(`Vaktija request failed (${response.status})`)
        }

        const payload = (await response.json()) as VaktijaResponse
        if (!payload?.times) {
          throw new Error('Invalid Vaktija payload')
        }

        if (!cancelled) {
          setVaktija(payload)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [lang])

  return (
    <div className="prayer-times-widget" aria-live="polite">
      <h3>{labels.title}</h3>

      {loading && !vaktija && <p className="prayer-times-note">Loading...</p>}

      {!loading && error && (
        <p className="prayer-times-note">
          {labels.fallback}{' '}
          <a href={VAKTIJA_URL} target="_blank" rel="noreferrer">
            Vaktija.eu
          </a>
          .
        </p>
      )}

      {!error && vaktija && (
        <>
          <div className="prayer-times-list" role="list">
            {prayerRows.map((item) => (
              <div key={item.key} className="prayer-time-row" role="listitem">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="prayer-times-meta">
            <span>{labels.date}: {vaktija.gregorian}</span>
            {vaktija.hijri && <span>{labels.hijri}: {vaktija.hijri}</span>}
            <span>
              {labels.source}:{' '}
              <a href={VAKTIJA_URL} target="_blank" rel="noreferrer">
                Vaktija.eu
              </a>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
