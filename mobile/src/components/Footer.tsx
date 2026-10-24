import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { colors, fonts, space } from '@/lib/theme'

/** Diskretan završetak stranice: znak + naziv udruženja. */
export function PageEnd({ bottomInset = 0 }: { bottomInset?: number }) {
  const { site } = useContent()
  const { tx } = useLang()
  const text = tx(site.settings.footerText) || site.settings.contact?.org
  return (
    <View style={[s.wrap, { paddingBottom: space.xxl + bottomInset }]}>
      <Image source={require('../../assets/logo-mark.png')} style={s.logo} contentFit="contain" />
      {!!text && <Text style={s.text}>{text}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl, backgroundColor: colors.greenDark },
  logo: { width: 44, height: 44, opacity: 0.9 },
  text: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.onDarkMuted, textAlign: 'center', marginTop: space.md, maxWidth: 420 },
})
