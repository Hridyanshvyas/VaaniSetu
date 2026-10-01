# `frontend/src/audio/` — Audio Capture & Playback Subsystem

This module handles client-side audio hardware interaction for the VaaniSetu React Native mobile app: recording voice input from the microphone and playing synthesized voice responses through the device speaker.

---

## 📁 Files

### 1. `recorder.ts`
Manages microphone capture, permissions, audio file handling, and fast byte conversions for transmission.

- **Audio Format**: Captures 16 kHz Mono PCM WAV audio to match the requirements of the backend STT service (`ml/stt_service`).
- **Permission Handling**: `requestMicPermission()` checks and requests Android `RECORD_AUDIO` runtime permissions.
- **Fast Base64 Decoding**: Includes an optimized, pre-computed lookup table implementation (`fastBase64ToUint8Array`) that converts base64-encoded audio files into `Uint8Array` byte buffers without extraneous memory allocations.
- **Lifecycle & Safety**:
  - `startRecording()`: Initiates audio recording via `react-native-audio-recorder-player` to a cache file. Prevents overlapping recordings with an active recording mutex (`isRecordingActive`).
  - `stopRecording()`: Stops capture, reads the saved audio file via `react-native-fs`, converts it to binary bytes, cleans up temporary files, and returns the raw audio byte buffer.
  - Automatically handles minimum recording duration thresholds and timeout resets.

### 2. `player.ts`
Manages playback of synthesized neural speech received from the backend over the WebSocket.

- **Playback Flow**:
  1. Receives raw audio bytes as an `ArrayBuffer` from the WebSocket client (`network/websocketClient.ts`).
  2. Converts the binary buffer to Base64 using `fastUint8ArrayToBase64`.
  3. Writes the buffer to the temporary app cache (`${RNFS.CachesDirectoryPath}/vaanisetu-received.wav`) using `react-native-fs`.
  4. Stops any currently playing audio and plays the new WAV file through the device speaker using `react-native-audio-recorder-player`.
- **Fast Base64 Encoding**: Uses `fastUint8ArrayToBase64()` to efficiently encode raw byte buffers for filesystem writes without external library overhead.

---

## 🛠️ Native Dependencies

- `react-native-audio-recorder-player` — Low-level audio recording and playback on Android and iOS.
- `react-native-fs` — File system access for cache management and raw audio I/O.
