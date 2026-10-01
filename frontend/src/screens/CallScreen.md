# `frontend/src/screens/` — Mobile Application Screens

This directory contains the primary user interface screens of the VaaniSetu React Native mobile app: `OnboardingScreen.tsx` and `CallScreen.tsx`.

---

## 📱 Screens Overview

### 1. `OnboardingScreen.tsx` (Connection & Setup Screen)
The entry screen for configuring the device before entering a voice call.

- **Server Connection Manager**:
  - Direct server IP/Host input field with one-tap preset buttons:
    - **Hotspot**: `192.168.137.1:8000` (Windows Mobile Hotspot for direct laptop-to-phone tethering).
    - **Wi-Fi LAN**: Local PC network IP for shared router connections.
    - **Emulator**: `10.0.2.2:8000` for Android Studio emulators.
    - **Cloud**: `vaanisetu.onrender.com` for permanent hosted deployment.
  - Live server ping button showing backend status (`/health`) and connectivity indicators.
- **Caller Configuration**:
  - Custom Room / Call ID input (e.g. `room-101`).
  - Auto-generated or custom User ID.
  - Native Language Selector: Choose between **Hindi (`hi`)**, **Tamil (`ta`)**, **Telugu (`te`)**, and **English (`en`)**.
- **Action Buttons**:
  - **Join Call**: Connects to the specified room and pairs with a peer caller.
  - **Quick Solo Demo**: Instantly connects in self-loopback mode (`solo-...`), allowing a single judge or developer to speak and immediately hear the full round-trip pipeline.

---

### 2. `CallScreen.tsx` (Active Voice Call Screen)
The primary in-call communication interface featuring real-time bandwidth metrics and Push-to-Talk voice controls.

- **Header & Status Bar (`CallHeader.tsx`)**:
  - Live connection status badge: Connecting, Connected, Disconnected.
  - Peer pairing indicator: Shows whether the other party has joined the room.
  - Room ID and participant badges.
- **AI Pipeline Visualizer (`PipelineVisualizer.tsx` / `AIProcessIndicator.tsx`)**:
  - Animates the discrete stages of the voice bridge:
    1. `Listening` (Mic recording)
    2. `Transcribing` (STT inference)
    3. `Translating` (Cross-language translation if peer speaks another language)
    4. `Channel Transmitting` (Compression + Reed-Solomon FEC over low-bitrate link)
    5. `Synthesizing` (TTS neural voice generation)
    6. `Playing` (Receiver audio playback)
- **Live Bandwidth & Bitrate Savings (`CallMetricsCard.tsx`)**:
  - Displays actual **Bits Used** for the most recent transmission (e.g. 420 bits).
  - Shows total bits sent across the entire session.
  - Calculates and highlights **Bandwidth Saved** (>95% reduction compared to standard VoIP).
  - Displays packet loss and channel status indicators.
- **Push-to-Talk (PTT) Controller (`PushToTalkControl.tsx`)**:
  - Tactile press-and-hold (or tap-to-talk) button with animated ripple effect.
  - Audio visualizer waveform during active recording.
  - Automatic minimum recording threshold to prevent empty noise bursts.
- **Live Conversation & Transcript Feed (`TranscriptFeed.tsx`)**:
  - Bubble feed showing the exchange history.
  - Displays source transcribed text and target translated text with confidence scores.
  - Highlights corrupted/lost packets if channel bit flips exceed FEC capacity.
- **Call Details Modal (`CallDetailsModal.tsx`)**:
  - Inspect detailed technical metadata: audio sample rate, FEC parity ratio, server endpoint, and round-trip timings.
