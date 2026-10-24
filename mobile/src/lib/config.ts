import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; siteUrl?: string }

export const API_URL = (extra.apiUrl ?? 'https://ikcduesseldorf.runasp.net').replace(/\/+$/, '')
export const SITE_URL = (extra.siteUrl ?? 'https://metur100.github.io/IKC.Duesseldorf').replace(/\/+$/, '')

/** Apsolutni URL ostaje, relativni ("/images/x.jpg") se veže na web stranicu. */
export function resolveImage(url: string | undefined | null): string | null {
  if (!url) return null
  const u = url.trim()
  if (!u) return null
  if (/^(https?:|data:|file:)/i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${SITE_URL}/${u.replace(/^\/+/, '')}`
}

export async function fetchJson<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    })
    const text = await res.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    if (!res.ok) {
      const msg = (data as { error?: string } | null)?.error
      throw new ApiError(res.status, msg || `HTTP ${res.status}`)
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
