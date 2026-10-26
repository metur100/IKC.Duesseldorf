// Ime aplikacije na početnom ekranu, sa "ü".
// "name" u app.json mora biti ASCII: prebuild od "Düsseldorf" pravi Xcode target "IKCDusseldorf",
// a EAS credentials traži "IKCDsseldorf" i iOS build pada ("Could not find target").
const { withInfoPlist, withStringsXml, AndroidConfig } = require('expo/config-plugins')

module.exports = function withDisplayName(config, displayName) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleDisplayName = displayName
    return cfg
  })
  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [AndroidConfig.Resources.buildResourceItem({ name: 'app_name', value: displayName })],
      cfg.modResults,
    )
    return cfg
  })
}
