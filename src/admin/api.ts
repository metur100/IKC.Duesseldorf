// Klijent za backend (backend/IKC.Api). Lokalno Vite prosljeđuje /api na backend,
// u produkciji VITE_API_URL pokazuje na MonsterASP.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SESSION_KEY = 'ikc-admin-session'

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export interface Session {
  token: string
  expiresAt: string
  user: { username: string; displayName: string }
}

export interface SectionInfo {
  lang: 'bs' | 'de'
  key: string
  updatedAt: string
  updatedBy: string | null
}

export interface SectionData extends SectionInfo {
  data: Json
}

export interface SaveResult extends SectionInfo {
  rebuildScheduled: boolean
}

export interface ImageInfo {
  id: number
  url: string
  displayUrl: string
  thumbUrl: string | null
  deleteUrl: string | null
  title: string | null
  width: number
  height: number
  size: number
  createdAt: string
  uploadedBy: string | null
}

export interface UserInfo {
  id: number
  username: string
  displayName: string
  createdAt: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return new Date(session.expiresAt) > new Date() ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {}
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Server nije dostupan. Provjerite internet vezu i pokušajte ponovo.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }
  if (response.status === 204 || response.status === 202) return undefined as T
  return (await response.json()) as T
}

async function errorMessage(response: Response) {
  if (response.status === 401) return 'Prijava je istekla ili podaci nisu tačni.'
  if (response.status === 429) return 'Previše pokušaja. Sačekajte minutu pa pokušajte ponovo.'
  try {
    const body = await response.json()
    if (body.error) return body.error as string
    if (body.errors) return Object.values(body.errors as Record<string, string[]>).flat().join(' ')
    if (body.detail) return body.detail as string
    if (body.title) return body.title as string
  } catch {}
  return `Greška na serveru (${response.status}).`
}

export const api = {
  login: (username: string, password: string) =>
    request<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  sections: (token: string) => request<SectionInfo[]>('/api/admin/content', { token }),
  section: (token: string, lang: string, key: string) =>
    request<SectionData>(`/api/admin/content/${lang}/${key}`, { token }),
  saveSection: (token: string, lang: string, key: string, data: Json) =>
    request<SaveResult>(`/api/admin/content/${lang}/${key}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  publish: (token: string) => request<void>('/api/admin/content/publish', { method: 'POST', token }),

  images: (token: string) => request<ImageInfo[]>('/api/admin/images', { token }),
  uploadImage: (token: string, file: File, title: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    return request<ImageInfo>('/api/admin/images', { method: 'POST', token, body: form })
  },
  deleteImage: (token: string, id: number) =>
    request<{ deleteUrl: string | null }>(`/api/admin/images/${id}`, { method: 'DELETE', token }),

  users: (token: string) => request<UserInfo[]>('/api/admin/users', { token }),
  createUser: (token: string, username: string, displayName: string, password: string) =>
    request<UserInfo>('/api/admin/users', { method: 'POST', token, body: JSON.stringify({ username, displayName, password }) }),
  deleteUser: (token: string, id: number) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE', token }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<void>('/api/admin/users/me/password', { method: 'PUT', token, body: JSON.stringify({ currentPassword, newPassword }) }),
}
