import Feather from '@expo/vector-icons/Feather'
import { Image } from 'expo-image'
import { useState } from 'react'
import { LayoutAnimation, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import type {
  Block,
  CardsBlock,
  CtaBlock,
  FaqBlock,
  GalleryBlock,
  HeroBlock,
  ImageBlock,
  ImageTextBlock,
  InfoBlock,
  ListBlock,
  MapBlock,
  PeopleBlock,
  PrayerTimesBlock,
  QuoteBlock,
  StatsBlock,
  TextBlock,
  TimelineBlock,
} from '@/cms/types'
import { useLang } from '@/lib/i18n'
import { mapsHref, openHref } from '@/lib/links'
import { colors, fonts, MAX_WIDTH, radius, space } from '@/lib/theme'
import { useVaktija } from '@/lib/vaktija'
import { Img } from '../Img'
import { HeroPrayerCard, MonthTable, PrayerToday } from '../prayer'
import { hasRich, RichText } from '../RichText'
import { Body, Btn, CmsButtons, Container, Eyebrow, Heading, Section, SectionHead, ToneProvider, useOnDark } from '../ui'
import { Lightbox } from './Lightbox'
import { MembershipForm } from './MembershipForm'

/** Broj kolona prema širini ekrana (bez horizontalnog skrolanja). */
function useCols(minItem: number, max = 4) {
  const { width } = useWindowDimensions()
  const inner = Math.min(width, MAX_WIDTH) - 40
  return Math.max(1, Math.min(max, Math.floor((inner + 12) / (minItem + 12))))
}

/** Grid sa fiksnim brojem kolona */
function Grid<T>({ items, cols, gap = 12, render }: { items: T[]; cols: number; gap?: number; render: (item: T, i: number) => React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }}>
      {items.map((it, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2, marginBottom: gap }}>
          {render(it, i)}
        </View>
      ))}
    </View>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

const HERO_BG = require('../../../assets/hero-bg.jpg')

export function Hero({ b, topInset }: { b: HeroBlock; topInset: number }) {
  const { tx } = useLang()
  const { width } = useWindowDimensions()
  const hasImg = !!b.image
  return (
    <ToneProvider tone="dark">
      <View style={{ backgroundColor: colors.greenDeep }}>
        {hasImg ? (
          <View style={StyleSheet.absoluteFill}>
            <Img src={b.image} aspect={undefined} bg={colors.greenDark} style={{ height: '100%', aspectRatio: undefined }} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,47,36,0.74)' }]} />
          </View>
        ) : (
          // Bez slike: ista pozadina kao hero na web stranici (brand/hero-bg.html)
          <Image source={HERO_BG} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top right" />
        )}
        <Container style={{ paddingTop: topInset + space.xxl, paddingBottom: space.xxl }}>
          {!!tx(b.eyebrow) && <Eyebrow style={{ marginBottom: space.md }}>{tx(b.eyebrow)}</Eyebrow>}
          <Heading level={1} style={width < 360 ? { fontSize: 28, lineHeight: 35 } : undefined}>
            {tx(b.title)}
          </Heading>
          {!!tx(b.text) && <Body style={{ marginTop: space.md, color: colors.onDarkMuted }}>{tx(b.text)}</Body>}
          <CmsButtons buttons={b.buttons} />
          {b.showPrayer && (
            <View style={{ marginTop: space.xxl }}>
              <HeroPrayerCard />
            </View>
          )}
        </Container>
      </View>
    </ToneProvider>
  )
}

// ── Tekst ─────────────────────────────────────────────────────────────────────

function TextB({ b }: { b: TextBlock }) {
  const { tx, lang } = useLang()
  const center = b.align === 'center'
  return (
    <Section tone={b.tone}>
      <SectionHead eyebrow={tx(b.eyebrow)} title={tx(b.title)} center={center} />
      <RichText doc={b.body?.[lang] && hasRich(b.body[lang]) ? b.body[lang] : b.body?.[lang === 'bs' ? 'de' : 'bs']} center={center} />
    </Section>
  )
}

function ImageB({ b }: { b: ImageBlock }) {
  const { tx } = useLang()
  const caption = tx(b.caption)
  const content = (
    <>
      <Img src={b.image} aspect={b.size === 'wide' ? 16 / 9 : 3 / 2} alt={tx(b.alt)} radius={b.size === 'wide' ? 0 : radius.md} />
      {!!caption && (
        <Container>
          <Body muted style={s.caption}>
            {caption}
          </Body>
        </Container>
      )}
    </>
  )
  if (b.size === 'wide') return <View style={{ backgroundColor: colors.cream, paddingVertical: space.lg, maxWidth: 1000, width: '100%', alignSelf: 'center' }}>{content}</View>
  return (
    <Section tone={b.tone} tight>
      <Img src={b.image} aspect={3 / 2} alt={tx(b.alt)} radius={radius.md} />
      {!!caption && (
        <Body muted style={s.caption}>
          {caption}
        </Body>
      )}
    </Section>
  )
}

