# EAS Build Session Log — ContraceptIQ APK

**Branch:** `apk-testt`
**Date:** March 10, 2026
**Goal:** Produce a sideloadable `.apk` via EAS Build (`preview` profile)

---

## Session Summary

This session diagnosed and fixed a series of cascading build and runtime errors
encountered while trying to produce an Android APK using EAS Build. The build
ultimately succeeded, but the installed APK crashed on launch due to a runtime
JavaScript error. That crash is identified and the fix is documented below.

---

## Part 1 — EAS Build Failures (Fixed)

### Error 1 — AGP Version Mismatch (`No variants exist`)

**Symptom:**
```
Could not resolve project :react-native-gesture-handler.
  No matching variant of project :react-native-gesture-handler was found.
  attribute 'com.android.build.api.attributes.AgpVersionAttr' with value '8.11.0'
  - No variants exist.
```
This error repeated for every native module (`react-native-reanimated`,
`react-native-svg`, `react-native-screens`, `react-native-async-storage`, etc.).

**Root cause:**
The committed `android/build.gradle` pinned AGP to `8.7.3`:
```groovy
classpath('com.android.tools.build:gradle:8.7.3')
```
The EAS cloud build server runs AGP `8.11.0`. When the two versions differ,
native module subprojects expose no matching variant and Gradle cannot resolve
the dependency graph.

**Fix:**
Switched the project to CNG (Continuous Native Generation / Prebuild). Instead
of committing the `android/` folder, EAS now runs `expo prebuild --platform
android` during the build, generating a fresh `android/` folder with the AGP
version native to its own environment. The committed `android/` folder was
removed from git tracking entirely.

---

### Error 2 — `expo doctor` Package Version Mismatches

**Symptom:**
```
⚠️ Minor version mismatches
@react-native-community/datetimepicker  expected 8.4.4     found 8.6.0
@react-native-community/netinfo         expected 11.4.1    found 11.5.2
react-native-reanimated                 expected ~4.1.1    found 4.2.2
react-native-svg                        expected 15.12.1   found 15.15.3
react-native-worklets                   expected 0.5.1     found 0.6.1
```

**Root cause:**
`package.json` used `^` (caret) version ranges, which allowed npm to resolve
newer versions than Expo SDK 54 is tested against.

**Fix:**
Pinned affected packages to Expo SDK 54 expected versions (removed caret
ranges). Added `expo-font ~14.0.0` as an explicit dependency to satisfy the
`@expo/vector-icons` peer dependency requirement.

| Package | Before | After |
|---|---|---|
| `@react-native-community/datetimepicker` | `^8.6.0` | `8.4.4` |
| `@react-native-community/netinfo` | `^11.5.1` | `11.4.1` |
| `@react-native-community/slider` | `^5.0.1` | `5.0.1` |
| `@react-native-picker/picker` | `^2.11.1` | `2.11.1` |
| `react-native-reanimated` | `^4.1.3` | `~4.1.1` |
| `react-native-svg` | `^15.15.2` | `15.12.1` |
| `react-native-worklets` | `0.6.1` | `0.5.1` ⚠️ see Part 2 |
| `expo-font` | (missing) | `~14.0.0` |

---

### Error 3 — No Lock File Detected

**Symptom:**
```
expo doctor: No lock file detected.
```

**Root cause:**
`.gitignore` explicitly excluded `mobile-app/package-lock.json` (the entry was
duplicated on two lines). EAS Build uses the lock file to reproduce exact
dependency versions on its cloud servers. Without it, npm resolves potentially
different versions on each build.

**Fix:**
Removed both `mobile-app/package-lock.json` lines from `.gitignore`. Ran
`npm install` inside `mobile-app/` to regenerate the lock file with the
corrected pinned versions and committed it.

---

### Error 4 — CNG Warning (Native Folders + app.json Config)

**Symptom:**
```
expo doctor: This project contains native project folders but also has native
configuration properties in app.json. EAS Build will not sync: orientation,
icon, userInterfaceStyle, splash, ios, android, plugins.
```

