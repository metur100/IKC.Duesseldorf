import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView as RNWebView } from 'react-native-webview'

type WebViewHandle = { goBack: () => void; reload: () => void }
type NavState = { url: string; canGoBack: boolean }
type LoadRequest = { url: string; isTopFrame?: boolean }
// Tipovi react-native-webview 14 se sa @types/react 19.3 svode na 'never' – koristimo labaviji tip.
const WebView = RNWebView as unknown as React.ComponentType<Record<string, unknown> & { ref?: React.Ref<WebViewHandle> }>
import { SITE_URL } from '@/lib/config'
import { useLang } from '@/lib/i18n'
import { colors, fonts, space } from '@/lib/theme'

const ADMIN_URL = `${SITE_URL}/admin`
const SITE_ORIGIN = new URL(SITE_URL).origin
const API_ORIGIN = 'https://ikcduesseldorf.runasp.net'

/** Web CMS (/admin) u WebView-u. Sesija ostaje sačuvana u localStorage-u WebView-a. */
export default function AdminScreen() {
  const { t } = useLang()
  const insets = useSafeAreaInsets()
  const ref = useRef<WebViewHandle>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        ref.current?.goBack()
        return true
      }
      router.back()
      return true
    })
    return () => sub.remove()
  }, [canGoBack])

  return (
    <View style={{ flex: 1, backgroundColor: colors.green }}>
      <View style={[s.bar, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          disabled={!canGoBack}
          onPress={() => ref.current?.goBack()}
          hitSlop={10}
          style={[s.btn, !canGoBack && { opacity: 0.3 }]}
        >
          <Feather name="chevron-left" size={24} color={colors.onDark} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>
          {t('admin')}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={() => router.back()} hitSlop={10} style={s.btn}>
          <Feather name="x" size={22} color={colors.onDark} />
        </Pressable>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        {failed ? (
          <View style={s.center}>
            <Text style={s.msg}>{t('f_error')}</Text>
            <Pressable
              onPress={() => {
                setFailed(false)
                ref.current?.reload()
              }}
              style={s.retry}
            >
              <Text style={s.retryText}>{t('reload')}</Text>
            </Pressable>
          </View>
        ) : null}
        <WebView
          ref={ref}
          source={{ uri: ADMIN_URL }}
          style={[{ flex: 1 }, failed && { height: 0, flex: 0 }]}
          originWhitelist={['https://*']}
          domStorageEnabled
          javaScriptEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled
          incognito={false}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          onNavigationStateChange={(nav: NavState) => setCanGoBack(nav.canGoBack)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={(req: LoadRequest) => {
            // Admin i API ostaju u WebView-u, ostalo (npr. vanjski linkovi) u pregledniku
            if (req.url.startsWith(SITE_ORIGIN) || req.url.startsWith(API_ORIGIN) || req.url.startsWith('about:') || req.url.startsWith('blob:') || req.url.startsWith('data:')) return true
            if (/^https?:/.test(req.url) && !req.isTopFrame) return true
            Linking.openURL(req.url).catch(() => {})
            return false
          }}
        />
        {loading && !failed && (
          <View style={s.loading} pointerEvents="none">
            <ActivityIndicator color={colors.green} />
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingBottom: space.sm, backgroundColor: colors.green },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 18, color: colors.onDark },
  loading: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  msg: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  retry: { marginTop: space.lg, paddingHorizontal: space.xl, paddingVertical: space.md, borderRadius: 6, backgroundColor: colors.green },
  retryText: { fontFamily: fonts.semibold, color: colors.onDark },
})
