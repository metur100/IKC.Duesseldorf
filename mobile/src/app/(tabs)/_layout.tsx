import Feather from '@expo/vector-icons/Feather'
import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLang } from '@/lib/i18n'
import { colors, fonts } from '@/lib/theme'

export default function TabLayout() {
  const { t } = useLang()
  const insets = useSafeAreaInsets()
  const icon =
    (name: keyof typeof Feather.glyphMap) =>
    ({ color }: { color: unknown }) => <Feather name={name} size={21} color={color as string} />
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: '#8a918d',
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11.5, marginTop: 1 },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        sceneStyle: { backgroundColor: colors.cream },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: icon('home') }} />
      <Tabs.Screen name="vaktija" options={{ title: t('tabVaktija'), tabBarIcon: icon('clock') }} />
      <Tabs.Screen name="dzemat" options={{ title: t('tabCommunity'), tabBarIcon: icon('book-open') }} />
      <Tabs.Screen name="vise" options={{ title: t('tabMore'), tabBarIcon: icon('more-horizontal') }} />
    </Tabs>
  )
}