function ImageTextB({ b }: { b: ImageTextBlock }) {
  const { tx, lang } = useLang()
  const { width } = useWindowDimensions()
  const side = width >= 700
  const img = b.image ? <Img src={b.image} aspect={side ? 4 / 5 : 4 / 3} alt={tx(b.alt)} radius={radius.md} /> : null
  const text = (
    <View>
      <SectionHead eyebrow={tx(b.eyebrow)} title={tx(b.title)} />
      <RichText doc={b.body?.[lang]} />
      <CmsButtons buttons={b.buttons} />
    </View>
  )
  return (
    <Section tone={b.tone}>
      {side ? (
        <View style={{ flexDirection: b.imageSide === 'right' ? 'row-reverse' : 'row', gap: space.xl, alignItems: 'center' }}>
          {img && <View style={{ flex: 1 }}>{img}</View>}
          <View style={{ flex: 1.2 }}>{text}</View>
        </View>
      ) : (
        <View style={{ gap: space.xl }}>
          {img}
          {text}
        </View>
      )}
    </Section>
  )
}

// ── Kartice ───────────────────────────────────────────────────────────────────

function CardsB({ b }: { b: CardsBlock }) {
  const { tx, t } = useLang()
  const dark = useToneDark(b.tone)
  const cols = useCols(300, 2)
  return (
    <Section tone={b.tone}>
      <SectionHead eyebrow={tx(b.eyebrow)} title={tx(b.title)} intro={tx(b.intro)} />
      <Grid
        items={b.items}
        cols={cols}
        gap={16}
        render={(it) => {
          const Wrapper = it.href ? Pressable : View
          return (
            <Wrapper
              {...(it.href ? { onPress: () => openHref(it.href), accessibilityRole: 'link' as const } : {})}
              style={[s.card, dark && s.cardDark]}
            >
              {!!it.image && <Img src={it.image} aspect={16 / 9} alt={tx(it.title)} />}
              <View style={{ padding: space.lg + 2 }}>
                <Text style={[s.cardTitle, dark && { color: colors.onDark }]}>{tx(it.title)}</Text>
                {!!tx(it.text) && <Text style={[s.cardText, dark && { color: colors.onDarkMuted }]}>{tx(it.text)}</Text>}
                {!!it.href && (
                  <View style={s.more}>
                    <Text style={s.moreText}>{t('more')}</Text>
                    <Feather name="arrow-right" size={15} color={colors.gold} />
                  </View>
                )}
              </View>
            </Wrapper>
          )
        }}
      />
    </Section>
  )
}

function useToneDark(tone?: string) {
  return tone === 'dark'
}

// ── Lista ─────────────────────────────────────────────────────────────────────

function ListB({ b }: { b: ListBlock }) {
  const { tx } = useLang()
  return (
    <Section tone={b.tone}>
      <SectionHead eyebrow={tx(b.eyebrow)} title={tx(b.title)} intro={tx(b.intro)} />
      <ListItems items={b.items.map(tx)} numbered={b.style === 'numbers'} />
    </Section>
  )
}

function ListItems({ items, numbered }: { items: string[]; numbered: boolean }) {
  const dark = useOnDark()
  return (
    <View style={{ gap: space.md }}>
      {items.filter(Boolean).map((it, i) => (
        <View key={i} style={[s.listRow, { borderColor: dark ? colors.lineDark : colors.line }]}>
          {numbered ? (
            <Text style={s.listNum}>{String(i + 1).padStart(2, '0')}</Text>
          ) : (
            <View style={s.listDot} />
          )}
          <Body style={{ flex: 1 }}>{it}</Body>
        </View>
      ))}
    </View>
  )
}

// ── Statistika ────────────────────────────────────────────────────────────────

function StatsB({ b }: { b: StatsBlock }) {
  const { tx } = useLang()
  const cols = useCols(130, 4)
  const n = Math.min(cols, b.items.length) || 1
  const dark = (b.tone ?? 'default') === 'dark'
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} center />
      <Grid
        items={b.items}
        cols={n}
        gap={16}
        render={(it) => (
          <View style={s.stat}>
            <Text style={[s.statValue, { color: dark ? colors.gold : colors.green }]} adjustsFontSizeToFit numberOfLines={1}>
              {it.value}
            </Text>
            <Text style={[s.statLabel, { color: dark ? colors.onDarkMuted : colors.muted }]}>{tx(it.label)}</Text>
          </View>
        )}
      />
    </Section>
  )
}

