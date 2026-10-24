// Lokalni Android release build potpisuje upload ključem ako su u ~/.gradle/gradle.properties
// postavljeni IKCD_UPLOAD_* (putanja do .jks, alias, lozinke). Bez njih ostaje debug ključ,
// a EAS build ionako postavlja svoje potpisivanje.
const { withAppBuildGradle } = require('expo/config-plugins')

const UPLOAD_CONFIG = `
        upload {
            if (project.hasProperty('IKCD_UPLOAD_STORE_FILE')) {
                storeFile file(IKCD_UPLOAD_STORE_FILE)
                storePassword IKCD_UPLOAD_STORE_PASSWORD
                keyAlias IKCD_UPLOAD_KEY_ALIAS
                keyPassword IKCD_UPLOAD_KEY_PASSWORD
            }
        }`

module.exports = function withUploadSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents
    if (src.includes('IKCD_UPLOAD_STORE_FILE')) return cfg
    src = src.replace(/signingConfigs \{/, (m) => m + UPLOAD_CONFIG)
    src = src.replace(
      /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('IKCD_UPLOAD_STORE_FILE') ? signingConfigs.upload : signingConfigs.debug",
    )
    cfg.modResults.contents = src
    return cfg
  })
}
