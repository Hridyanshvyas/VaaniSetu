# `frontend/` — VaaniSetu Mobile Application

The mobile client for VaaniSetu is built with **React Native** (TypeScript) and optimized for Android devices. It provides a tactile Push-to-Talk (PTT) interface, live AI pipeline visualization, and real-time bandwidth consumption metrics proving 95%+ data reduction.

---

## 📱 Features

- **Push-to-Talk (PTT) Voice Interface**: Low-latency 16 kHz audio capture and streaming upon release.
- **Live Bitrate & Bandwidth Savings Counter**: Displays actual bits transmitted per exchange versus conventional cellular/VoIP codecs.
- **Multilingual Support**: Supports Indian native languages (**Hindi**, **Tamil**, **Telugu**) and **English** with real-time translation.
- **Dual Operating Modes**:
  - **Solo Loopback Demo**: Test the complete pipeline on a single phone without requiring a second participant.
  - **Two-Device Call Mode**: Pair two devices into a shared room for duplex voice conversations.
- **Dynamic Network Selector**: One-tap switching between Hotspot (`192.168.137.1`), Wi-Fi LAN, Android Emulator (`10.0.2.2`), and Cloud.
- **Live Pipeline Visualizer**: Animated stage indicators (Listening → Transcribing → Channel Transmitting → Translating → Synthesizing → Playing).

---

## 📂 Directory Structure

```
frontend/
├── src/
│   ├── audio/                # Audio capture (recorder.ts) & playback (player.ts)
│   ├── network/              # WebSocket client (websocketClient.ts) & REST session API
│   ├── screens/              # OnboardingScreen.tsx and CallScreen.tsx
│   ├── components/           # Modular UI components
│   │   ├── call/             # In-call controls (PTT, Visualizer, Metrics, Transcript)
│   │   ├── Header.tsx        # Top status and navigation bar
│   │   ├── CallSetupCard.tsx # Room and user setup card
│   │   └── Toast.tsx         # Notification alerts
│   ├── theme/                # Typography, colors, and design tokens
│   └── config.ts             # Host resolution, server presets & language constants
├── android/                  # Native Android project files, Gradle build, and manifests
├── index.js                  # React Native entrypoint
├── package.json              # Project dependencies and build scripts
└── App.tsx                   # Top-level screen router and context provider
```

---

## 🚀 Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **JDK**: Eclipse Adoptium OpenJDK 17
- **Android Studio & SDK**: Android SDK Build-Tools 34+ / 35+
- **Physical Device or Android Emulator**

### Installation

```bash
cd frontend
npm install
```

### Running in Development

```bash
# Start the Metro bundler:
npm start

# Run on connected Android device/emulator:
npm run android
```

---

## 📡 Connecting to the Backend

The app requires connection to the VaaniSetu backend orchestrator (`backend/main.py:8000`).

| Preset | Target Address | Usage Scenario |
|---|---|---|
| **Hotspot** *(Recommended)* | `192.168.137.1:8000` | Host laptop creates a Windows Mobile Hotspot; phones connect directly. |
| **Wi-Fi LAN** | `<Laptop_IP>:8000` | Laptop and phones on the same home/office Wi-Fi router. |
| **Emulator** | `10.0.2.2:8000` | Running the app inside the Android Studio emulator. |
| **Cloud** | `vaanisetu.onrender.com` | Deployed cloud backend over secure HTTPS/WSS. |

---

## 📦 Building the Standalone APK

To generate a standalone release APK for demonstration phones:

1. **Bundle the JavaScript assets**:
   ```bash
   node node_modules/react-native/cli.js bundle \
     --platform android \
     --dev false \
     --entry-file index.js \
     --bundle-output android/app/src/main/assets/index.android.bundle \
     --assets-dest android/app/src/main/res
   ```

2. **Compile Release APK**:
   ```bash
   cd android
   .\gradlew assembleRelease
   ```

3. **Sign APK**:
   ```bash
   apksigner sign --ks app/debug.keystore \
     --ks-key-alias androiddebugkey \
     --ks-pass pass:android \
     --key-pass pass:android \
     --out ../../VaaniSetu-final.apk \
     app/build/outputs/apk/release/app-release.apk
   ```

A pre-built signed APK is also available in the repository root as `VaaniSetu-final.apk`.
