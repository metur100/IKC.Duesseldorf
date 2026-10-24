import { Platform } from 'react-native'

export const colors = {
  green: '#0b4636',
  greenDark: '#072f24',
  greenSoft: '#e3ece7',
  gold: '#c9a24a',
  goldSoft: '#f1e6c8',
  cream: '#f7f1e3',
  creamDark: '#efe6d1',
  paper: '#fffdf8',
  ink: '#1c221f',
  muted: '#5b6560',
  line: '#e4dccb',
  lineDark: 'rgba(247,241,227,0.18)',
  onDark: '#f7f1e3',
  onDarkMuted: 'rgba(247,241,227,0.72)',
  danger: '#a3362a',
  white: '#ffffff',
}

export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyItalic: 'Inter_400Regular_Italic',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }

/** Maksimalna širina sadržaja na tabletima. */
export const MAX_WIDTH = 720

export const radius = { sm: 6, md: 10, lg: 16 }

export const shadow = Platform.select({
  ios: { shadowColor: '#072f24', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  default: { elevation: 2 },
})
