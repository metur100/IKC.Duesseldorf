import { createContext, ReactNode, useContext } from 'react'
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native'
import type { Button as CmsButton, Tone } from '@/cms/types'
import { useLang } from '@/lib/i18n'
import { openHref } from '@/lib/links'
import { colors, fonts, MAX_WIDTH, radius, space } from '@/lib/theme'

// ── Ton (pozadina sekcije) ────────────────────────────────────────────────────

const ToneCtx = createContext<Tone>('default')
export const useTone = () => useContext(ToneCtx)
export const useOnDark = () => useContext(ToneCtx) === 'dark'

export function ToneProvider({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <ToneCtx.Provider value={tone}>{children}</ToneCtx.Provider>
}

const toneBg: Record<Tone, string> = { default: colors.cream, light: colors.paper, dark: colors.green }

/** Sekcija sa pozadinom po tonu i centriranim sadržajem (max širina na tabletu). */
export function Section({ tone = 'default', children, style, tight }: { tone?: Tone; children: ReactNode; style?: StyleProp<ViewStyle>; tight?: boolean }) {
  return (
    <ToneProvider tone={tone}>
      <View style={[{ backgroundColor: toneBg[tone] }, tone === 'light' && s.lightEdge, style]}>
        <Container style={{ paddingVertical: tight ? space.xl : space.xxl + 4 }}>{children}</Container>
      </View>
    </ToneProvider>
  )
}

export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.container, style]}>{children}</View>
}

// ── Tipografija ───────────────────────────────────────────────────────────────

type TP = TextProps & { style?: StyleProp<TextStyle> }

export function Eyebrow({ children, style, ...rest }: TP) {
  const dark = useOnDark()
  if (!children) return null
  return (
    <Text {...rest} style={[s.eyebrow, { color: dark ? colors.gold : colors.gold }, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  )
}

export function Heading({ children, style, level = 2, ...rest }: TP & { level?: 1 | 2 | 3 }) {
  const dark = useOnDark()
  if (!children) return null
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[level === 1 ? s.h1 : level === 2 ? s.h2 : s.h3, { color: dark ? colors.onDark : colors.green }, style]}
    >
      {children}
    </Text>
  )
}

export function Body({ children, style, muted, ...rest }: TP & { muted?: boolean }) {
  const dark = useOnDark()
  if (!children) return null
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[s.body, { color: dark ? (muted ? colors.onDarkMuted : colors.onDark) : muted ? colors.muted : colors.ink }, style]}
    >
      {children}
    </Text>
  )
}

/** Zaglavlje sekcije: eyebrow + naslov + uvod */
export function SectionHead({ eyebrow, title, intro, center }: { eyebrow?: string; title?: string; intro?: string; center?: boolean }) {
  if (!eyebrow && !title && !intro) return null
  const align: TextStyle = center ? { textAlign: 'center' } : {}
  return (
    <View style={{ marginBottom: space.xl }}>
      {!!eyebrow && <Eyebrow style={[{ marginBottom: space.sm }, align]}>{eyebrow}</Eyebrow>}
      {!!title && <Heading style={align}>{title}</Heading>}
      {!!title && <GoldRule center={center} />}
      {!!intro && <Body muted style={[{ marginTop: space.xs }, align]}>{intro}</Body>}
    </View>
  )
}

export function GoldRule({ center }: { center?: boolean }) {
  return <View style={[s.rule, center && { alignSelf: 'center' }]} />
}

// ── Dugmad ────────────────────────────────────────────────────────────────────

export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  full,
}: {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  full?: boolean
}) {
  const dark = useOnDark()
  const bg = variant === 'primary' ? (dark ? colors.gold : colors.green) : 'transparent'
  const fg = variant === 'primary' ? (dark ? colors.greenDark : colors.onDark) : dark ? colors.onDark : colors.green
  const border = variant === 'secondary' ? (dark ? colors.onDarkMuted : colors.green) : 'transparent'
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
        variant === 'ghost' && { paddingHorizontal: 0 },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      <Text maxFontSizeMultiplier={1.3} style={[s.btnText, { color: fg }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  )
}

export function CmsButtons({ buttons, center }: { buttons?: CmsButton[]; center?: boolean }) {
  const { tx } = useLang()
  if (!buttons?.length) return null
  return (
    <View style={[s.btnRow, center && { justifyContent: 'center' }]}>
      {buttons.map((b, i) => (
        <Btn key={i} label={tx(b.label)} variant={b.style === 'secondary' ? 'secondary' : 'primary'} onPress={() => openHref(b.href)} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg + 4 },
  lightEdge: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1.6 },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 39 },
  h2: { fontFamily: fonts.display, fontSize: 25, lineHeight: 32 },
  h3: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  rule: { width: 36, height: 2, backgroundColor: colors.gold, marginTop: space.md, marginBottom: space.sm },
  btn: { paddingHorizontal: space.xl, paddingVertical: 13, borderRadius: radius.sm, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnText: { fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 0.2, textAlign: 'center' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl },
})
