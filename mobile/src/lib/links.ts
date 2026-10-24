import { router } from 'expo-router'
import { useCallback } from 'react'
import { Linking, Platform } from 'react-native'
import { SITE_URL } from './config'

/** "/clanstvo" -> "clanstvo", "/" -> "home". Null ako nije interni link. */
export function internalSlug(href: string): string | null {
  const h = href.trim()
  if (!h) return null
  let path: string | null = null
  if (h.startsWith('/') && !h.startsWith('//')) path = h
  else if (h.startsWith(SITE_URL)) path = h.slice(SITE_URL.length) || '/'
  else if (h.startsWith('#')) return null
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(h)) path = `/${h}`
  if (path == null) return null
  const slug = path.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')
  return slug === '' ? 'home' : slug
}

export function openPage(slug: string) {
  if (slug === 'home') {
    router.navigate('/')
    return
  }
  router.push({ pathname: '/page/[slug]', params: { slug } })
}

export function openHref(href: string | undefined | null) {
  if (!href) return
  const slug = internalSlug(href)
  if (slug) {
    openPage(slug)
    return
  }
  Linking.openURL(href).catch(() => {})
}

export function useOpenHref() {
  return useCallback((href: string | undefined | null) => openHref(href), [])
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function mapsHref(address: string, lat?: number, lng?: number) {
  const q = encodeURIComponent(address)
  const ll = lat && lng ? `${lat},${lng}` : ''
  if (Platform.OS === 'ios') return `https://maps.apple.com/?q=${q}${ll ? `&ll=${ll}` : ''}`
  if (Platform.OS === 'android') return `geo:${ll || '0,0'}?q=${q}`
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}
