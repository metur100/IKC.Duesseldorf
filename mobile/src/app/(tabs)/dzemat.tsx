import { MenuGroup, MenuRow } from '@/components/MenuList'
import { ScreenHeader, ScreenScroll } from '@/components/Screen'
import { Container } from '@/components/ui'
import type { NavItem } from '@/cms/types'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { openHref, openPage } from '@/lib/links'
import { space } from '@/lib/theme'

export default function CommunityScreen() {
  const { site, getPage, refreshing, refresh } = useContent()
  const { tx, t } = useLang()

  const toRow = (n: NavItem): MenuRow | null => {
    // Vaktija i početna imaju svoje tabove
    if (n.page === 'vaktija' || n.page === 'home') return null
    if (n.page) {
      const p = getPage(n.page)
      if (!p) return null
      return { key: n.id, label: tx(n.label) || tx(p.title), sub: tx(p.description), onPress: () => openPage(n.page) }
    }
    if (n.href) return { key: n.id, label: tx(n.label), onPress: () => openHref(n.href) }
    return null
  }

  // Grupe (stavke sa djecom) dobijaju naslov; pojedinačne stavke se skupljaju u grupe bez naslova.
  const groups: { key: string; title?: string; rows: MenuRow[] }[] = []
  let loose: MenuRow[] = []
  const flush = () => {
    if (loose.length) groups.push({ key: `l${groups.length}`, rows: loose })
    loose = []
  }
  for (const n of site.settings.nav ?? []) {
    if (n.children?.length) {
      flush()
      const rows = [toRow({ ...n, children: [] }), ...n.children.map(toRow)].filter((r): r is MenuRow => !!r)
      groups.push({ key: n.id, title: tx(n.label), rows })
    } else {
      const r = toRow(n)
      if (r) loose.push(r)
    }
  }
  flush()

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
      <ScreenHeader eyebrow={site.settings.siteName} title={t('tabCommunity')} intro={t('communityIntro')} />
      <Container style={{ paddingTop: space.xl, paddingBottom: space.lg }}>
        {groups.map((g) => (
          <MenuGroup key={g.key} title={g.title} rows={g.rows} />
        ))}
      </Container>
    </ScreenScroll>
  )
}
