import { memo, useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { PRAYER_KEYS, PRAYER_NAMES, type PrayerDay, type PrayerKey, type VaktijaResponse } from '@/cms/types'
import { useContent } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { colors, fonts, radius, space } from '@/lib/theme'
import { berlinNow, formatCountdown, usePrayerState, useVaktija } from '@/lib/vaktija'
import { Btn, useOnDark } from './ui'

const tab = { fontVariant: ['tabular-nums' as const] }

/** Kompaktna kartica "Sljedeći vakat" (za hero). */
export function NextPrayerCard() {
  const { lang, t } = useLang()
  const st = usePrayerState()
  const { data, loading } = useVaktija()
  if (!st || !data) {
    return (
      <View style={[s.card, s.cardCenter]}>
        {loading ? <ActivityIndicator color={colors.gold} /> : <Text style={s.cardMuted}>{t('vaktijaUnavailable')}</Text>}
      </View>
    )
  }
  return (
    <View style={s.card} accessible accessibilityLabel={`${t('nextPrayer')}: ${PRAYER_NAMES[lang][st.next.key]} ${st.next.time}`}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.cardLabel}>{t('nextPrayer').toUpperCase()}</Text>
        <Text style={s.cardName} numberOfLines={1} adjustsFontSizeToFit>
          {PRAYER_NAMES[lang][st.next.key]}
        </Text>
        <Text style={s.cardCountdown}>
          {t('inTime')} <Text style={tab}>{formatCountdown(st.next.remaining)}</Text>
        </Text>
      </View>
      <Text style={[s.cardTime, tab]}>{st.next.time}</Text>
    </View>
  )
}

/** Današnja vremena + odbrojavanje + datumi + džuma. */
export function PrayerToday({ showDates = true }: { showDates?: boolean }) {
  const { lang, t, tx } = useLang()
  const dark = useOnDark()
  const { data, loading, error, refresh } = useVaktija()
  const st = usePrayerState()
  const { site } = useContent()

  if (!data || !st) {
    return (
      <View style={[s.panel, s.cardCenter, { minHeight: 160 }]}>
        {loading ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <>
            <Text style={[s.note, { textAlign: 'center' }]}>{t('vaktijaUnavailable')}</Text>
            {error && <Btn label={t('reload')} variant="secondary" onPress={refresh} style={{ marginTop: space.lg }} />}
          </>
        )}
      </View>
    )
  }

  const jumuah = site.settings.jumuah
  const isFriday = new Date(Date.UTC(st.now.y, st.now.m - 1, st.now.d)).getUTCDay() === 5
  const jumuahNote = tx(jumuah?.note)

  return (
    <View>
      {showDates && (
        <View style={{ marginBottom: space.lg }}>
          {!!tx(data.gregorian) && <Text style={[s.greg, dark && { color: colors.onDark }]}>{tx(data.gregorian)}</Text>}
          {!!tx(data.hijri) && <Text style={[s.hijri, dark && { color: colors.gold }]}>{tx(data.hijri)}</Text>}
        </View>
      )}

      <View style={s.panel}>
        <View style={s.countHead}>
          <Text style={s.countLabel}>{t('nextPrayer').toUpperCase()}</Text>
          <Text style={s.countName}>
            {PRAYER_NAMES[lang][st.next.key]} <Text style={[s.countAt, tab]}>· {st.next.time}</Text>
          </Text>
          <Text style={[s.countdown, tab]} accessibilityLabel={`${t('inTime')} ${formatCountdown(st.next.remaining)}`}>
            {formatCountdown(st.next.remaining)}
          </Text>
        </View>
        {PRAYER_KEYS.map((k, i) => (
          <PrayerRow
            key={k}
            name={PRAYER_NAMES[lang][k]}
            time={st.today[k]}
            isNext={!st.next.tomorrow && st.next.key === k}
            isCurrent={st.current === k && st.isCurrentDay}
            currentLabel={t('current')}
            last={i === PRAYER_KEYS.length - 1}
          />
        ))}
      </View>

      {(jumuah?.time || jumuahNote) && (
        <View style={[s.jumuah, isFriday && { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}>
          <Text style={s.jumuahTitle}>
            {t('jumuah')}
            {jumuah?.time ? <Text style={tab}>{`  ${jumuah.time}`}</Text> : null}
          </Text>
          {!!jumuahNote && <Text style={s.jumuahNote}>{jumuahNote}</Text>}
        </View>
      )}

      {(data.stale || !st.isCurrentDay) && <Text style={[s.note, dark && { color: colors.onDarkMuted }]}>{t('staleNote')}</Text>}
    </View>
  )
}

const PrayerRow = memo(function PrayerRow({
  name,
  time,
  isNext,
  isCurrent,
  currentLabel,
  last,
}: {
  name: string
  time: string
  isNext: boolean
  isCurrent: boolean
  currentLabel: string
  last: boolean
}) {
  return (
    <View style={[s.row, !last && s.rowLine, isNext && s.rowNext]}>
      <View style={[s.marker, isNext && { backgroundColor: colors.gold }, isCurrent && { backgroundColor: colors.green }]} />
      <Text style={[s.rowName, isNext && s.rowNameNext]} numberOfLines={1}>
        {name}
      </Text>
      {isCurrent && <Text style={s.badge}>{currentLabel.toUpperCase()}</Text>}
      <Text style={[s.rowTime, tab, isNext && s.rowNameNext]}>{time}</Text>
    </View>
  )
})

const SHORT: Record<'bs' | 'de', Record<PrayerKey | 'day', string>> = {
  bs: { day: 'Dan', fajr: 'Zora', sunrise: 'Izl.', dhuhr: 'Podne', asr: 'Ikind.', maghrib: 'Akšam', isha: 'Jacija' },
  de: { day: 'Tag', fajr: 'Morg.', sunrise: 'Sonne', dhuhr: 'Mittag', asr: 'Nachm.', maghrib: 'Abend', isha: 'Nacht' },
}

/** Tabela za cijeli mjesec: 7 uskih kolona, staje na 320pt bez horizontalnog skrolanja. */
export const MonthTable = memo(function MonthTable({ data }: { data: VaktijaResponse }) {
  const { lang } = useLang()
  const today = berlinNow().date
  const monthKey = data.monthStart.slice(0, 7)
  const todayDay = today.slice(0, 7) === monthKey ? +today.slice(8, 10) : -1
  const weekdayOf = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number)
    return (d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  }, [monthKey])
  if (!data.month.length) return null
  const cols: (PrayerKey | 'day')[] = ['day', ...PRAYER_KEYS]
  return (
    <View style={s.table} accessibilityLabel="Vaktija">
      <View style={[s.tr, s.thead]}>
        {cols.map((c) => (
          <Text key={c} style={[s.th, c === 'day' ? s.dayCol : s.timeCol]} numberOfLines={1} maxFontSizeMultiplier={1.1}>
            {SHORT[lang][c]}
          </Text>
        ))}
      </View>
      {data.month.map((d: PrayerDay) => {
        const isToday = d.day === todayDay
        const fri = weekdayOf(d.day) === 5
        return (
          <View key={d.day} style={[s.tr, isToday ? s.trToday : d.day % 2 === 0 && s.trAlt]}>
            <Text style={[s.td, s.dayCol, tab, fri && s.fri, isToday && s.tdToday]} maxFontSizeMultiplier={1.15}>
              {d.day}.
            </Text>
            {PRAYER_KEYS.map((k) => (
              <Text key={k} style={[s.td, s.timeCol, tab, isToday && s.tdToday]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15}>
                {d[k]}
              </Text>
            ))}
          </View>
        )
      })}
    </View>
  )
})

