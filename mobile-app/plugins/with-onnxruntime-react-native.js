const { withAppBuildGradle, withDangerousMod, createRunOncePlugin, withMainApplication } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const path = require('path');
const fs = require('fs');
const pkg = require('onnxruntime-react-native/package.json');

const withOrtFixed = (config) => {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('Cannot add ONNX Runtime maven gradle because the build.gradle is not groovy');
    }

    // Inject onnxruntime-react-native dependency
    config.modResults.contents = mergeContents({
      src: config.modResults.contents,
      newSrc: "    implementation project(':onnxruntime-react-native')",
      tag: 'onnxruntime-react-native',
      anchor: /^dependencies[ \t]*\{$/m,
      offset: 1,
      comment: '    // onnxruntime-react-native',
    }).contents;

    // Inject abiFilters (arm64-v8a only) and REACT_NATIVE_RELEASE_LEVEL into defaultConfig
    config.modResults.contents = mergeContents({
      src: config.modResults.contents,
      newSrc: [
        '        ndk {',
        '            abiFilters "arm64-v8a"',
        '        }',
        '        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\\"stable\\""',
      ].join('\n'),
      tag: 'onnxruntime-android-config',
      anchor: /^[ \t]*defaultConfig[ \t]*\{$/m,
      offset: 1,
      comment: '        // onnxruntime-android-config',
    }).contents;

    return config;
  });

  // --- NEW BLOCK: FORCE MANUAL LINKING IN MAIN APPLICATION ---
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Inject the import statement at the top of the file
    if (!contents.includes('import ai.onnxruntime.reactnative.OnnxruntimePackage')) {
      contents = contents.replace(
        /^package .+$/m,
        `$&\nimport ai.onnxruntime.reactnative.OnnxruntimePackage;`
      );
    }

    // 2. Inject the package instantiation (Kotlin syntax for modern Expo)
    if (contents.includes('PackageList(this).packages.apply {') && !contents.includes('add(OnnxruntimePackage())')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/m,
        `PackageList(this).packages.apply {\n          add(OnnxruntimePackage())`
      );
    }
    // Fallback for older Java syntax just in case
    else if (contents.includes('new PackageList(this).getPackages();') && !contents.includes('packages.add(new OnnxruntimePackage());')) {
      contents = contents.replace(
        /List<ReactPackage> packages = new PackageList\(this\)\.getPackages\(\);/m,
        `List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new OnnxruntimePackage());`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
  // --- END OF NEW BLOCK ---

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const podFilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podFilePath, { encoding: 'utf-8' });
      const updatedContents = mergeContents({
        src: contents,
        newSrc: "  pod 'onnxruntime-react-native', :path => '../node_modules/onnxruntime-react-native'",
        tag: 'onnxruntime-react-native',
        anchor: /^target.+do$/m,
        offset: 1,
        comment: '  # onnxruntime-react-native',
      }).contents;
      fs.writeFileSync(podFilePath, updatedContents);
      return config;
    },
  ]);

  return config;
};

module.exports = createRunOncePlugin(withOrtFixed, pkg.name, pkg.version);