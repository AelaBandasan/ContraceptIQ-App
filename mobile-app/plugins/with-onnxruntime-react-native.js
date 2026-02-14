const { withAppBuildGradle, withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const path = require('path');
const fs = require('fs');
const pkg = require('onnxruntime-react-native/package.json');

// Fix ONNX Runtime plugin anchors to work with multiline Gradle/Podfile
const withOrtFixed = (config) => {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('Cannot add ONNX Runtime maven gradle because the build.gradle is not groovy');
    }

    config.modResults.contents = mergeContents({
      src: config.modResults.contents,
      newSrc: "    implementation project(':onnxruntime-react-native')",
      tag: 'onnxruntime-react-native',
      anchor: /^dependencies[ \t]*\{$/m,
      offset: 1,
      comment: '    // onnxruntime-react-native',
    }).contents;

    return config;
  });

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