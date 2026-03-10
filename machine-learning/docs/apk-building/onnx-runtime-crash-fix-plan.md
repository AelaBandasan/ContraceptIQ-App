# ONNX Runtime Crash Fix Plan — `[runtime not ready]: TypeError: Cannot read property 'install' of null`

**Branch:** `apk-runtime-fix`  
**Date:** 2026-03-10  
**Status:** Ready to implement — awaiting go-ahead

---

## Problem Statement

Every APK built so far (all three EAS builds on branch `apk-runtime-fix`) crashes immediately
on launch with:

```
[runtime not ready]: TypeError: Cannot read property 'install' of null

stack:
  anonymous@1:3087757
  loadModuleImplementation@1:104172
  ...
```

Three previous fix attempts (Worklets version, Metro config, Babel plugin) had no effect because
they were addressing the wrong layer.

---

## Root Cause (Confirmed)

### The crash source

**File:** `node_modules/onnxruntime-react-native/dist/module/binding.js`

```js
// Line 7–10 in dist/module/binding.js
export const Module = NativeModules.Onnxruntime;   // resolves to null in New Arch

if (typeof globalThis.OrtApi === 'undefined') {
  Module.install();   // <-- null.install() → crash
}
```

### Why `NativeModules.Onnxruntime` is `null`

`onnxruntime-react-native@1.24.1` implements its Android module (`OnnxruntimeModule.java`) as a
plain `ReactContextBaseJavaModule` — **not a TurboModule**. It uses the old bridge pattern with
`ReactPackage`, not the New Architecture `BaseReactPackage` + codegen path.

In React Native's New Architecture (Bridgeless mode), `NativeModules` is backed by
`global.nativeModuleProxy` (the TurboModuleManager). When `NativeModules.X` is accessed and the
TurboModuleManager's `getModule("Onnxruntime")` is called, it returns `null` for any module that
doesn't implement `TurboModule`. The legacy interop layer (`getLegacyModule()`) is never called
for `NativeModules` property access in Bridgeless mode.

**Result:** `NativeModules.Onnxruntime === null` → `null.install()` → crash.

### Why `[runtime not ready]` appears in the message

This prefix is injected by React Native's C++ error handler
(`ReactCommon/jserrorhandler/JsErrorHandler.cpp`, line 329):

```cpp
.message = _isRuntimeReady ? message : ("[runtime not ready]: " + message),
```

`_isRuntimeReady` is `false` during bundle evaluation (before the JS error handler pipeline is
established). The ONNX crash happens at module import time — bundle evaluation — so the raw
`TypeError` gets this prefix.

### The import chain that triggers it

```
ObAssessment.tsx              (screen, eagerly imported by navigator)
GuestAssessment.tsx           (screen, eagerly imported by navigator)
ConsultationCodeScreen.tsx    (screen, eagerly imported by navigator)
  └─ discontinuationRiskService.ts  (line 15: static import)
       └─ onDeviceRiskService.ts    (line 18: static import)
            └─ 'onnxruntime-react-native'   ← triggers binding.js at module load time
```

All three screens are eagerly registered in the navigation stack, so `onnxruntime-react-native`
is imported unconditionally during bundle evaluation on every cold start.

### Why previous fixes had no effect

| Fix applied | Why it couldn't help |
|---|---|
| Restored `react-native-worklets@0.6.1` | Crash is not in Worklets |
| Wrapped metro config with `wrapWithReanimatedMetroConfig` | Only affects Metro stack-frame symbolicator — has zero runtime effect |
| Changed Babel plugin to `react-native-worklets/plugin` | Plugin only transforms worklet function syntax — not involved in this crash |
| Removed bare `import 'react-native-reanimated'` from `index.ts` | Unrelated to this crash |

---

## The Fix

Two complementary layers:

### Fix 1 — Patch `onnxruntime-react-native` with `patch-package`

Add a null guard in the compiled `binding.js` output so that `Module.install()` is only called
when the native module is actually available. This is the correct fix at the source.

**Files to patch:**
- `node_modules/onnxruntime-react-native/dist/module/binding.js`
- `node_modules/onnxruntime-react-native/dist/commonjs/binding.js`

**Change (same in both files):**

```diff
- if (typeof globalThis.OrtApi === 'undefined') {
-   Module.install();
- }
+ if (Module != null && typeof globalThis.OrtApi === 'undefined') {
+   Module.install();
+ }
```

**Why this is safe:** When `Module` is `null`, `OrtApi` falls through to the `Proxy` below it
(lines 11–15 of `binding.js`), which throws a descriptive
`'OrtApi is not initialized'` error only if inference is actually attempted at runtime — not at
import time. The app launches successfully; ONNX inference fails gracefully with a clear message
instead of crashing the entire app on startup.