const s = StyleSheet.create({
  // hero kartica
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7,47,36,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,74,0.55)',
    borderRadius: radius.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg + 2,
    gap: space.md,
  },
  cardCenter: { justifyContent: 'center', alignItems: 'center', minHeight: 92 },
  cardMuted: { color: colors.onDarkMuted, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  cardLabel: { color: colors.gold, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.5 },
  cardName: { color: colors.onDark, fontFamily: fonts.display, fontSize: 24, marginTop: 2 },
  cardCountdown: { color: colors.onDarkMuted, fontFamily: fonts.medium, fontSize: 14, marginTop: 2 },
  cardTime: { color: colors.onDark, fontFamily: fonts.display, fontSize: 34 },

  greg: { fontFamily: fonts.display, fontSize: 20, color: colors.green },
  hijri: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, marginTop: 2 },

  panel: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  countHead: { backgroundColor: colors.green, paddingHorizontal: space.lg + 2, paddingTop: space.lg, paddingBottom: space.lg + 2 },
  countLabel: { color: colors.gold, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.5 },
  countName: { color: colors.onDark, fontFamily: fonts.display, fontSize: 21, marginTop: 4 },
  countAt: { fontFamily: fonts.medium, fontSize: 16, color: colors.onDarkMuted },
  countdown: { color: colors.onDark, fontFamily: fonts.medium, fontSize: 40, letterSpacing: 1, marginTop: 4 },

  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingRight: space.lg + 2 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  rowNext: { backgroundColor: colors.goldSoft },
  marker: { width: 3, alignSelf: 'stretch', marginRight: space.lg - 1, backgroundColor: 'transparent' },
  rowName: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  rowNameNext: { fontFamily: fonts.semibold, color: colors.greenDark },
  rowTime: { fontFamily: fonts.medium, fontSize: 18, color: colors.ink },
  badge: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1, color: colors.green, marginRight: space.md },

  jumuah: { marginTop: space.md, padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  jumuahTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  jumuahNote: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 4 },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: space.md },

  // mjesečna tabela
  table: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 30, paddingHorizontal: 4 },
  thead: { backgroundColor: colors.green, minHeight: 34 },
  trAlt: { backgroundColor: '#faf6ec' },
  trToday: { backgroundColor: colors.gold },
  th: { color: colors.onDark, fontFamily: fonts.semibold, fontSize: 10, textAlign: 'center' },
  td: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ink, textAlign: 'center' },
  tdToday: { fontFamily: fonts.semibold, color: colors.greenDark },
  dayCol: { flex: 0.62 },
  timeCol: { flex: 1 },
  fri: { color: colors.green, fontFamily: fonts.semibold },
})
