import Constants from 'expo-constants'
import { router } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { PageEnd } from '@/components/Footer'
import { MenuGroup, MenuRow } from '@/components/MenuList'
import { ScreenHeader, ScreenScroll } from '@/components/Screen'
import { Container } from '@/components/ui'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { mapsHref, openHref, openPage, telHref } from '@/lib/links'
import { colors, fonts, space } from '@/lib/theme'

// expo-application nije dostupan u Expo Go – u pravom buildu daje i broj builda.
let Application: { nativeApplicationVersion: string | null; nativeBuildVersion: string | null } | null = null
try {
  Application = require('expo-application')
} catch {
  Application = null
}

export default function MoreScreen() {
  const { site, getPage, refreshing, refresh } = useContent()
  const { lang, setLang, t, tx } = useLang()
  const c = site.settings.contact

  const contactRows: MenuRow[] = []
  if (c?.phone) contactRows.push({ key: 'tel', icon: 'phone', label: c.phone, sub: t('call'), fit: true, onPress: () => openHref(telHref(c.phone)) })
  if (c?.email) contactRows.push({ key: 'mail', icon: 'mail', label: c.email, sub: t('email'), fit: true, onPress: () => openHref(`mailto:${c.email}`) })
  if (c?.address) contactRows.push({ key: 'map', icon: 'map-pin', label: c.address, sub: t('openMaps'), onPress: () => openHref(mapsHref(c.address, c.lat, c.lng)) })
  for (const so of site.settings.social ?? []) {
    if (so.href) contactRows.push({ key: `so-${so.href}`, icon: 'external-link', label: so.label, onPress: () => openHref(so.href) })
  }

  const legalRows: MenuRow[] = (site.settings.footerLinks ?? [])
    .map((l, i): MenuRow | null => {
      if (l.page && getPage(l.page)) return { key: `f${i}`, label: tx(l.label), onPress: () => openPage(l.page) }
      if (l.href) return { key: `f${i}`, label: tx(l.label), onPress: () => openHref(l.href) }
      return null
    })
    .filter((r): r is MenuRow => !!r)

  const version = Application?.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0'
  const build = Application?.nativeBuildVersion

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
      <ScreenHeader eyebrow={site.settings.siteName} title={t('tabMore')} intro={t('moreIntro')} />
      <Container style={{ paddingTop: space.xl, paddingBottom: space.md }}>
        <MenuGroup
          title={t('language')}
          rows={[
            { key: 'bs', label: 'Bosanski', selected: lang === 'bs', onPress: () => setLang('bs') },
            { key: 'de', label: 'Deutsch', selected: lang === 'de', onPress: () => setLang('de') },
          ]}
        />
        <MenuGroup title={c?.org || t('contact')} rows={contactRows} />
        <MenuGroup title={t('legal')} rows={legalRows} />
        <MenuGroup
          title={t('admin')}
          rows={[{ key: 'admin', icon: 'lock', label: t('admin'), sub: t('adminHint'), onPress: () => router.push('/admin') }]}
        />
        <Text style={s.version}>
          {t('version')} {version}
          {build ? ` (${build})` : ''}
        </Text>
      </Container>
      <PageEnd />
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  version: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: 'center', marginBottom: space.lg },
})
