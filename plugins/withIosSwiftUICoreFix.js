const { withPodfile } = require('expo/config-plugins');

/**
 * Xcode 26 workaround — use default toolchain and disable explicit Swift modules.
 * Do NOT add -weak_framework SwiftUICore; that can force direct SwiftUICore linkage.
 *
 * @see https://github.com/facebook/react-native/pull/53457
 * @see https://github.com/actions/runner-images/issues/13135
 */
const XCODE_26_LINKER_FIX = `
    # Xcode 26 Swift / precompiled modules workaround
    def apply_xcode26_toolchain_fix(config)
      config.build_settings['TOOLCHAINS'] = 'com.apple.dt.toolchain.XcodeDefault'
      config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
    end

    [installer.pods_project].concat(
      installer.aggregate_targets.map(&:user_project)
    ).compact.uniq.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |config|
          apply_xcode26_toolchain_fix(config)
        end
      end
      project.save
    end
`;

function withIosSwiftUICoreFix(config) {
  return withPodfile(config, (cfg) => {
    if (cfg.modResults.contents.includes('apply_xcode26_toolchain_fix')) {
      return cfg;
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /react_native_post_install\([\s\S]*?\)\n/,
      (match) => `${match}${XCODE_26_LINKER_FIX}`
    );

    return cfg;
  });
}

module.exports = withIosSwiftUICoreFix;
