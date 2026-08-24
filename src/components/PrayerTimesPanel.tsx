import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../context/LanguageContext'

type ApiResponse = {
  code: number
  status: string
  data: {
    timings: Record<string, string>
    date: {
      readable: string
      hijri: {
        date: string
      }
    }
    meta: {
      timezone: string
    }
  }
}

type VaktijaProxyResponse = {
  pageProps?: {
    dailyPrayersRes?: {
      fajr?: string
      sunrise?: string
      dhuhr?: string
      asr?: string
      maghrib?: string
      isha?: string
    }
    todayGregorian?: string
    todayHijri?: string
  }
}

type PrayerTimes = {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  readableDate: string
  hijriDate: string
  timezone: string
}

type DataSource = 'vaktija' | 'aladhan'

function cleanTime(value: string | undefined) {
  if (!value) return '--:--'
  const base = value.split(' ')[0]
  const parts = base.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }

  return base
}

function mapApiToPrayerTimes(payload: ApiResponse): PrayerTimes {
  return {
    fajr: cleanTime(payload.data.timings.Fajr),
    sunrise: cleanTime(payload.data.timings.Sunrise),
    dhuhr: cleanTime(payload.data.timings.Dhuhr),
    asr: cleanTime(payload.data.timings.Asr),
    maghrib: cleanTime(payload.data.timings.Maghrib),
    isha: cleanTime(payload.data.timings.Isha),
    readableDate: payload.data.date.readable,
    hijriDate: payload.data.date.hijri.date,
    timezone: payload.data.meta.timezone
  }
}

function mapVaktijaToPrayerTimes(payload: VaktijaProxyResponse): PrayerTimes {
  const prayers = payload.pageProps?.dailyPrayersRes
  if (!prayers) {
    throw new Error('Invalid Vaktija payload')
  }

  return {
    fajr: cleanTime(prayers.fajr),
    sunrise: cleanTime(prayers.sunrise),
    dhuhr: cleanTime(prayers.dhuhr),
    asr: cleanTime(prayers.asr),
    maghrib: cleanTime(prayers.maghrib),
    isha: cleanTime(prayers.isha),
    readableDate: payload.pageProps?.todayGregorian ?? '--',
    hijriDate: payload.pageProps?.todayHijri ?? '--',
    timezone: 'Europe/Berlin'
  }
}

export default function PrayerTimesPanel() {
  const { lang } = useLang()
  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [source, setSource] = useState<DataSource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const labels = useMemo(
    () =>
      lang === 'bs'
        ? {
            title: 'Današnja vremena namaza',
            source: 'Izvor',
            sourceVaktija: 'Vaktija.eu',
            sourceAlAdhan: 'AlAdhan API',
            fallback:
              'Ako podaci trenutno nisu dostupni, otvorite Vaktija.eu ili postavite proxy za Vaktija API podatke.',
            date: 'Datum',
            hijri: 'Hidžri',
            timezone: 'Vremenska zona',
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
            sourceVaktija: 'Vaktija.eu',
            sourceAlAdhan: 'AlAdhan API',
            fallback:
              'Wenn die Daten gerade nicht verfügbar sind, öffnen Sie Vaktija.eu oder richten Sie einen Proxy für Vaktija-API-Daten ein.',
            date: 'Datum',
            hijri: 'Hidschri',
            timezone: 'Zeitzone',
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
      times
        ? [
            { key: 'fajr', label: labels.prayers.fajr, value: times.fajr },
            { key: 'sunrise', label: labels.prayers.sunrise, value: times.sunrise },
            { key: 'dhuhr', label: labels.prayers.dhuhr, value: times.dhuhr },
            { key: 'asr', label: labels.prayers.asr, value: times.asr },
            { key: 'maghrib', label: labels.prayers.maghrib, value: times.maghrib },
            { key: 'isha', label: labels.prayers.isha, value: times.isha }
          ]
        : [],
    [labels.prayers, times]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const configuredProxy = import.meta.env.VITE_VAKTIJA_PROXY_URL
        const proxyCandidates = [configuredProxy, '/api/vaktija/dusseldorf'].filter(
          (value): value is string => Boolean(value)
        )

        let loadedFromVaktija = false

        for (const endpoint of proxyCandidates) {
          try {
            const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
            if (!response.ok) {
              continue
            }

            const payload = (await response.json()) as VaktijaProxyResponse
            const mapped = mapVaktijaToPrayerTimes(payload)

            if (!cancelled) {
              setTimes(mapped)
              setSource('vaktija')
            }

            loadedFromVaktija = true
            break
          } catch {
            // Try next candidate or fallback provider.
          }
        }

        if (loadedFromVaktija) {
          return
        }

        const fallbackResponse = await fetch(
          'https://api.aladhan.com/v1/timingsByCity?city=Dusseldorf&country=Germany&state=North%20Rhine-Westphalia&method=3&school=1',
          { headers: { Accept: 'application/json' } }
        )

        if (!fallbackResponse.ok) {
          throw new Error('Request failed')
        }

        const fallbackPayload = (await fallbackResponse.json()) as ApiResponse
        if (fallbackPayload.code !== 200 || !fallbackPayload.data?.timings) {
          throw new Error('Invalid payload')
        }

        if (!cancelled) {
          setTimes(mapApiToPrayerTimes(fallbackPayload))
          setSource('aladhan')
        }
      } catch {
        if (!cancelled) {
          setError('unavailable')
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
  }, [])

  return (
    <div className="prayer-times-widget" aria-live="polite">
      <h3>{labels.title}</h3>

      {loading && <p className="prayer-times-note">Loading...</p>}

      {!loading && error && (
        <p className="prayer-times-note">
          {labels.fallback}{' '}
          <a href="https://vaktija.eu/dusseldorf" target="_blank" rel="noreferrer">
            Vaktija.eu
          </a>
          .
        </p>
      )}

      {!loading && !error && times && (
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
            <span>{labels.date}: {times.readableDate}</span>
            <span>{labels.hijri}: {times.hijriDate}</span>
            <span>{labels.timezone}: {times.timezone}</span>
            <span>
              {labels.source}:{' '}
              {source === 'vaktija' ? (
                <a href="https://vaktija.eu/dusseldorf" target="_blank" rel="noreferrer">
                  {labels.sourceVaktija}
                </a>
              ) : (
                <a href="https://aladhan.com/prayer-times-api" target="_blank" rel="noreferrer">
                  {labels.sourceAlAdhan}
                </a>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
