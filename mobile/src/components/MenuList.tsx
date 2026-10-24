import Feather from '@expo/vector-icons/Feather'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radius, space } from '@/lib/theme'

export interface MenuRow {
  key: string
  label: string
  sub?: string
  icon?: keyof typeof Feather.glyphMap
  right?: string
  onPress?: () => void
  selected?: boolean
  /** Jedan red, smanji font ako treba (npr. e-mail adresa) */
  fit?: boolean
}

/** Grupa redova kao na iOS postavkama, u boji brenda. */
export function MenuGroup({ title, rows }: { title?: string; rows: MenuRow[] }) {
  if (!rows.length) return null
  return (
    <View style={{ marginBottom: space.xl }}>
      {!!title && <Text style={s.title}>{title.toUpperCase()}</Text>}
      <View style={s.group}>
        {rows.map((r, i) => (
          <Pressable
            key={r.key}
            disabled={!r.onPress}
            onPress={r.onPress}
            accessibilityRole={r.onPress ? 'button' : undefined}
            accessibilityState={r.selected != null ? { selected: r.selected } : undefined}
            style={({ pressed }) => [s.row, i > 0 && s.rowLine, pressed && { backgroundColor: colors.creamDark }]}
          >
            {!!r.icon && (
              <View style={s.icon}>
                <Feather name={r.icon} size={17} color={colors.green} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.label} numberOfLines={r.fit ? 1 : undefined} adjustsFontSizeToFit={r.fit} minimumFontScale={0.65}>
                {r.label}
              </Text>
              {!!r.sub && (
                <Text style={s.sub} numberOfLines={2}>
                  {r.sub}
                </Text>
              )}
            </View>
            {!!r.right && <Text style={s.right}>{r.right}</Text>}
            {r.selected != null ? (
              r.selected ? <Feather name="check" size={19} color={colors.gold} /> : <View style={{ width: 19 }} />
            ) : r.onPress ? (
              <Feather name="chevron-right" size={19} color="#a3a9a5" />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1.5, color: colors.gold, marginBottom: space.sm, marginLeft: 2 },
  group: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md + 2, minHeight: 56 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  right: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
})