**Root cause:**
The `android/` folder was committed to the repo (bare/ejected mode), but
`app.json` still contained Prebuild-managed properties (`orientation`, `icon`,
`splash`, `plugins`, etc.). EAS Build cannot reconcile both: it either uses
the committed native folder as-is OR it runs Prebuild to regenerate it, not
both simultaneously.

**Fix:**
Chose the CNG/Prebuild path:
- Added `mobile-app/android/` and `mobile-app/ios/` to `.gitignore`
- Removed `android/` from git tracking with `git rm -r --cached mobile-app/android/`
- `app.json` Prebuild config remains intact — EAS reads it and generates the
  native folder fresh on each build

---

### CNG Migration — Custom Native Code Handling

Before removing `android/`, the folder was inspected for manual customizations
that Prebuild cannot regenerate automatically.

**Windows-specific workarounds — NOT carried over to EAS (irrelevant on Linux):**
- `buildStagingDirectory "C:/tmp/ciq-cxx"` — workaround for Windows MAX_PATH
  (260 char) limit during NDK compilation
- `afterEvaluate` block with `cppFlags "-fno-threadsafe-statics"` and
  `"-DANDROID_STL=c++_shared"` — workaround for NDK 27 `__cxa_guard_release`
  bug on Windows
- CMake flags `-DCMAKE_CXX_FLAGS_RELWITHDEBINFO=-O2 -DNDEBUG` — workaround for
  OOM (`0x5AA`) on memory-constrained Windows machines during `clang++` compile

**Platform-agnostic customizations — encoded into the config plugin:**
- `abiFilters "arm64-v8a"` — restricts APK to arm64 only (~95% of modern
  Android devices), reduces APK size significantly
- `buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", '"stable"'` —
  required by `MainApplication.kt` to set
  `DefaultNewArchitectureEntryPoint.releaseLevel` for the New Architecture

Both were injected into `mobile-app/plugins/with-onnxruntime-react-native.js`
using `mergeContents` targeting the `defaultConfig { }` block in `app/build.gradle`.

---

### Commit — Build Fixes

```
acadc84 fix: switch to CNG/Prebuild for EAS build and fix SDK 54 dependency versions
```

Files changed:
- `.gitignore` — removed lock file exclusion, added android/ and ios/
- `mobile-app/package.json` — pinned dependency versions, added expo-font
- `mobile-app/package-lock.json` — regenerated with corrected versions
- `mobile-app/plugins/with-onnxruntime-react-native.js` — extended with
  abiFilters and REACT_NATIVE_RELEASE_LEVEL injections
- `mobile-app/android/**` — entire folder removed from git tracking (105 files)

---

## Part 2 — Runtime Crash After Successful Build

**Status: Fix identified, NOT yet applied**

The EAS build succeeded and the APK installed successfully on a Redmi device
(MIUI/HyperOS, Android 16). The app crashed immediately on launch.

### Crash Report

**Device:**
```
Redmi/malachite_global/malachite:16/BP2A.250605.031.A3/OS3.0.6.0.WOOMIXM:user/release-keys
```

**Error:**
```
Abort message: 'terminating due to uncaught exception of type
facebook::jni::JniException: com.facebook.react.common.JavascriptException:
[runtime not ready]: TypeError: Cannot read property 'install' of null

stack:
anonymous@1:3087757
loadModuleImplementation@1:104172
...
```

### What This Error Means

`Cannot read property 'install' of null` means `__reanimatedModuleProxy` (the
C++ JSI object that Reanimated registers with the JS runtime) was `null` when
the JS bundle tried to call `.install()` on it at bundle load time.

This is a JSI (JavaScript Interface) binding failure — the native C++ side of
Reanimated did not successfully expose its interface to the JS engine before
the JS bundle started executing.

This is **not** a Gradle/compile error. EAS Build cannot catch this — it only
verifies the native layer compiles. The JS runtime crash is only detectable
by running the app.

---

### Root Cause 1 — `react-native-worklets` version mismatch (introduced by this session's fix)

