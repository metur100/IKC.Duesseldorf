import { useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MonthTable, PrayerToday } from '@/components/prayer'
import { ScreenHeader, ScreenScroll } from '@/components/Screen'
import { Container, Heading } from '@/components/ui'
import { useLang } from '@/lib/i18n'
import { colors, fonts, space } from '@/lib/theme'
import { useVaktija } from '@/lib/vaktija'

export default function VaktijaScreen() {
  const { t } = useLang()
  const { data, loading, refresh } = useVaktija()
  const onRefresh = useCallback(() => {
    refresh()
  }, [refresh])

  return (
    <ScreenScroll refreshing={loading && !!data} onRefresh={onRefresh}>
      <ScreenHeader eyebrow="Düsseldorf" title={t('tabVaktija')} intro={t('vaktijaIntro')} />
      <Container style={{ paddingVertical: space.xl }}>
        <PrayerToday />
        {data && data.month.length > 0 && (
          <View style={{ marginTop: space.xxl }}>
            <Heading level={3} style={{ marginBottom: space.md }}>
              {t('monthTitle')}
            </Heading>
            <MonthTable data={data} />
          </View>
        )}
        <Text style={s.source}>{t('source')}</Text>
      </Container>
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  source: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: space.md, textAlign: 'right' },
})
