import { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { NavItem } from './types'
import { pagePath } from './types'

const BASE = import.meta.env.BASE_URL

/** Slike iz sadržaja: apsolutni URL (ImgBB) ili putanja od korijena stranice ("/images/..."). */
export function imageUrl(url: string): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return url
  return BASE + url.replace(/^\//, '')
}

export const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//')

/** Link iz sadržaja: interni ide kroz router, vanjski u novi tab (osim tel:/mailto:). */
export function SmartLink({ href, children, ...rest }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (isInternal(href)) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    )
  }
  const external = /^https?:/.test(href)
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}

export const navHref = (item: Pick<NavItem, 'page' | 'href'>) => (item.page ? pagePath(item.page) : item.href)
