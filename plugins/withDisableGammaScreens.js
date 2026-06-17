const { withPodfile } = require('expo/config-plugins');

/**
 * expo-router enables RNS_GAMMA_ENABLED which pulls in extra native UI features.
 * Setting this before expo-router's ||= line keeps gamma screens disabled.
 */
function withDisableGammaScreens(config) {
  return withPodfile(config, (cfg) => {
    if (cfg.modResults.contents.includes("ENV['RNS_GAMMA_ENABLED'] = '0'")) {
      return cfg;
    }

    cfg.modResults.contents = `# Disabled for driver POC — basic Stack navigation only\nENV['RNS_GAMMA_ENABLED'] = '0'\n${cfg.modResults.contents}`;
    return cfg;
  });
}

module.exports = withDisableGammaScreens;
