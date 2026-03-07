# How to Run with Native Modules (ONNX Runtime)

The `onnxruntime-react-native` library contains **native C++ code** that is not included in the standard "Expo Go" app from the App Store.

To use this library, you must switch from "Expo Go" to a **Development Build**.

## 1. Prerequisites (One-time)

### For Android (Windows/Mac/Linux)
1.  **Install Android Studio**: Ensure you have the Android SDK and Command Line Tools installed.
2.  **Enable USB Debugging**: On your physical Android phone, go to **Settings > Developer Options** and enable **USB Debugging**.
3.  **Connect via USB**: Connect your phone to your computer.
4.  **Verify Connection**: Run `adb devices` in your terminal. You should see your device ID.

### For iOS (Mac Only)
*   If you are on Windows, you **cannot** run iOS builds locally. You must use **EAS Build** (cloud build).
    *   Run `npm install -g eas-cli`
    *   Run `eas build --profile development --platform ios`
    *   Install the resulting build on your device.

## 2. Generate the Native Build

Run the following command in your terminal (`mobile-app` folder):

```bash
# For Android (Recommended for Windows users)
npx expo run:android --device
```

This command will:
1.  Generate the native Android project (`/android` folder).
2.  Compile the App with the ONNX Runtime library linked.
3.  Install a **new app** on your phone (it might be called "Showcase" or your app name, distinct from Expo Go).
4.  Start the development server.

## 3. Usage

Once the app is installed on your phone:
1.  The terminal will show a QR code or waiting for connection.
2.  The app should open automatically on your phone.
3.  It looks just like Expo Go but is custom-built with your native libraries.
4.  You can shake the device or use the notification menu to reload JS, just like Expo Go.

### Troubleshooting
*   **"SDK location not found"**: Set `ANDROID_HOME` environment variable to your Android SDK path (usually `C:\Users\YourUser\AppData\Local\Android\Sdk`).
*   **Build Failures**: Try running `npx expo prebuild --clean` to reset the native folders, then run `npx expo run:android --device` again.
