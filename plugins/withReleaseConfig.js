const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

module.exports = config => {
  config = withAndroidManifest(config, mod => {
    mod.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'false';
    return mod;
  });
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.contents.includes('def bbSigning =')) return mod;
    const guard = `
def bbSigning = ['BUGBAAS_KEYSTORE_PATH', 'BUGBAAS_KEYSTORE_PASSWORD', 'BUGBAAS_KEY_ALIAS', 'BUGBAAS_KEY_PASSWORD']
if (gradle.startParameter.taskNames.any { it.toLowerCase().contains('release') } && bbSigning.any { !System.getenv(it) }) {
    throw new GradleException('BugBaas release signing is required; no debug certificate fallback.')
}
`;
    mod.modResults.contents = guard + mod.modResults.contents
      .replace('signingConfigs {', `signingConfigs {
        production {
            def path = System.getenv('BUGBAAS_KEYSTORE_PATH')
            if (path) {
                storeFile file(path)
                storePassword System.getenv('BUGBAAS_KEYSTORE_PASSWORD')
                keyAlias System.getenv('BUGBAAS_KEY_ALIAS')
                keyPassword System.getenv('BUGBAAS_KEY_PASSWORD')
            }
        }`)
      .replace(/(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.production');
    return mod;
  });
};