// ── Vremenska linija ──────────────────────────────────────────────────────────

function TimelineB({ b }: { b: TimelineBlock }) {
  const { tx } = useLang()
  const dark = b.tone === 'dark'
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} />
      <View>
        {b.items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row' }}>
            <View style={{ width: 22, alignItems: 'center' }}>
              <View style={s.tlDot} />
              {i < b.items.length - 1 && <View style={[s.tlLine, { backgroundColor: dark ? colors.lineDark : colors.line }]} />}
            </View>
            <View style={{ flex: 1, paddingLeft: space.md, paddingBottom: space.xl }}>
              <Text style={[s.tlDate, { color: dark ? colors.gold : colors.green }]}>{it.date}</Text>
              <Body style={{ marginTop: 2 }}>{tx(it.text)}</Body>
            </View>
          </View>
        ))}
      </View>
    </Section>
  )
}

// ── FAQ (harmonika) ───────────────────────────────────────────────────────────

function FaqB({ b }: { b: FaqBlock }) {
  const { tx, lang } = useLang()
  const [open, setOpen] = useState<number | null>(null)
  const dark = b.tone === 'dark'
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} />
      <View style={[s.faqWrap, { borderColor: dark ? colors.lineDark : colors.line }]}>
        {b.items.map((it, i) => {
          const isOpen = open === i
          return (
            <View key={i} style={[i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: dark ? colors.lineDark : colors.line }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                  setOpen(isOpen ? null : i)
                }}
                style={({ pressed }) => [s.faqQ, pressed && { opacity: 0.7 }]}
              >
                <Text style={[s.faqQText, { color: dark ? colors.onDark : colors.ink }]}>{tx(it.q)}</Text>
                <Feather name={isOpen ? 'minus' : 'plus'} size={18} color={colors.gold} />
              </Pressable>
              {isOpen && (
                <View style={{ paddingBottom: space.lg, paddingRight: space.lg }}>
                  <RichText doc={hasRich(it.a?.[lang]) ? it.a[lang] : it.a?.[lang === 'bs' ? 'de' : 'bs']} />
                </View>
              )}
            </View>
          )
        })}
      </View>
    </Section>
  )
}

// ── Ljudi ─────────────────────────────────────────────────────────────────────

function PeopleB({ b }: { b: PeopleBlock }) {
  const { tx } = useLang()
  const cols = useCols(140, 4)
  const dark = b.tone === 'dark'
  // Bez ijedne fotografije: kompaktna lista sa monogramima umjesto velikih kartica
  if (!b.items.some((p) => !!p.image)) {
    return (
      <Section tone={b.tone}>
        <SectionHead title={tx(b.title)} intro={tx(b.intro)} />
        <Grid
          items={b.items}
          cols={Math.min(2, Math.max(1, Math.floor(cols / 2)))}
          gap={14}
          render={(p) => (
            <View style={s.personRow}>
              <View style={s.monogram}>
                <Text style={s.monogramText}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.personName, { marginTop: 0 }, dark && { color: colors.onDark }]}>{p.name}</Text>
                {!!tx(p.role) && <Text style={[s.personRole, dark && { color: colors.onDarkMuted }]}>{tx(p.role)}</Text>}
              </View>
            </View>
          )}
        />
      </Section>
    )
  }
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} intro={tx(b.intro)} />
      <Grid
        items={b.items}
        cols={Math.max(2, cols)}
        gap={14}
        render={(p) => (
          <View>
            <Img
              src={p.image}
              aspect={4 / 5}
              alt={p.name}
              radius={radius.md}
              bg={colors.green}
              fallback={
                <View style={s.initials}>
                  <Text style={s.initialsText}>{initials(p.name)}</Text>
                </View>
              }
            />
            <Text style={[s.personName, dark && { color: colors.onDark }]}>{p.name}</Text>
            {!!tx(p.role) && <Text style={[s.personRole, dark && { color: colors.onDarkMuted }]}>{tx(p.role)}</Text>}
          </View>
        )}
      />
    </Section>
  )
}

