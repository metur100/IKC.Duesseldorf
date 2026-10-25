// Manji Android build:
// - samo ARM arhitekture (x86/x86_64 trebaju samo emulatorima na računaru) — svaka nosi ~24 MB nativnih biblioteka
// - nativne biblioteke se komprimuju u APK-u (inače su spremljene nekomprimovane)
// - R8 + uklanjanje nekorištenih resursa u release buildu
// Play Store (AAB) ionako svakom telefonu isporučuje samo njegovu arhitekturu.
const { withGradleProperties } = require('expo/config-plugins')

const PROPS = {
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
  'expo.useLegacyPackaging': 'true',
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
}

module.exports = function withSmallerApk(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const item = cfg.modResults.find((p) => p.type === 'property' && p.key === key)
      if (item) item.value = value
      else cfg.modResults.push({ type: 'property', key, value })
    }
    return cfg
  })
}
