import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLang } from '@/lib/i18n'
import { colors, fonts, space } from '@/lib/theme'
import { Img } from './Img'
import { Body, Container, Eyebrow, Heading, ToneProvider } from './ui'

/** Vertikalni ScrollView sa pull-to-refresh (nikad horizontalno skrolanje). */
export function ScreenScroll({
  children,
  refreshing = false,
  onRefresh,
  bg = colors.cream,
  statusColor = colors.green,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  bg?: string
  /** Boja pozadine ispod status bara */
  statusColor?: string
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsHorizontalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.green]} progressBackgroundColor={colors.cream} /> : undefined}
    >
      {children}
    </ScrollView>
      {/* Pozadina ispod status bara da sadržaj ne ide ispod sata/ikona */}
      <View pointerEvents="none" style={[s.statusBg, { height: insets.top, backgroundColor: statusColor }]} />
    </View>
  )
}

/** Zeleno zaglavlje ekrana (tabovi i podstranice). */
export function ScreenHeader({
  title,
  eyebrow,
  intro,
  image,
  back,
}: {
  title: string
  eyebrow?: string
  intro?: string
  image?: string
  back?: boolean
}) {
  const insets = useSafeAreaInsets()
  const { t } = useLang()
  return (
    <ToneProvider tone="dark">
      <View style={{ backgroundColor: colors.green, overflow: 'hidden' }}>
        {!!image && (
          <View style={StyleSheet.absoluteFill}>
            <Img src={image} bg={colors.green} style={{ height: '100%', aspectRatio: undefined }} aspect={undefined} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,47,36,0.78)' }]} />
          </View>
        )}
        <Container style={{ paddingTop: insets.top + (back ? space.sm : space.xl), paddingBottom: space.xl + 4 }}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={12}
              style={({ pressed }) => [s.back, pressed && { opacity: 0.6 }]}
            >
              <Feather name="arrow-left" size={20} color={colors.onDark} />
              <Text style={s.backText}>{t('back')}</Text>
            </Pressable>
          )}
          {!!eyebrow && <Eyebrow style={{ marginBottom: space.sm }}>{eyebrow}</Eyebrow>}
          <Heading level={1} style={s.title}>
            {title}
          </Heading>
          <View style={s.rule} />
          {!!intro && <Body style={{ color: colors.onDarkMuted, marginTop: space.sm }}>{intro}</Body>}
        </Container>
      </View>
    </ToneProvider>
  )
}

/** Mala traka na dnu (npr. offline obavještenje). */
export function Notice({ text }: { text: string }) {
  return (
    <View style={s.notice}>
      <Feather name="wifi-off" size={14} color={colors.muted} />
      <Text style={s.noticeText}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  statusBg: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.97 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44, marginBottom: space.sm },
  backText: { color: colors.onDark, fontFamily: fonts.medium, fontSize: 15 },
  title: { fontSize: 30, lineHeight: 37 },
  rule: { width: 36, height: 2, backgroundColor: colors.gold, marginTop: space.md },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center', paddingVertical: space.sm, paddingHorizontal: space.lg },
  noticeText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: 'center', flexShrink: 1 },
})
