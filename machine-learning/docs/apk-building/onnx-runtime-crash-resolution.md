# APK Crash Resolution — `[runtime not ready]: TypeError: Cannot read property 'install' of null`

**Branch:** `apk-runtime-fix`  
**Resolved:** 2026-03-10  
**Status:** Confirmed fixed — APK launches successfully

---

## Summary

The ContraceptIQ Android APK crashed immediately on every cold launch with the following error:

```
[runtime not ready]: TypeError: Cannot read property 'install' of null

stack:
  anonymous@1:3087757
  loadModuleImplementation@1:104172
```

The crash was caused by `onnxruntime-react-native@1.24.1` calling `NativeModules.Onnxruntime.install()` unconditionally during bundle evaluation. In React Native's New Architecture (Bridgeless mode), `NativeModules.Onnxruntime` resolves to `null` because the ONNX module is a legacy bridge module, not a TurboModule. The result was `null.install()` — a fatal JS exception thrown before the JS runtime was fully ready, hence the `[runtime not ready]` prefix.

---

## Timeline of Investigation

### Failed attempts (prior sessions)

Three EAS builds were made before the root cause was identified. All failed for the same reason, because the fixes targeted the wrong layer:

| Build | Fix applied | Why it had no effect |
|---|---|---|
| 1 | Restored `react-native-worklets@0.6.1` | Crash is unrelated to Worklets |
| 2 | Added `wrapWithReanimatedMetroConfig` to Metro config | Metro-only — has zero runtime effect |
| 3 | Changed Babel plugin to `react-native-worklets/plugin`, removed bare `import 'react-native-reanimated'` from `index.ts` | Babel transforms only; unrelated to this crash |

### Root cause identification

Deep investigation traced the crash through:

1. The `[runtime not ready]` prefix — injected by `ReactCommon/jserrorhandler/JsErrorHandler.cpp:329` when any JS exception is thrown during bundle evaluation (before the error handler pipeline is established). This prefix is **not** from Reanimated or Worklets.

2. The actual exception — `TypeError: Cannot read property 'install' of null` — thrown at bundle load time by `node_modules/onnxruntime-react-native/dist/module/binding.js`.

3. The import chain that triggered it on every launch:

```
ObAssessment.tsx              (screen, eagerly loaded by navigator)
GuestAssessment.tsx           (screen, eagerly loaded by navigator)
ConsultationCodeScreen.tsx    (screen, eagerly loaded by navigator)
  └─ discontinuationRiskService.ts  (static import, line 15)
       └─ onDeviceRiskService.ts    (static import, line 18)
            └─ 'onnxruntime-react-native'   ← binding.js executes here
```

4. The exact crash line in `binding.js`:

```js
export const Module = NativeModules.Onnxruntime;  // null in New Architecture
if (typeof globalThis.OrtApi === 'undefined') {
  Module.install();  // null.install() → crash
}
```

5. Why `NativeModules.Onnxruntime` is `null` — `OnnxruntimeModule.java` is implemented as a plain `ReactContextBaseJavaModule` (legacy bridge pattern). In New Architecture Bridgeless mode, `NativeModules` is backed by the TurboModuleManager, which returns `null` for any module that does not implement the `TurboModule` interface. The legacy interop path is not invoked for `NativeModules` property access in Bridgeless mode.

---

## The Fix

Two complementary layers were applied.

### Fix 1 — Patch `onnxruntime-react-native` via `patch-package`

Added a null guard to `binding.js` so `Module.install()` is only called when the native module is actually available.

**Files patched:**
- `node_modules/onnxruntime-react-native/dist/module/binding.js`
- `node_modules/onnxruntime-react-native/dist/commonjs/binding.js`

**Change (identical in both files):**

```diff
- if (typeof globalThis.OrtApi === 'undefined') {
+ if (Module != null && typeof globalThis.OrtApi === 'undefined') {
     Module.install();
  }
```

The patch is stored in `mobile-app/patches/onnxruntime-react-native+1.24.1.patch` and re-applied automatically on every `npm install` via the `postinstall` script, including during EAS's prebuild step.

