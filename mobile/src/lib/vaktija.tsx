import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { PRAYER_KEYS, type LText, type PrayerDay, type PrayerKey, type VaktijaResponse } from '@/cms/types'
import { fetchJson } from './config'

const KEY = 'ikcd:vaktija:v1'
const TZ = 'Europe/Berlin'

// ── Vrijeme u Berlinu (uređaj može biti u drugoj vremenskoj zoni) ──────────────

export interface BerlinNow {
  /** yyyy-MM-dd */
  date: string
  y: number
  m: number
  d: number
  /** sekunde od ponoći (berlinsko lokalno vrijeme) */
  sec: number
}

let fmt: Intl.DateTimeFormat | null = null
try {
  fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  // provjera da Intl stvarno podržava vremensku zonu
  fmt.formatToParts(new Date())
} catch {
  fmt = null
}

/** Rezerva bez Intl: CET/CEST po EU pravilu (zadnja nedjelja u martu/oktobru, 01:00 UTC). */
function berlinOffsetMinutes(date: Date): number {
  const y = date.getUTCFullYear()
  const lastSunday = (month: number) => {
    const d = new Date(Date.UTC(y, month + 1, 0, 1))
    d.setUTCDate(d.getUTCDate() - d.getUTCDay())
    return d.getTime()
  }
  const t = date.getTime()
  return t >= lastSunday(2) && t < lastSunday(9) ? 120 : 60
}

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

export function berlinNow(date = new Date()): BerlinNow {
  let y: number, m: number, d: number, h: number, mi: number, s: number
  if (fmt) {
    const parts: Record<string, string> = {}
    for (const p of fmt.formatToParts(date)) parts[p.type] = p.value
    y = +parts.year
    m = +parts.month
    d = +parts.day
    h = +parts.hour % 24
    mi = +parts.minute
    s = +parts.second
  } else {
    const local = new Date(date.getTime() + berlinOffsetMinutes(date) * 60000)
    y = local.getUTCFullYear()
    m = local.getUTCMonth() + 1
    d = local.getUTCDate()
    h = local.getUTCHours()
    mi = local.getUTCMinutes()
    s = local.getUTCSeconds()
  }
  return { date: ymd(y, m, d), y, m, d, sec: h * 3600 + mi * 60 + s }
}

/** UTC trenutak (ms) za berlinski datum (yyyy-MM-dd) i sekunde od ponoći. */
export function berlinWallToInstant(dateStr: string, sec: number): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const wall = Date.UTC(y, m - 1, d) + sec * 1000
  const offset = (t: number) => {
    const b = berlinNow(new Date(t))
    return Date.UTC(b.y, b.m - 1, b.d) + b.sec * 1000 - t
  }
  const first = wall - offset(wall)
  return wall - offset(first)
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

export function timeToSec(hhmm: string | undefined): number | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim())
  if (!m) return null
  return +m[1] * 3600 + +m[2] * 60
}

