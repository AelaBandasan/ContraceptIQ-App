# 🚀 How to Run ContraceptIQ

> Quick reference guide to get the full app running locally.

---

## Prerequisites

| Tool           | Version  | Check with            |
| -------------- | -------- | --------------------- |
| Node.js        | 22.12.0  | `node -v`             |
| Python         | 3.10+    | `python --version`    |
| Android SDK    | (latest) | Android Studio → SDK Manager |
| Java (JDK)     | 17       | `java -version`       |

---

## 1. First-Time Setup (only once)

### Install Node dependencies

```bash
cd mobile-app
npm install
```

### Install Python dependencies

```bash
cd mobile-app/backend
pip install -r requirements.txt
```

### Create an Android Emulator (AVD)

Open **Android Studio → Tools → Device Manager → Create Virtual Device**, pick a phone (e.g. Pixel 7), download a system image (API 34+), and finish.

To verify your AVD exists:

```bash
~/Library/Android/sdk/emulator/emulator -list-avds
```

Current AVD: `Medium_Phone_API_36.1`

---

## 2. Running the App

You need **3 terminals**. All commands run from the `mobile-app/` directory.

### Terminal 1 — Start the Android Emulator

```bash
~/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &
```

> Wait for the emulator to fully boot (home screen visible) before running the next step.

### Terminal 2 — Start the Backend

```bash
python backend/app.py
```

Backend runs on `http://localhost:5000`.

### Terminal 3 — Build & Run the Mobile App

```bash
npm run android:emulator
```

This builds the app and installs it on the emulator with the API URL set to `http://10.0.2.2:5000` (emulator's alias for host `localhost`).

---

## 3. Running on a Physical Device (USB)

1. Enable **USB Debugging** on your Android phone (Settings → Developer Options).
2. Connect your phone via USB and confirm the debugging prompt.
3. Start the backend with your **LAN IP** in `.env`:
   ```
   EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5000
   ```
   Find your LAN IP with: `ipconfig getifaddr en0`
4. Run:
   ```bash
   # Terminal 1: Backend
   python backend/app.py

   # Terminal 2: Build & install on device
   npm run android
   ```

---

## Quick Command Reference

| What                        | Command                          |
| --------------------------- | -------------------------------- |
| Start emulator (no Android Studio) | `~/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &` |
| Start backend               | `python backend/app.py`          |
| Run app on emulator          | `npm run android:emulator`       |
| Run app on physical device   | `npm run android`                |
| Start JS bundler only (faster reload) | `npm run start:emulator`         |
| List available emulators     | `~/Library/Android/sdk/emulator/emulator -list-avds` |
| Check connected devices      | `adb devices`                    |
| Clean Android build          | `cd android && ./gradlew clean && cd ..` |

---

## Environment Files

| File              | Purpose                              | API URL                          |
| ----------------- | ------------------------------------ | -------------------------------- |
| `.env`            | Physical device (default)            | `http://192.168.100.81:5000`     |
| `.env.emulator`   | Android emulator                     | `http://10.0.2.2:5000`          |
| `.env.production` | Production deployment                | `https://api.contraceptiq.com`   |

---

## Troubleshooting

| Problem                         | Fix                                                    |
| ------------------------------- | ------------------------------------------------------ |
| Emulator not detected           | Run `adb devices` — should show `emulator-5554`        |
| App can't reach backend         | Make sure backend is running and using correct API URL  |
| Build fails                     | Run `cd android && ./gradlew clean && cd ..` then retry |
| Metro bundler port in use       | Kill process on port 8081: `lsof -ti:8081 \| xargs kill` |
| `nvm` wrong Node version        | Run `nvm use` (reads `.nvmrc` → 22.12.0)               |