**Why this is safe:** When `Module` is `null`, execution falls through to the `Proxy` defined below in `binding.js`, which throws a descriptive `'OrtApi is not initialized'` error only if ONNX inference is actually attempted at runtime — not at import time. The app launches; offline inference fails gracefully with a clear message.

### Fix 2 — Guard the import in `onDeviceRiskService.ts`

Changed the static top-level import to a conditional `require()` guarded by a native module availability check. This is a defense-in-depth layer — if the patch were ever not applied (e.g. after an `npm install` before `postinstall` runs), the app would still not crash on launch.

**File:** `mobile-app/src/services/onDeviceRiskService.ts`

```diff
- import { InferenceSession, Tensor } from 'onnxruntime-react-native';
+ import { NativeModules } from 'react-native';
+
+ // Conditionally require onnxruntime-react-native to avoid a null.install() crash
+ // in New Architecture (Bridgeless) mode where NativeModules.Onnxruntime is null
+ // because OnnxruntimeModule is a legacy bridge module, not a TurboModule.
+ const _onnxAvailable = NativeModules.Onnxruntime != null;
+ const { InferenceSession, Tensor } = _onnxAvailable
+   ? (require('onnxruntime-react-native') as typeof import('onnxruntime-react-native'))
+   : ({ InferenceSession: null, Tensor: null } as unknown as typeof import('onnxruntime-react-native'));
```

---

## Files Changed

| File | Change |
|---|---|
| `mobile-app/patches/onnxruntime-react-native+1.24.1.patch` | New — null guard patch for both `dist/module` and `dist/commonjs` binding files |
| `mobile-app/package.json` | Added `"postinstall": "patch-package"` to scripts; `patch-package@8.0.1` already in devDependencies |
| `mobile-app/package-lock.json` | Regenerated |
| `mobile-app/src/services/onDeviceRiskService.ts` | Replaced static ONNX import with conditional `require()` guarded by `NativeModules.Onnxruntime != null` |

**Commit:** `7d6648a` — `fix: patch onnxruntime-react-native binding.js for New Architecture null guard`

---

## How the Patch Stays Applied

`patch-package` works by:

1. Storing the diff in `mobile-app/patches/onnxruntime-react-native+1.24.1.patch` (committed to git)
2. Running `patch-package` on `postinstall` (triggered automatically by `npm install`)
3. Applying the diff to `node_modules/onnxruntime-react-native/dist/*/binding.js` in-place

EAS Build runs `npm install` during its prebuild phase, which triggers `postinstall`, which applies the patch. The patched `node_modules` is then used for the Metro bundle and Gradle build.

---

## Verifying the Patch is Applied

After any `npm install`, confirm the patch was applied:

```bash
# Should show the null guard on the relevant line
grep "Module != null" node_modules/onnxruntime-react-native/dist/module/binding.js
grep "Module != null" node_modules/onnxruntime-react-native/dist/commonjs/binding.js
```

Both should return a match. If they don't, run:

```bash
npx patch-package --patch-dir patches
```

---

## Long-term Note

This patch is a workaround for the fact that `onnxruntime-react-native` has not been migrated to a proper TurboModule. To work correctly in New Architecture without a patch, `OnnxruntimeModule.java` would need to:

1. Implement the `TurboModule` interface
2. Provide a codegen spec (a `.ts` or `.js` native module spec file)
3. Register via `BaseReactPackage` instead of the legacy `ReactPackage`

Track upstream progress at: https://github.com/microsoft/onnxruntime/issues

Until that migration is done upstream, the `patch-package` fix must remain in place. **Do not remove the `postinstall` script or the `patches/` directory.**

---

## Rollback

If needed:

```bash
git revert 7d6648a
cd mobile-app && npm install
eas build --platform android --profile preview
```

---

## Reference

- EAS builds dashboard: https://expo.dev/accounts/ghoniichan/projects/contraceptiq-app/builds
- Successful build (fix confirmed): https://expo.dev/accounts/ghoniichan/projects/contraceptiq-app/builds/86181dbd-d512-4b86-aa59-d6528104ad07
- Pre-implementation plan: `machine-learning/docs/apk-building/onnx-runtime-crash-fix-plan.md`
