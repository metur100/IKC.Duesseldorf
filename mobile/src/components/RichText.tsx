import { Fragment, ReactNode } from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import type { RichDoc, RichNode } from '@/cms/types'
import { openHref } from '@/lib/links'
import { colors, fonts, space } from '@/lib/theme'
import { useOnDark } from './ui'

/** Renderer za ProseMirror/TipTap JSON (bez WebView-a i HTML-a). */
export function RichText({ doc, center }: { doc: RichDoc | undefined | null; center?: boolean }) {
  const dark = useOnDark()
  if (!doc?.content?.length) return null
  const ctx: Ctx = { dark, center: !!center }
  const blocks = doc.content.filter((n) => !isEmptyParagraph(n))
  return <View>{blocks.map((n, i) => renderBlock(n, i, ctx, i === 0))}</View>
}

/** Ima li dokument ikakvog teksta */
export function hasRich(doc: RichDoc | undefined | null): boolean {
  const walk = (n: RichNode): boolean => (!!n.text && n.text.trim().length > 0) || (n.content ?? []).some(walk)
  return !!doc && walk(doc)
}

interface Ctx {
  dark: boolean
  center: boolean
}

function isEmptyParagraph(n: RichNode) {
  return n.type === 'paragraph' && !(n.content ?? []).length
}

function textColor(ctx: Ctx) {
  return ctx.dark ? colors.onDark : colors.ink
}

function renderBlock(node: RichNode, key: number | string, ctx: Ctx, first = false): ReactNode {
  const align: TextStyle = ctx.center ? { textAlign: 'center' } : {}
  const mt = first ? 0 : undefined
  switch (node.type) {
    case 'paragraph':
      return (
        <Text key={key} maxFontSizeMultiplier={1.6} style={[s.p, { color: textColor(ctx) }, align, mt === 0 && { marginTop: 0 }]}>
          {renderInline(node.content, ctx)}
        </Text>
      )
    case 'heading': {
      const level = node.attrs?.level === 3 ? 3 : 2
      return (
        <Text
          key={key}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.4}
          style={[level === 2 ? s.h2 : s.h3, { color: ctx.dark ? colors.onDark : colors.green }, align, mt === 0 && { marginTop: 0 }]}
        >
          {renderInline(node.content, ctx)}
        </Text>
      )
    }
    case 'bulletList':
    case 'orderedList': {
      const ordered = node.type === 'orderedList'
      const start = typeof node.attrs?.start === 'number' ? (node.attrs.start as number) : 1
      return (
        <View key={key} style={[s.list, mt === 0 && { marginTop: 0 }]}>
          {(node.content ?? []).map((li, i) => (
            <View key={i} style={s.li}>
              {ordered ? (
                <Text style={[s.num, { color: ctx.dark ? colors.gold : colors.gold }]}>{start + i}.</Text>
              ) : (
                <View style={[s.dot, { backgroundColor: colors.gold }]} />
              )}
              <View style={{ flex: 1 }}>{(li.content ?? []).map((c, j) => renderBlock(c, j, { ...ctx, center: false }, j === 0))}</View>
            </View>
          ))}
        </View>
      )
    }
    case 'listItem':
      return <View key={key}>{(node.content ?? []).map((c, j) => renderBlock(c, j, ctx, j === 0))}</View>
    case 'blockquote':
      return (
        <View key={key} style={[s.quote, { borderColor: colors.gold }, mt === 0 && { marginTop: 0 }]}>
          {(node.content ?? []).map((c, j) => renderBlock(c, j, ctx, j === 0))}
        </View>
      )
    case 'horizontalRule':
      return <View key={key} style={[s.hr, { backgroundColor: ctx.dark ? colors.lineDark : colors.line }]} />
    case 'hardBreak':
      return <Text key={key}>{'\n'}</Text>
    case 'text':
      return (
        <Text key={key} style={[s.p, { color: textColor(ctx) }]}>
          {renderInline([node], ctx)}
        </Text>
      )
    default:
      // Nepoznat tip: pokušaj prikazati djecu
      if (node.content?.length) return <Fragment key={key}>{node.content.map((c, j) => renderBlock(c, `${key}-${j}`, ctx, first && j === 0))}</Fragment>
      return null
  }
}

function renderInline(nodes: RichNode[] | undefined, ctx: Ctx): ReactNode {
  if (!nodes) return null
  return nodes.map((n, i) => {
    if (n.type === 'hardBreak') return '\n'
    if (n.type !== 'text') return <Fragment key={i}>{renderInline(n.content, ctx)}</Fragment>
    const style: { fontFamily?: string } = {}
    let href: string | undefined
    for (const m of n.marks ?? []) {
      if (m.type === 'bold') style.fontFamily = fonts.semibold
      else if (m.type === 'italic') style.fontFamily = style.fontFamily === fonts.semibold ? fonts.semibold : fonts.bodyItalic
      else if (m.type === 'link' && typeof m.attrs?.href === 'string') href = m.attrs.href
    }
    if (href) {
      const target = href
      return (
        <Text
          key={i}
          accessibilityRole="link"
          onPress={() => openHref(target)}
          style={[style, { color: ctx.dark ? colors.gold : colors.green, textDecorationLine: 'underline', textDecorationColor: colors.gold }]}
        >
          {n.text}
        </Text>
      )
    }
    return Object.keys(style).length ? (
      <Text key={i} style={style}>
        {n.text}
      </Text>
    ) : (
      n.text
    )
  })
}

const s = StyleSheet.create({
  p: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26, marginTop: space.md },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 29, marginTop: space.xl, marginBottom: 2 },
  h3: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24, marginTop: space.lg + 4, marginBottom: 2 },
  list: { marginTop: space.md, gap: space.sm },
  li: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 11, marginRight: space.md, marginLeft: 2 },
  num: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 26, minWidth: 22, marginRight: space.sm, fontVariant: ['tabular-nums'] },
  quote: { borderLeftWidth: 2, paddingLeft: space.lg, marginTop: space.lg },
  hr: { height: StyleSheet.hairlineWidth, marginVertical: space.xl },
})