function initials(name: string) {
  return name
    .replace(/\b(ef|hfz|dr|mr)\.?\s/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

// ── Galerija ──────────────────────────────────────────────────────────────────

function GalleryB({ b }: { b: GalleryBlock }) {
  const { tx } = useLang()
  const { width } = useWindowDimensions()
  const cols = width < 360 ? 2 : width < 600 ? 3 : 4
  const [index, setIndex] = useState<number | null>(null)
  const images = b.images.filter((i) => !!i.image)
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} />
      <Grid
        items={images}
        cols={cols}
        gap={6}
        render={(im, i) => (
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={tx(im.alt)} onPress={() => setIndex(i)} style={({ pressed }) => pressed && { opacity: 0.8 }}>
            <Img src={im.image} aspect={1} radius={radius.sm} />
          </Pressable>
        )}
      />
      <Lightbox images={images.map((im) => ({ uri: im.image, alt: tx(im.alt) }))} index={index} onChange={setIndex} />
    </Section>
  )
}

// ── Citat ─────────────────────────────────────────────────────────────────────

function QuoteB({ b }: { b: QuoteBlock }) {
  const { tx } = useLang()
  const dark = b.tone === 'dark'
  return (
    <Section tone={b.tone}>
      <View style={{ alignItems: 'center' }}>
        {!!b.arabic && (
          <Text style={[s.arabic, { color: dark ? colors.gold : colors.green }]} maxFontSizeMultiplier={1.3}>
            {b.arabic}
          </Text>
        )}
        <View style={[s.rule, { marginVertical: space.lg }]} />
        {!!tx(b.text) && <Text style={[s.quote, { color: dark ? colors.onDark : colors.ink }]}>{tx(b.text)}</Text>}
        {!!tx(b.source) && <Text style={[s.quoteSrc, { color: dark ? colors.onDarkMuted : colors.muted }]}>{tx(b.source)}</Text>}
      </View>
    </Section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CtaB({ b }: { b: CtaBlock }) {
  const { tx } = useLang()
  return (
    <Section tone={b.tone ?? 'dark'}>
      <View style={{ alignItems: 'center' }}>
        <Heading style={{ textAlign: 'center' }}>{tx(b.title)}</Heading>
        <View style={[s.rule, { marginTop: space.md }]} />
        {!!tx(b.text) && (
          <Body muted style={{ textAlign: 'center', marginTop: space.sm }}>
            {tx(b.text)}
          </Body>
        )}
        <CmsButtons buttons={b.buttons} center />
      </View>
    </Section>
  )
}

// ── Info redovi ───────────────────────────────────────────────────────────────

function InfoB({ b }: { b: InfoBlock }) {
  const { tx } = useLang()
  const dark = b.tone === 'dark'
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} />
      <View style={[s.infoWrap, dark && { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.lineDark }]}>
        {b.items.map((it, i) => {
          const val = tx(it.value)
          const row = (
            <View style={[s.infoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: dark ? colors.lineDark : colors.line }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.infoLabel, dark && { color: colors.onDarkMuted }]}>{tx(it.label)}</Text>
                <Text selectable style={[s.infoValue, dark && { color: colors.onDark }, !!it.href && { color: dark ? colors.gold : colors.green }]}>
                  {val}
                </Text>
              </View>
              {!!it.href && <Feather name={iconForHref(it.href)} size={18} color={colors.gold} />}
            </View>
          )
          return it.href ? (
            <Pressable key={i} accessibilityRole="link" onPress={() => openHref(it.href)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
              {row}
            </Pressable>
          ) : (
            <View key={i}>{row}</View>
          )
        })}
      </View>
    </Section>
  )
}

export function iconForHref(href: string): keyof typeof Feather.glyphMap {
  if (href.startsWith('tel:')) return 'phone'
  if (href.startsWith('mailto:')) return 'mail'
  if (/maps|geo:/.test(href)) return 'map-pin'
  if (/^https?:/.test(href)) return 'external-link'
  return 'chevron-right'
}

// ── Vaktija blok ──────────────────────────────────────────────────────────────

function PrayerTimesB({ b }: { b: PrayerTimesBlock }) {
  const { tx, t } = useLang()
  const { data } = useVaktija()
  return (
    <Section tone={b.tone === 'dark' ? 'default' : b.tone}>
      <SectionHead title={tx(b.title)} intro={tx(b.intro)} />
      <PrayerToday />
      {b.variant === 'month' && data && data.month.length > 0 && (
        <View style={{ marginTop: space.xl }}>
          <Heading level={3} style={{ marginBottom: space.md }}>
            {t('monthTitle')}
          </Heading>
          <MonthTable data={data} />
          <Text style={s.source}>{t('source')}</Text>
        </View>
      )}
    </Section>
  )
}

