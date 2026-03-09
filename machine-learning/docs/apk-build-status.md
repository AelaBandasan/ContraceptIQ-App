# Android APK Build Status

**Branch:** `apk-testt`  
**Last updated:** 2026-03-09  
**Goal:** Produce a sideloadable `app-release.apk` for arm64-v8a Android devices without Google Play Store.

---

## Current Status: Blocked — Local Build OOM

Local `assembleRelease` builds consistently fail with Windows error `0x5AA` (Insufficient system resources / page file too small) during NDK C++ compilation. **All package-level bugs have been fixed.** The blocker is a hardware/OS memory constraint specific to this Windows machine.

**Recommended next step:** Use EAS cloud build (`eas build --platform android --profile preview`).

---

## What Has Been Done

### Package / Build Config Fixes (committed, ready for EAS)

| Fix | File | Detail |
|-----|------|--------|
| Pinned AGP to `8.7.3` | `android/build.gradle` | Was unpinned; resolved to `8.11.0` which broke community library variant resolution |
| Downgraded `react-native-worklets` to `0.6.1` | `package.json`, `package-lock.json` | Was `0.5.1` (then briefly `0.7.0`); `react-native-reanimated@4.1.3` requires `>=0.5.x <=0.6.x` per its `compatibility.json` |
| Increased Gradle JVM heap | `android/gradle.properties` | `Xmx1536m → Xmx4096m`, `MaxMetaspaceSize 256m → 512m` |
| Set `workers.max=1`, `ndk.maxWorkers=1` | `android/gradle.properties` | Reduces concurrent clang++ subprocesses |
| Redirected CMake build staging dir | `android/app/build.gradle` | `buildStagingDirectory "C:/tmp/ciq-cxx"` — avoids Windows MAX_PATH (260 chars) limit in NDK object file paths |
| Stripped `-g` from `RelWithDebInfo` | `android/app/build.gradle` | `CMAKE_CXX_FLAGS_RELWITHDEBINFO=-O2 -DNDEBUG` — reduces per-process memory for clang++ |
| Locked `abiFilters` to `arm64-v8a` | `android/app/build.gradle` | Build one architecture only |
| JS bundle pre-generated | `android/app/src/main/assets/` | `expo export:embed` completed successfully (3,239 modules). Not committed (gitignored; EAS regenerates it). |

### Root Cause of Local Build Failure

React Native New Architecture (`newArchEnabled=true`) requires compiling C++ code with the Android NDK clang++ cross-compiler. On this Windows machine:

- Each `clang++.exe` process reserves **~500 MB–1 GB** of virtual address space for large Folly/React Native header sets
- Ninja spawns multiple compilation jobs in parallel even with `workers.max=1` (Gradle worker count does not limit ninja subprocesses)
- Setting `CMAKE_BUILD_PARALLEL_LEVEL=1` is ignored by ninja (it only applies to `cmake --build`, not the ninja process AGP invokes directly)
- `android.ndk.maxWorkers=1` reduced Gradle-level task concurrency but did not prevent ninja from spawning parallel clang++ jobs
- The Windows page file is exhausted when ≥2–3 clang++ processes run simultaneously

**Error seen:** `clang++: error: unable to execute command: Couldn't execute program '...clang++.exe': The paging file is too small for this operation to complete. (0x5AF)`

---

## How to Continue

### Option A: EAS Cloud Build (Recommended)

All package fixes are committed. EAS Linux build machines have adequate memory and no Windows path constraints.

```bash
cd mobile-app

# Ensure you are logged in
npx eas-cli whoami   # or: npx eas-cli login

# Trigger the preview (APK) build
npx eas-cli build --platform android --profile preview

# Download the APK from the URL printed at the end, or from expo.dev
```

The `eas.json` `preview` profile is already configured with `buildType: "apk"`.

---

### Option B: Local Build After Increasing Windows Page File

If you want to build locally in future:

1. Open **Control Panel → System → Advanced System Settings → Performance → Settings → Advanced → Virtual Memory → Change**
2. Uncheck "Automatically manage paging file size for all drives"
3. Set a **custom size**: Initial = 8192 MB, Maximum = 16384 MB (or larger)
4. Reboot
5. Run:
   ```bash
   cd mobile-app/android
   ./gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
   ```
6. APK output: `mobile-app/android/app/build/outputs/apk/release/app-release.apk`

The `local.properties` file (containing `sdk.dir`) is gitignored and machine-specific. On any new machine, create it:
```
sdk.dir=C\:\\Users\\<YourUser>\\AppData\\Local\\Android\\Sdk
```

---

### Option C: Disable New Architecture (Fastest Local Fix)

In `mobile-app/android/gradle.properties`, change:
```
newArchEnabled=true
```
to:
```
newArchEnabled=false
```

This eliminates the entire NDK C++ compilation step. The app will still work; it loses TurboModules / Fabric renderer (New Arch features). Re-run `assembleRelease` after this change.

**Caveat:** Some libraries (`react-native-reanimated`, `react-native-worklets`) may have reduced functionality or require additional config changes in Old Arch mode.

---

## File Reference

| File | Purpose |
|------|---------|
| `mobile-app/android/build.gradle` | Root Gradle — AGP version pinned here |
| `mobile-app/android/app/build.gradle` | App Gradle — CMake staging dir, flags, abiFilters |
| `mobile-app/android/gradle.properties` | JVM heap, worker limits |
| `mobile-app/package.json` | `react-native-worklets` version |
| `mobile-app/eas.json` | EAS build profiles (`preview` → APK) |
| `machine-learning/docs/apk-build-plan.md` | Original build plan document |