`react-native-reanimated` v4.x and `react-native-worklets` are a **matched
pair** — Reanimated 4.1.x internally depends on worklets `0.6.x` to provide
its JSI infrastructure. They must be the same minor series.

When `expo doctor` reported that worklets `0.6.1` was out of spec and the fix
in this session downgraded it to `0.5.1`, this broke the internal JSI contract
between the two packages:

- Reanimated 4.1.x tries to call worklets `0.6.x` JSI APIs
- Worklets `0.5.1` exposes a different/older JSI interface
- `__reanimatedModuleProxy` is null → crash

`expo doctor`'s "expected" versions for these two packages are inconsistent
with each other for Expo SDK 54. The `0.5.1` expectation for worklets is
incorrect when paired with `~4.1.1` Reanimated.

**Required fix:**
```diff
// mobile-app/package.json
- "react-native-worklets": "0.5.1"
+ "react-native-worklets": "0.6.1"
```

---

### Root Cause 2 — SVG transformer replaces Reanimated's Metro transformer

`mobile-app/metro.config.js` sets a custom `babelTransformerPath`:
```js
config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
```

This **completely replaces** the Metro transformer chain. Under New Architecture
(`newArchEnabled: true`), Reanimated requires its own Metro transformer to
correctly process `worklet` functions and `useAnimatedStyle`/`useAnimatedScrollHandler`
hooks into native-callable worklet closures. When this step is skipped, the
worklet infrastructure fails to initialize and `__reanimatedModuleProxy` is null.

**Required fix:**
Wrap the entire metro config export with `wrapWithReanimatedMetroConfig()`, which
is exported by `react-native-reanimated/metro-config` and ensures the Reanimated
transformer layer is applied on top of whatever custom transformer is configured:

```js
// mobile-app/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

module.exports = wrapWithReanimatedMetroConfig((() => {
    const config = getDefaultConfig(__dirname);
    const { transformer, resolver } = config;

    config.transformer = {
        ...transformer,
        babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
    };
    config.resolver = {
        ...resolver,
        assetExts: [...resolver.assetExts.filter((ext) => ext !== "svg"), "onnx"],
        sourceExts: [...resolver.sourceExts, "svg"],
    };

    return config;
})());
```

---

### Additional Finding — Duplicate bare import of `react-native-gesture-handler`

`react-native-gesture-handler` is bare-imported in both `index.ts` (correct,
required) and `App.tsx` line 1 (redundant). This does not cause a crash but
should be cleaned up:

```diff
// App.tsx — remove this line, it is already in index.ts
- import 'react-native-gesture-handler';
```

---

### Pending Actions

| # | Action | File | Status |
|---|---|---|---|
| 1 | Restore `react-native-worklets` to `0.6.1` | `package.json` | **Pending** |
| 2 | Wrap metro config with `wrapWithReanimatedMetroConfig` | `metro.config.js` | **Pending** |
| 3 | Remove duplicate gesture-handler import | `App.tsx` | **Pending** |
| 4 | Regenerate `package-lock.json` | — | **Pending** |
| 5 | Rebuild with EAS (`eas build --platform android --profile preview`) | — | **Pending** |

---

## Reference: EAS Build Commands

```bash
cd mobile-app

# Trigger a new preview APK build
eas build --platform android --profile preview

# Check build status
eas build:list --platform android

# Install latest build to a connected device via ADB
eas build:run --platform android
```

**EAS project dashboard:**
https://expo.dev/accounts/ghoniichan/projects/contraceptiq-app/builds

---

## Reference: File Locations

| File | Purpose |
|---|---|
| `mobile-app/package.json` | Dependency versions |
| `mobile-app/metro.config.js` | Metro bundler config (transformer chain) |
| `mobile-app/babel.config.js` | Babel config (`reanimated/plugin` must be last) |
| `mobile-app/app.json` | Expo/EAS config (Prebuild source of truth) |
| `mobile-app/eas.json` | EAS build profiles |
| `mobile-app/plugins/with-onnxruntime-react-native.js` | Custom config plugin |
| `mobile-app/index.ts` | App entry point (JSI bare imports go here) |
