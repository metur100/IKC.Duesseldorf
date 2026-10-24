import Feather from '@expo/vector-icons/Feather'
import { Image } from 'expo-image'
import { StatusBar } from "expo-status-bar"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { resolveImage } from '@/lib/config'
import { useLang } from '@/lib/i18n'
import { colors, fonts, space } from '@/lib/theme'

/** Prikaz slike preko cijelog ekrana; listanje dugmadima (bez horizontalnog skrolanja). */
export function Lightbox({
  images,
  index,
  onChange,
}: {
  images: { uri: string; alt: string }[]
  index: number | null
  onChange: (i: number | null) => void
}) {
  const { t } = useLang()
  const insets = useSafeAreaInsets()
  const open = index != null && index >= 0 && index < images.length
  const cur = open ? images[index!] : null
  const uri = cur ? resolveImage(cur.uri) : null
  const go = (d: number) => {
    if (index == null) return
    onChange((index + d + images.length) % images.length)
  }
  return (
    <Modal visible={open} animationType="fade" transparent={false} onRequestClose={() => onChange(null)} statusBarTranslucent supportedOrientations={['portrait']}>
      <StatusBar style="light" />
      <View style={s.root}>
        {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} accessibilityLabel={cur?.alt} />}
        <View style={[s.top, { paddingTop: insets.top + space.sm }]}>
          <Text style={s.counter}>
            {index! + 1} / {images.length}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={() => onChange(null)} hitSlop={12} style={s.iconBtn}>
            <Feather name="x" size={24} color={colors.onDark} />
          </Pressable>
        </View>
        {!!cur?.alt && (
          <View style={[s.caption, { paddingBottom: insets.bottom + 76 }]}>
            <Text style={s.captionText}>{cur.alt}</Text>
          </View>
        )}
        {images.length > 1 && (
          <View style={[s.nav, { bottom: insets.bottom + space.lg }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('previous')} onPress={() => go(-1)} style={s.navBtn} hitSlop={8}>
              <Feather name="chevron-left" size={26} color={colors.onDark} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('next')} onPress={() => go(1)} style={s.navBtn} hitSlop={8}>
              <Feather name="chevron-right" size={26} color={colors.onDark} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg },
  counter: { color: colors.onDarkMuted, fontFamily: fonts.medium, fontSize: 14, fontVariant: ['tabular-nums'] },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl },
  captionText: { color: colors.onDark, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  nav: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: space.xxl },
  navBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(247,241,227,0.4)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
})