export function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const mi = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${pad(h)}:${pad(mi)}:${pad(ss)}`
}

/** Vremena za dati datum (yyyy-MM-dd) iz odgovora, ako postoje. */
export function dayFor(v: VaktijaResponse, date: string): PrayerDay | null {
  if (v.date === date) return v.today
  if (v.tomorrow && addDays(v.date, 1) === date) return v.tomorrow
  if (v.monthStart && v.monthStart.slice(0, 7) === date.slice(0, 7)) {
    const day = +date.slice(8, 10)
    return v.month.find((p) => p.day === day) ?? null
  }
  return null
}

export interface PrayerState {
  /** Vremena koja se prikazuju kao "danas" */
  today: PrayerDay
  /** Da li "today" stvarno odgovara današnjem datumu u Berlinu */
  isCurrentDay: boolean
  next: { key: PrayerKey; time: string; remaining: number; tomorrow: boolean }
  /** Trenutni vakat (null između izlaska sunca i podne) */
  current: PrayerKey | null
  now: BerlinNow
}

export function computePrayerState(v: VaktijaResponse, at = new Date()): PrayerState {
  const now = berlinNow(at)
  const found = dayFor(v, now.date)
  const today = found ?? v.today
  const tomorrow = dayFor(v, addDays(now.date, 1)) ?? today

  for (let i = 0; i < PRAYER_KEYS.length; i++) {
    const key = PRAYER_KEYS[i]
    const sec = timeToSec(today[key])
    if (sec != null && sec > now.sec) {
      const prev = i === 0 ? 'isha' : PRAYER_KEYS[i - 1]
      return {
        today,
        isCurrentDay: !!found,
        next: { key, time: today[key], remaining: sec - now.sec, tomorrow: false },
        current: prev === 'sunrise' ? null : prev,
        now,
      }
    }
  }
  // Preko stvarnih trenutaka, da odbrojavanje bude tačno i u noći promjene ljetnog/zimskog vremena.
  const fajr = timeToSec(tomorrow.fajr) ?? 0
  const remaining = Math.round((berlinWallToInstant(addDays(now.date, 1), fajr) - at.getTime()) / 1000)
  return {
    today,
    isCurrentDay: !!found,
    next: { key: 'fajr', time: tomorrow.fajr, remaining, tomorrow: true },
    current: 'isha',
    now,
  }
}

// ── Normalizacija odgovora (podržava i stariji oblik { times: {...} }) ─────────

function toLText(x: unknown): LText {
  if (typeof x === 'string') return { bs: x, de: x }
  const o = (x ?? {}) as Partial<LText>
  return { bs: o.bs ?? o.de ?? '', de: o.de ?? o.bs ?? '' }
}

export function normalizeVaktija(raw: unknown): VaktijaResponse | null {
  const r = raw as Record<string, unknown> | null
  if (!r || typeof r !== 'object') return null
  const date = typeof r.date === 'string' ? r.date : berlinNow().date
  let today = r.today as PrayerDay | undefined
  if (!today && r.times && typeof r.times === 'object') {
    today = { day: +date.slice(8, 10), ...(r.times as Omit<PrayerDay, 'day'>) }
  }
  if (!today || !today.fajr) return null
  const month = Array.isArray(r.month) ? (r.month as PrayerDay[]) : []
  return {
    location: typeof r.location === 'string' ? r.location : 'Düsseldorf',
    date,
    gregorian: toLText(r.gregorian),
    hijri: toLText(r.hijri),
    today,
    tomorrow: (r.tomorrow as PrayerDay | null) ?? null,
    monthStart: typeof r.monthStart === 'string' ? r.monthStart : month.length ? `${date.slice(0, 7)}-01` : '',
    month,
    fetchedAt: typeof r.fetchedAt === 'string' ? r.fetchedAt : new Date().toISOString(),
    stale: !!r.stale,
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface VaktijaCtx {
  data: VaktijaResponse | null
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<VaktijaCtx | null>(null)

export function VaktijaProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<VaktijaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const lastFetch = useRef(0)
  const dataRef = useRef<VaktijaResponse | null>(null)
  dataRef.current = data

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await fetchJson<unknown>('/api/vaktija/dusseldorf')
      const v = normalizeVaktija(raw)
      if (!v) throw new Error('invalid vaktija')
      setData(v)
      setError(false)
      lastFetch.current = Date.now()
      AsyncStorage.setItem(KEY, JSON.stringify(v)).catch(() => {})
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw || dataRef.current) return
        const v = normalizeVaktija(JSON.parse(raw))
        if (v) setData(v)
      })
      .catch(() => {})
      .finally(() => refresh())

    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return
      const d = dataRef.current
      const dayChanged = !d || d.date !== berlinNow().date
      if (dayChanged || Date.now() - lastFetch.current > 3 * 3600 * 1000) refresh()
    })
    // Ako aplikacija ostane otvorena preko ponoći, preuzmi nova vremena.
    const timer = setInterval(() => {
      const d = dataRef.current
      if (d && d.date !== berlinNow().date && Date.now() - lastFetch.current > 15 * 60 * 1000) refresh()
    }, 60 * 1000)
    return () => {
      alive = false
      sub.remove()
      clearInterval(timer)
    }
  }, [refresh])

  const value = useMemo(() => ({ data, loading, error, refresh }), [data, loading, error, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVaktija() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useVaktija outside VaktijaProvider')
  return c
}

/** Re-render svake sekunde (za odbrojavanje). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** Stanje namaza koje se osvježava svake sekunde. */
export function usePrayerState(): PrayerState | null {
  const { data } = useVaktija()
  const now = useNow(1000)
  return useMemo(() => (data ? computePrayerState(data, now) : null), [data, now])
}