The patch is generated with `patch-package` and committed to `patches/` so it re-applies
automatically on every `npm install` (including EAS's npm install step during prebuild).

### Fix 2 — Guard the import in `onDeviceRiskService.ts`

Change the static top-level import to a lazy/conditional pattern so that even if the patch were
somehow not applied, the ONNX module load failure does not propagate to a startup crash.

**File:** `mobile-app/src/services/onDeviceRiskService.ts`

```diff
- import { InferenceSession, Tensor } from 'onnxruntime-react-native';
+ // Dynamic import — onnxruntime-react-native is not a TurboModule and
+ // NativeModules.Onnxruntime is null in New Architecture.
+ // The patch-package fix in patches/ guards binding.js, but we also
+ // guard here for defense-in-depth.
+ import { NativeModules } from 'react-native';
+ const _onnxAvailable = NativeModules.Onnxruntime != null;
+ const { InferenceSession, Tensor } = _onnxAvailable
+   ? require('onnxruntime-react-native')
+   : { InferenceSession: null, Tensor: null };
```

Any code path that tries to use `InferenceSession` or `Tensor` when they are `null` will fail
with a clear `null` reference rather than a startup crash.

---

## Implementation Steps

### Step 1 — Install `patch-package`

```bash
cd mobile-app
npm install --save-dev patch-package
```

**Why `--save-dev`:** `patch-package` is only needed at install/build time, not at runtime.
EAS runs `npm install` during the build which triggers the `postinstall` script (Step 3), so
it must be available as a dev dependency.

---

### Step 2 — Patch the compiled `binding.js` files

Edit both compiled binding files directly in `node_modules`:

**`node_modules/onnxruntime-react-native/dist/module/binding.js`** — change line 8:
```diff
- if (typeof globalThis.OrtApi === 'undefined') {
+ if (Module != null && typeof globalThis.OrtApi === 'undefined') {
```

**`node_modules/onnxruntime-react-native/dist/commonjs/binding.js`** — same change.

Then generate the patch file:
```bash
cd mobile-app
npx patch-package onnxruntime-react-native
```

This creates `mobile-app/patches/onnxruntime-react-native+1.24.1.patch`.

---

### Step 3 — Add `postinstall` to `package.json`

```diff
// mobile-app/package.json
  "scripts": {
+   "postinstall": "patch-package",
    "start": "expo start",
    ...
  }
```

EAS Build runs `npm install` during prebuild, which automatically triggers `postinstall`, which
applies the patch to the freshly installed `node_modules`.

---

### Step 4 — Guard the import in `onDeviceRiskService.ts`

Update the import at line 18 of `src/services/onDeviceRiskService.ts` to be conditional on
native module availability.

---

### Step 5 — Regenerate `package-lock.json`

```bash
cd mobile-app
npm install
```

Ensures `patch-package` is locked in the lock file and EAS resolves the same version.

---

### Step 6 — Commit

Commit with message:
```
fix: patch onnxruntime-react-native binding.js for New Architecture null guard
```

Files to commit:
- `mobile-app/package.json` — `postinstall` script + `patch-package` dev dep
- `mobile-app/package-lock.json` — regenerated
- `mobile-app/patches/onnxruntime-react-native+1.24.1.patch` — the patch file
- `mobile-app/src/services/onDeviceRiskService.ts` — guarded import

---

### Step 7 — Trigger EAS Build

```bash
cd mobile-app
eas build --platform android --profile preview
```

---

## Expected Outcome

The app launches without crashing. ONNX on-device inference is silently unavailable
(`NativeModules.Onnxruntime` is `null`), so any assessment that hits the offline path will
fail gracefully with an error rather than crashing at startup.

> **Note on long-term ONNX fix:** `onnxruntime-react-native` needs to be migrated to a proper
> TurboModule (with a codegen spec and `TurboModule` interface implementation) to work in New
> Architecture without this patch. As of v1.24.1, this migration has not been done upstream.
> Track: https://github.com/microsoft/onnxruntime/issues

---

## Files Changed Summary

| File | Change |
|---|---|
| `mobile-app/package.json` | Add `patch-package` to devDependencies; add `postinstall` script |
| `mobile-app/package-lock.json` | Regenerated |
| `mobile-app/patches/onnxruntime-react-native+1.24.1.patch` | New file — null guard patch |
| `mobile-app/src/services/onDeviceRiskService.ts` | Guard ONNX import with availability check |

---

## Rollback

To revert if the fix causes unexpected issues:

```bash
git revert HEAD
cd mobile-app && npm install
eas build --platform android --profile preview
```

---

## Context: Previous Fixes (Now Known Irrelevant to This Crash)

These changes from the previous session are on the branch and remain committed. They are
harmless but did not address the actual crash:

| Commit | Change | Actual effect |
|---|---|---|
| `f2cec1d` | `react-native-worklets@0.6.1`, `wrapWithReanimatedMetroConfig`, removed duplicate gesture import | No effect on ONNX crash |
| `7ac94f0` | Babel plugin → `react-native-worklets/plugin`, removed bare `import 'react-native-reanimated'` | No effect on ONNX crash |

These are all correct changes for Reanimated 4 migration hygiene and should stay.

---

## Reference: EAS Dashboard

https://expo.dev/accounts/ghoniichan/projects/contraceptiq-app/builds
