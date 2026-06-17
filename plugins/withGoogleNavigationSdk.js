const {
  withGradleProperties,
  withAppBuildGradle,
  withAppDelegate,
  withInfoPlist,
  withAndroidManifest,
  AndroidConfig,
} = require('expo/config-plugins');

function withGradleHeap(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const heapKey = 'org.gradle.jvmargs';
    const heapEntry = props.find((p) => p.type === 'property' && p.key === heapKey);
    const heapValue = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError';

    if (heapEntry) {
      heapEntry.value = heapValue;
    } else {
      props.push({ type: 'property', key: heapKey, value: heapValue });
    }

    return cfg;
  });
}

function withAndroidDesugaring(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes('coreLibraryDesugaringEnabled')) {
      if (contents.includes('compileOptions {')) {
        contents = contents.replace(
          /compileOptions\s*\{/,
          'compileOptions {\n        coreLibraryDesugaringEnabled true'
        );
      } else {
        contents = contents.replace(
          /android\s*\{/,
          `android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }`
        );
      }
    }

    if (!contents.includes('desugar_jdk_libs_nio')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        "dependencies {\n    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.0.4'"
      );
    }

    contents = contents.replace(/minSdkVersion\s+rootProject\.ext\.minSdkVersion/, 'minSdkVersion 24');

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withAndroidMapsApiKey(config, androidApiKey) {
  return withAndroidManifest(config, (cfg) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.google.android.geo.API_KEY',
      androidApiKey
    );
    return cfg;
  });
}

function withIosGoogleMapsApiKey(config, iosApiKey) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.GMSApiKey = iosApiKey;
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    const apiKey = iosApiKey;
    let contents = cfg.modResults.contents;

    if (cfg.modResults.language === 'swift') {
      if (!contents.includes('import GoogleMaps')) {
        contents = `import GoogleMaps\n${contents}`;
      }
      if (!contents.includes('GMSServices.provideAPIKey')) {
        contents = contents.replace(
          /(func application\([^)]+\)[^{]*\{)/,
          `$1\n    GMSServices.provideAPIKey("${apiKey}")`
        );
      } else {
        contents = contents.replace(
          /GMSServices\.provideAPIKey\("[^"]*"\)/,
          `GMSServices.provideAPIKey("${apiKey}")`
        );
      }
    } else {
      if (!contents.includes('#import <GoogleMaps/GoogleMaps.h>')) {
        contents = `#import <GoogleMaps/GoogleMaps.h>\n${contents}`;
      }
      if (!contents.includes('GMSServices provideAPIKey')) {
        contents = contents.replace(
          /(didFinishLaunchingWithOptions:[^\{]*\{)/,
          `$1\n  [GMSServices provideAPIKey:@"${apiKey}"];`
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withGoogleNavigationSdk(config, { androidApiKey = '', iosApiKey = '' } = {}) {
  config = withGradleHeap(config);
  config = withAndroidDesugaring(config);
  config = withAndroidMapsApiKey(config, androidApiKey);
  config = withIosGoogleMapsApiKey(config, iosApiKey);

  if (config.android?.config?.googleMaps) {
    config.android.config.googleMaps.apiKey = androidApiKey;
  }

  return config;
}

module.exports = withGoogleNavigationSdk;
