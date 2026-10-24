import { router, useLocalSearchParams } from 'expo-router'
import { useCallback } from 'react'
import { View } from 'react-native'
import { Blocks } from '@/components/blocks/Blocks'
import { PageEnd } from '@/components/Footer'
import { ScreenHeader, ScreenScroll } from '@/components/Screen'
import { Body, Btn, Container } from '@/components/ui'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { space } from '@/lib/theme'
import { useVaktija } from '@/lib/vaktija'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { getPage, refreshing, refresh } = useContent()
  const vaktija = useVaktija()
  const insets = useSafeAreaInsets()
  const { tx, t } = useLang()
  const page = slug ? getPage(String(slug)) : undefined
  const hasPrayer = !!page?.blocks.some((b) => b.type === 'prayerTimes' && !b.hidden)

  const onRefresh = useCallback(() => {
    refresh()
    if (hasPrayer) vaktija.refresh()
  }, [refresh, hasPrayer, vaktija])

  if (!page) {
    return (
      <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
        <ScreenHeader back title={t('pageNotFound')} />
        <Container style={{ paddingVertical: space.xxl }}>
          <Body muted>/{slug}</Body>
          <Btn label={t('toHome')} onPress={() => router.navigate('/')} style={{ marginTop: space.xl, alignSelf: 'flex-start' }} />
        </Container>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader back eyebrow={tx(page.header?.eyebrow)} title={tx(page.title)} intro={tx(page.header?.intro)} image={page.header?.image} />
      <Blocks blocks={page.blocks} />
      <View style={{ flex: 1 }} />
      <PageEnd bottomInset={insets.bottom} />
    </ScreenScroll>
  )
}