// ── Mapa ──────────────────────────────────────────────────────────────────────

function MapB({ b }: { b: MapBlock }) {
  const { tx, t } = useLang()
  return (
    <Section tone={b.tone}>
      <SectionHead title={tx(b.title)} />
      <View style={s.mapCard}>
        <View style={s.mapPin}>
          <Feather name="map-pin" size={20} color={colors.gold} />
        </View>
        <Text style={s.mapAddress} selectable>
          {b.address}
        </Text>
        <ToneProvider tone="dark">
          <Btn label={t('openMaps')} onPress={() => openHref(mapsHref(b.address, b.lat, b.lng))} style={{ marginTop: space.lg }} />
        </ToneProvider>
      </View>
    </Section>
  )
}

function MembershipB({ b }: { b: Extract<Block, { type: 'membershipForm' }> }) {
  const { tx } = useLang()
  return (
    <Section tone={b.tone === 'dark' ? 'light' : b.tone ?? 'light'}>
      <SectionHead title={tx(b.title)} intro={tx(b.intro)} />
      <MembershipForm />
    </Section>
  )
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export function BlockView({ block, topInset = 0 }: { block: Block; topInset?: number }) {
  switch (block.type) {
    case 'hero':
      return <Hero b={block} topInset={topInset} />
    case 'text':
      return <TextB b={block} />
    case 'image':
      return <ImageB b={block} />
    case 'imageText':
      return <ImageTextB b={block} />
    case 'cards':
      return <CardsB b={block} />
    case 'list':
      return <ListB b={block} />
    case 'stats':
      return <StatsB b={block} />
    case 'timeline':
      return <TimelineB b={block} />
    case 'faq':
      return <FaqB b={block} />
    case 'people':
      return <PeopleB b={block} />
    case 'gallery':
      return <GalleryB b={block} />
    case 'quote':
      return <QuoteB b={block} />
    case 'cta':
      return <CtaB b={block} />
    case 'info':
      return <InfoB b={block} />
    case 'prayerTimes':
      return <PrayerTimesB b={block} />
    case 'membershipForm':
      return <MembershipB b={block} />
    case 'map':
      return <MapB b={block} />
    default:
      return null
  }
}

export function Blocks({ blocks, firstTopInset = 0 }: { blocks: Block[]; firstTopInset?: number }) {
  const visible = blocks.filter((b) => !b.hidden)
  return (
    <>
      {visible.map((b, i) => (
        <BlockView key={b.id ?? i} block={b} topInset={i === 0 ? firstTopInset : 0} />
      ))}
    </>
  )
}

const s = StyleSheet.create({
  caption: { fontSize: 13, marginTop: space.sm, textAlign: 'center' },
  card: { backgroundColor: colors.paper, borderRadius: radius.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, flexGrow: 1 },
  cardDark: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: colors.lineDark },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.green },
  cardText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: space.sm },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  moreText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.gold },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  listNum: { fontFamily: fonts.display, fontSize: 18, color: colors.gold, width: 36, lineHeight: 25, fontVariant: ['tabular-nums'] },
  listDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold, marginTop: 10, marginRight: space.lg, marginLeft: 2 },
  stat: { alignItems: 'center', paddingVertical: space.md },
  statValue: { fontFamily: fonts.display, fontSize: 38 },
  statLabel: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  tlDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.cream, marginTop: 5 },
  tlLine: { width: 1.5, flex: 1, marginTop: 4 },
  tlDate: { fontFamily: fonts.display, fontSize: 19 },
  faqWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  faqQ: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, minHeight: 56 },
  faqQText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23 },
  initials: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: fonts.display, fontSize: 34, color: colors.gold },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  monogram: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontFamily: fonts.display, fontSize: 16, color: colors.gold },
  personName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginTop: space.sm },
  personRole: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  arabic: { fontSize: 28, lineHeight: 48, textAlign: 'center', writingDirection: 'rtl' },
  rule: { width: 36, height: 2, backgroundColor: colors.gold },
  quote: { fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 29, textAlign: 'center' },
  quoteSrc: { fontFamily: fonts.medium, fontSize: 13, marginTop: space.md, letterSpacing: 0.5 },
  infoWrap: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingHorizontal: space.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + 2, minHeight: 56 },
  infoLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, letterSpacing: 0.3 },
  infoValue: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink, marginTop: 2 },
  source: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: space.sm, textAlign: 'right' },
  mapCard: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: space.xl, alignItems: 'flex-start' },
  mapPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  mapAddress: { fontFamily: fonts.display, fontSize: 20, lineHeight: 27, color: colors.green },
})
