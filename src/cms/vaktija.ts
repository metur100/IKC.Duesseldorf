import { useEffect, useState } from 'react'
import { API_URL } from './site'
import type { PrayerDay, PrayerKey, VaktijaResponse } from './types'
import { PRAYER_KEYS } from './types'

const CACHE_KEY = 'ikc-vaktija-v2'

/** Trenutno vrijeme po berlinskom (Düsseldorf) vremenu, bez obzira na vremensku zonu uređaja. */
export function berlinNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    day: Number(parts.day),
    seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  }
}

/** UTC trenutak (ms) za berlinsko lokalno vrijeme. */
function berlinInstant(y: number, mo: number, d: number, h: number, mi: number) {
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const offset = (t: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(t)).map((x) => [x.type, Number(x.value)]))
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - t
  }
  const first = guess - offset(guess)
  return guess - offset(first)
}

const toSeconds = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 3600 + m * 60
}

export interface PrayerState {
  /** Vremena za danas (po berlinskom datumu, i kad je keš od juče). */
  today: PrayerDay
  /** Namaz čije je vrijeme trenutno (zadnji koji je počeo), null prije zore. */
  current: PrayerKey | null
  next: PrayerKey
  /** Vrijeme sljedećeg namaza (sutrašnje kad je poslije jacije). */
  nextTime: string
  /** Sekundi do sljedećeg namaza. */
  secondsLeft: number
  isTomorrow: boolean
}

export function prayerState(data: VaktijaResponse, now = berlinNow()): PrayerState | null {
  const sameMonth = data.monthStart.slice(0, 7) === now.date.slice(0, 7)
  const today = data.date === now.date ? data.today : sameMonth ? data.month.find((d) => d.day === now.day) : undefined
  if (!today) return null

  let current: PrayerKey | null = null
  for (const key of PRAYER_KEYS) {
    if (toSeconds(today[key]) <= now.seconds) current = key
  }
  const next = PRAYER_KEYS.find((key) => toSeconds(today[key]) > now.seconds)
  if (next) return { today, current, next, nextTime: today[next], secondsLeft: toSeconds(today[next]) - now.seconds, isTomorrow: false }

  const tomorrow = (sameMonth && data.month.find((d) => d.day === now.day + 1)) || today
  // Preko stvarnih trenutaka, da odbrojavanje bude tačno i u noći promjene ljetnog/zimskog vremena.
  const [y, m, d] = now.date.split('-').map(Number)
  const [fh, fm] = tomorrow.fajr.split(':').map(Number)
  const target = berlinInstant(y, m, d + 1, fh, fm)
  const nowInstant = Date.now()
  return { today, current, next: 'fajr', nextTime: tomorrow.fajr, secondsLeft: Math.max(0, Math.round((target - nowInstant) / 1000)), isTomorrow: true }
}

export const formatCountdown = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

let inflight: Promise<VaktijaResponse> | null = null

function readCache(): VaktijaResponse | null {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null')
  } catch {
    return null
  }
}

/** Vaktija sa backend-a (koji je preuzima sa vaktija.eu jednom dnevno). Kešira se u browseru do kraja dana. */
export function useVaktija() {
  const [data, setData] = useState<VaktijaResponse | null>(readCache)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (data && data.date === berlinNow().date && !data.stale) return
    inflight ??= fetch(`${API_URL}/api/vaktija/dusseldorf`).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json() as Promise<VaktijaResponse>
    })
    let alive = true
    inflight
      .then((fresh) => {
        if (!alive) return
        setData(fresh)
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
        } catch {
          /* nije bitno */
        }
      })
      .catch(() => alive && setError(true))
      .finally(() => {
        inflight = null
      })
    return () => {
      alive = false
    }
  }, [data])

  return { data, error }
}

/** Sekundni "tick" za odbrojavanje. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => berlinNow())
  useEffect(() => {
    const t = window.setInterval(() => setNow(berlinNow()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}
