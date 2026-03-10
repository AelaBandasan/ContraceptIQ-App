# APK Build Plan — ContraceptIQ Mobile App

## Overview

This document outlines the plan to produce a downloadable Android APK for the
ContraceptIQ mobile app using **EAS Build** (Expo Application Services cloud
build). The resulting APK can be sideloaded onto any Android device without
going through the Google Play Store.

---

## Current State

| Item | Status |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| New Architecture | Enabled (`newArchEnabled: true`) |
| `android/` native project | Present (fully ejected/prebuilt) |
| `eas.json` | Present — `development`, `preview`, `production` profiles |
| EAS Project ID | `159d8d18-ddad-4fe2-9119-21577966ec25` (owner: `michaxcs`) |
| `applicationId` in `build.gradle` | `com.anonymous.thesis_contraceptIQ` ⚠ mismatch |
| `package` in `app.json` | `contraceptiq.app` |
| iOS native project | Not present (`ios/` does not exist) |

---

## Build Target

| Setting | Value |
|---|---|
| Platform | Android |
| EAS profile | `preview` |
| Output format | APK (sideloadable) |
| Distribution | Internal (direct download link) |
| Purpose | Install directly on Android devices without the Play Store |

---

## Required Changes

### 1. Fix `applicationId` mismatch

**File:** `mobile-app/android/app/build.gradle`

The native Gradle project uses the default prebuild placeholder ID. It must be
updated to match the canonical ID declared in `app.json`.

```diff
- applicationId "com.anonymous.thesis_contraceptIQ"
+ applicationId "contraceptiq.app"
```

**Why this matters:** Android treats `applicationId` as the unique identifier
for the app on the device and in any store. Leaving it as
`com.anonymous.thesis_contraceptIQ` would look like an unfinished placeholder
and would conflict with the ID registered in `app.json`.

---

### 2. Force APK output in the `preview` EAS profile

**File:** `mobile-app/eas.json`

EAS Build defaults to outputting an **AAB** (Android App Bundle) which cannot
be sideloaded directly. The `preview` profile needs an explicit `buildType`
override.

```diff
  "preview": {
-   "distribution": "internal"
+   "distribution": "internal",
+   "android": {
+     "buildType": "apk"
+   }
  }
```

**Why this matters:** AAB files require the Google Play Store to repackage them
into APKs. For direct device installation, a plain `.apk` is required.

---

## Build Steps

### Prerequisites

1. **Expo account** — Must be logged in as `michaxcs` (the project owner).
   ```bash
   eas login
   ```

2. **EAS CLI** — Must be installed globally.
   ```bash
   npm install -g eas-cli
   ```

3. **`google-services.json`** — Already present at `mobile-app/google-services.json`.
   Required for Firebase on Android.

---

### Step 1 — Apply the two file changes

- Update `android/app/build.gradle`: change `applicationId`
- Update `eas.json`: add `android.buildType: "apk"` to `preview` profile

---

### Step 2 — Run the EAS cloud build

```bash
cd mobile-app
eas build --platform android --profile preview
```

EAS will:
1. Bundle the JavaScript with Metro
2. Upload the bundle + native project to Expo's build servers
3. Compile the native Android project with Gradle (Hermes engine)
4. Sign the APK with a managed keystore
5. Return a direct download URL for the `.apk`

Estimated build time: **5–15 minutes**

---

### Step 3 — Download and install the APK

Once the build completes, EAS provides a download URL in the terminal output
and at `https://expo.dev/accounts/michaxcs/projects/thesis_contraceptIQ/builds`.

**To install on an Android device:**

1. Enable "Install from unknown sources" (or "Install unknown apps") in Android
   Settings → Security (exact path varies by Android version).
2. Transfer the `.apk` to the device (direct download link, ADB, or file share).
3. Open the `.apk` file on the device to install.

**To install via ADB (USB cable):**
```bash
adb install path/to/contraceptiq-preview.apk
```

**To install via EAS CLI directly to a connected device:**
```bash
eas build:run --platform android
```

---

## Post-Build Verification Checklist

- [ ] App installs without errors on Android device
- [ ] Splash screen appears correctly
- [ ] Firebase initializes (no crash on startup)
- [ ] API calls reach the backend (set `EXPO_PUBLIC_API_URL` correctly before building if needed)
- [ ] ONNX on-device inference works offline
- [ ] Navigation (drawer, stack, tabs) functions correctly

---

## Notes

### Signing
- For `preview` builds, EAS manages the signing keystore automatically (stored
  securely on Expo's servers).
- For `production` builds (Google Play), use `eas credentials` to manage a
  dedicated release keystore.

### API URL
- The `EXPO_PUBLIC_API_URL` environment variable is baked into the bundle at
  build time. To point the APK at a specific backend, set it before building:
  ```bash
  EXPO_PUBLIC_API_URL=https://your-api.com eas build --platform android --profile preview
  ```
- Or add it to `eas.json` under the `preview` profile's `env` field:
  ```json
  "preview": {
    "distribution": "internal",
    "android": { "buildType": "apk" },
    "env": {
      "EXPO_PUBLIC_API_URL": "https://your-api.com"
    }
  }
  ```

### Future: Production Play Store Build
When ready to publish to Google Play, use the `production` profile which
outputs an AAB with `autoIncrement` enabled:
```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## File Change Summary

| File | Change |
|---|---|
| `mobile-app/android/app/build.gradle` | `applicationId` → `contraceptiq.app` |
| `mobile-app/eas.json` | Add `android.buildType: "apk"` to `preview` profile |
