// Klijent za backend (backend/IKC.Api). Lokalno Vite prosljeđuje /api na backend,
// u produkciji VITE_API_URL pokazuje na MonsterASP.
import { API_URL } from '../cms/site'
import type { MembershipApplication, Page, SiteContent, SiteSettings } from '../cms/types'

const SESSION_KEY = 'ikc-admin-session'

export interface Session {
  token: string
  expiresAt: string
  user: { username: string; displayName: string }
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

export interface RevisionInfo {
  id: number
  createdAt: string
  createdBy: string | null
}

export interface DeletedPage extends RevisionInfo {
  key: string
}

export interface MembershipRequest {
  id: number
  name: string
  email: string
  status: 'new' | 'done'
  createdAt: string
  handledBy: string | null
  data: Partial<MembershipApplication>
}

export interface AdminSite extends SiteContent {
  settingsVersion?: string
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
  } catch {
    /* privatni prozor */
  }
}

let token: string | null = loadSession()?.token ?? null
let onUnauthorized: () => void = () => {}

export function setAuth(session: Session | null, unauthorized?: () => void) {
  token = session?.token ?? null
  if (unauthorized) onUnauthorized = unauthorized
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Server nije dostupan. Provjerite internet vezu i pokušajte ponovo.')
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) onUnauthorized()
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
  } catch {
    /* nije JSON */
  }
  return `Greška na serveru (${response.status}).`
}

const json = (body: unknown) => JSON.stringify(body)
const q = (version?: string) => (version ? `?baseVersion=${encodeURIComponent(version)}` : '')

export const api = {
  login: (username: string, password: string) =>
    request<Session>('/api/auth/login', { method: 'POST', body: json({ username, password }) }),

  site: () => request<AdminSite>('/api/admin/site'),
  savePage: (slug: string, page: Page, baseVersion?: string) =>
    request<string>(`/api/admin/pages/${encodeURIComponent(slug)}${q(baseVersion)}`, { method: 'PUT', body: json(page) }),
  createPage: (page: Page) => request<string>('/api/admin/pages', { method: 'POST', body: json(page) }),
  deletePage: (slug: string) => request<void>(`/api/admin/pages/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  saveSettings: (settings: SiteSettings, baseVersion?: string) =>
    request<string>(`/api/admin/settings${q(baseVersion)}`, { method: 'PUT', body: json(settings) }),
  revisions: (kind: 'page' | 'settings', key: string) => request<RevisionInfo[]>(`/api/admin/revisions/${kind}/${encodeURIComponent(key)}`),
  revision: <T>(id: number) => request<{ id: number; data: T }>(`/api/admin/revisions/${id}`),
  deletedPages: () => request<DeletedPage[]>('/api/admin/deleted-pages'),

  images: () => request<ImageInfo[]>('/api/admin/images'),
  uploadImage: (file: File, title: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    return request<ImageInfo>('/api/admin/images', { method: 'POST', body: form })
  },
  deleteImage: (id: number) => request<{ deleteUrl: string | null }>(`/api/admin/images/${id}`, { method: 'DELETE' }),

  membership: () => request<MembershipRequest[]>('/api/admin/membership'),
  setMembershipStatus: (id: number, status: 'new' | 'done') =>
    request<void>(`/api/admin/membership/${id}/status`, { method: 'PUT', body: json({ status }) }),
  deleteMembership: (id: number) => request<void>(`/api/admin/membership/${id}`, { method: 'DELETE' }),

  users: () => request<UserInfo[]>('/api/admin/users'),
  createUser: (username: string, displayName: string, password: string) =>
    request<UserInfo>('/api/admin/users', { method: 'POST', body: json({ username, displayName, password }) }),
  deleteUser: (id: number) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/api/admin/users/me/password', { method: 'PUT', body: json({ currentPassword, newPassword }) }),
}
