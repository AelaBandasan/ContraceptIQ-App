# Fixing ONNX Runtime in Expo (Continuous Native Generation)

## The Problem
When implementing `onnxruntime-react-native` for offline machine learning inference in a modern Expo project (CNG / SDK 50+), the app throws the following JavaScript error upon loading the model:

> `ERROR - Failed to load ONNX models {"error": [TypeError: Cannot read property 'create' of null]}`

## The Root Cause
This error occurs because the React Native JavaScript bridge returns `null` when attempting to access the ONNX engine. While the C++ engine compiles correctly, React Native's modern autolinker completely misses the `OnnxruntimePackage` and fails to add it to the generated `PackageList.java` file. Because the autolinker is blind to it, the native Android module and the JavaScript code remain disconnected.

## The Solution: Manual Linking via Config Plugin
To fix this, we bypass the autolinker entirely. We use an Expo Config Plugin to forcefully inject the Java/Kotlin import and package initialization directly into the `MainApplication` file during the prebuild phase.

### Step 1: Create/Update the Config Plugin
Create or update the plugin file at `./plugins/with-onnxruntime-react-native.js` with the following code. This script modifies the `build.gradle` for C++ compatibility and forcefully links the package in `MainApplication`.

```javascript
const { withAppBuildGradle, withDangerousMod, createRunOncePlugin, withMainApplication } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const path = require('path');
const fs = require('fs');
const pkg = require('onnxruntime-react-native/package.json');

const withOrtFixed = (config) => {
  // 1. Configure Android Gradle for C++ compatibility
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

  // 2. Force Manual Linking in MainApplication (Bypass Autolinker)
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Inject the import statement
    if (!contents.includes('import ai.onnxruntime.reactnative.OnnxruntimePackage')) {
      contents = contents.replace(
        /^package .+$/m,
        `$&\nimport ai.onnxruntime.reactnative.OnnxruntimePackage;`
      );
    }

    // Inject the package instantiation (Kotlin syntax)
    if (contents.includes('PackageList(this).packages.apply {') && !contents.includes('add(OnnxruntimePackage())')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/m,
        `PackageList(this).packages.apply {\n          add(OnnxruntimePackage())`
      );
    } 
    // Fallback for older Java syntax
    else if (contents.includes('new PackageList(this).getPackages();') && !contents.includes('packages.add(new OnnxruntimePackage());')) {
      contents = contents.replace(
        /List<ReactPackage> packages = new PackageList\(this\)\.getPackages\(\);/m,
        `List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new OnnxruntimePackage());`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  // 3. Configure iOS Podfile
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