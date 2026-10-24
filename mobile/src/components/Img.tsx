import { Image, ImageContentFit } from 'expo-image'
import { ReactNode, useEffect, useState } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { resolveImage } from '@/lib/config'
import { colors } from '@/lib/theme'

/** Slika iz CMS-a. Zauzima širinu roditelja, visina iz omjera (aspect). */
export function Img({
  src,
  aspect = 3 / 2,
  style,
  fit = 'cover',
  alt,
  radius = 0,
  bg = colors.creamDark,
  fallback,
}: {
  src: string | undefined | null
  aspect?: number
  style?: StyleProp<ViewStyle>
  fit?: ImageContentFit
  alt?: string
  radius?: number
  /** Pozadina dok se slika učitava / ako je nema */
  bg?: string
  /** Prikaz ako slike nema ili se ne može učitati */
  fallback?: ReactNode
}) {
  const uri = resolveImage(src)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [uri])
  return (
    <View style={[{ width: '100%', aspectRatio: aspect, backgroundColor: bg, borderRadius: radius, overflow: 'hidden' }, style]}>
      {(!uri || failed) && fallback}
      {uri && !failed && (
        <Image
          onError={() => setFailed(true)}
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit={fit}
          transition={200}
          cachePolicy="memory-disk"
          accessibilityLabel={alt}
          accessible={!!alt}
        />
      )}
    </View>
  )
}
