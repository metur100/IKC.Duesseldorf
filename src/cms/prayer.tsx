import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { useSite } from './site'
import { formatCountdown, prayerState, useNow, useVaktija } from './vaktija'
import { ui } from './ui'
import { PRAYER_KEYS, PRAYER_NAMES } from './types'

/** Današnja vremena sa odbrojavanjem. compact = kartica u heroju početne stranice. */
export function PrayerToday({ compact }: { compact?: boolean }) {
  const { lang } = useLang()
  const { site } = useSite()
  const s = ui(lang)
  const { data, error } = useVaktija()
  const now = useNow()
  const state = data ? prayerState(data, now) : null
  const names = PRAYER_NAMES[lang]

  if (!state) {
    return (
      <div className={`prayer ${compact ? 'prayer-compact' : ''} prayer-empty`}>
        <p>{error ? s.vaktijaError : s.loading}</p>
      </div>
    )
  }

  const isFriday = new Date(`${now.date}T12:00:00`).getDay() === 5
  const showDate = data && data.date === now.date

  return (
    <div className={`prayer ${compact ? 'prayer-compact' : ''}`}>
      <div className="prayer-top">
        <div>
          <span className="prayer-label">{s.nextPrayer}</span>
          <strong className="prayer-next">
            {names[state.next]} <span>{state.nextTime}</span>
            {state.isTomorrow && <em> · {s.tomorrow}</em>}
          </strong>
        </div>
        <div className="prayer-countdown" aria-live="off">
          <span className="prayer-label">{s.in}</span>
          <span className="tabular">{formatCountdown(state.secondsLeft)}</span>
        </div>
      </div>
      {showDate && (
        <p className="prayer-date">
          {data.gregorian[lang]}
          {data.hijri[lang] && <> · {data.hijri[lang]}</>}
        </p>
      )}
      <ol className="prayer-grid">
        {PRAYER_KEYS.map((key) => (
          <li key={key} className={`${key === state.current ? 'is-current' : ''} ${key === state.next && !state.isTomorrow ? 'is-next' : ''}`}>
            <span>{names[key]}</span>
            <strong className="tabular">{state.today[key]}</strong>
          </li>
        ))}
      </ol>
      <p className="prayer-foot">
        {isFriday || compact ? <span>{site.settings.jumuah.note[lang]}</span> : <span>{s.source}</span>}
        {compact && <Link to="/vaktija">{s.fullMonth} →</Link>}
      </p>
      {data?.stale && <p className="prayer-note">{s.staleNote}</p>}
    </div>
  )
}

export function PrayerMonth() {
  const { lang } = useLang()
  const s = ui(lang)
  const { data } = useVaktija()
  const now = useNow(60_000)
  if (!data) return null

  const sameMonth = data.monthStart.slice(0, 7) === now.date.slice(0, 7)
  const [year, month] = data.monthStart.split('-').map(Number)
  // Vlastiti nazivi: browseri često nemaju bosanski locale (prikazali bi "M10" i "Thu").
  const months = lang === 'bs'
    ? ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar']
    : ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  const days = lang === 'bs' ? ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'] : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const monthName = `${months[month - 1]} ${year}`
  const weekday = (day: number) => days[new Date(year, month - 1, day).getDay()]
  const short: Record<string, string> = lang === 'bs'
    ? { fajr: 'Zora', sunrise: 'Izlazak', dhuhr: 'Podne', asr: 'Ikindija', maghrib: 'Akšam', isha: 'Jacija' }
    : { fajr: 'Fadschr', sunrise: 'Sonne', dhuhr: 'Mittag', asr: 'Asr', maghrib: 'Abend', isha: 'Nacht' }

  return (
    <div className="prayer-month">
      <h3>
        {s.monthTitle} <span>{monthName}</span>
      </h3>
      <table>
        <thead>
          <tr>
            <th scope="col">{s.day}</th>
            {PRAYER_KEYS.map((k) => (
              <th scope="col" key={k}>{short[k]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.month.map((d) => (
            <tr key={d.day} className={sameMonth && d.day === now.day ? 'is-today' : ''}>
              <th scope="row">
                <span className="tabular">{d.day}.</span>
                <small>{weekday(d.day)}</small>
              </th>
              {PRAYER_KEYS.map((k) => (
                <td key={k} className="tabular">{d[k]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="prayer-foot"><span>{s.source}</span></p>
    </div>
  )
}
