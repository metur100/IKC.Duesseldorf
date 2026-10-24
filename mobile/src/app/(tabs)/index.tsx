import Feather from '@expo/vector-icons/Feather'
import { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Blocks, BlockView } from '@/components/blocks/Blocks'
import { PageEnd } from '@/components/Footer'
import { Notice, ScreenHeader, ScreenScroll } from '@/components/Screen'
import { Container } from '@/components/ui'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { openHref } from '@/lib/links'
import { colors, fonts, space } from '@/lib/theme'
import { useVaktija } from '@/lib/vaktija'

export default function HomeScreen() {
  const { getPage, site, refreshing, refresh, offline, source } = useContent()
  const vaktija = useVaktija()
  const { tx, t } = useLang()
  const insets = useSafeAreaInsets()
  const page = getPage('home')
  const blocks = (page?.blocks ?? []).filter((b) => !b.hidden)
  const [first, ...rest] = blocks
  const heroFirst = first?.type === 'hero'

  const onRefresh = useCallback(() => {
    refresh()
    vaktija.refresh()
  }, [refresh, vaktija])

  const ann = site.settings.announcement
  const annText = ann?.enabled ? tx(ann.text) : ''

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={onRefresh} statusColor={heroFirst ? colors.greenDark : colors.green}>
      {heroFirst ? <BlockView block={first} topInset={insets.top} /> : <ScreenHeader title={site.settings.siteName} intro={tx(site.settings.tagline)} />}
      {!!annText && (
        <Pressable disabled={!ann.href} onPress={() => openHref(ann.href)} accessibilityRole={ann.href ? 'link' : undefined} style={s.ann}>
          <Container style={s.annInner}>
            <Text style={s.annText}>{annText}</Text>
            {!!ann.href && <Feather name="arrow-right" size={16} color={colors.greenDark} />}
          </Container>
        </Pressable>
      )}
      <Blocks blocks={heroFirst ? rest : blocks} />
      {offline && source !== 'live' && <Notice text={t('offline')} />}
      <View style={{ flex: 1 }} />
      <PageEnd />
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  ann: { backgroundColor: colors.gold },
  annInner: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  annText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.greenDark },
})
