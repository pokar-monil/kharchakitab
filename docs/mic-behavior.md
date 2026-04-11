# Mic Behavior Guidelines

Use this doc as the single source of truth for mic behavior, troubleshooting, and tuning.

## 1. Recording Lifecycle (The Flow)

These are the chronological stages of a recording session from the user's perspective.

- **Triggering:**
    - Use click/tap to toggle recording (click-start, click-stop).
    - Manual stop: Users can tap again to stop immediately at any point.
- **Active Recording:**
    - Call `navigator.mediaDevices.getUserMedia({ audio: true })` to request microphone access.
    - Start `MediaRecorder`, buffer chunks in `chunksRef`, and assemble a single `audio/webm` blob upon stopping.
- **Termination:**
    - **Manual Stop:** Call `stopRecording()` which stops the `MediaRecorder`, resolves the final result, and performs cleanup.
    - **Automatic Stop (VAD):** Triggered when silence is detected for a predefined duration (see VAD Model section).
- **Cleanup Processing:**
    - Tear down audio tracks, intervals, and audio contexts only on unmount or explicit stop (cleanup on intermediate state changes will end streams prematurely).
    - Use a single `stopRecording()` path to avoid hidden cleanup paths that bypass recorder events.

## 2. Voice Activity Detection (VAD) Model

The current implementation uses a **Heuristic-based RMS (Root Mean Square)** model for silence detection to minimize CPU overhead.

- **The logic (RMS Calculation):**
    - Every `sampleIntervalMs` (200ms), the `AnalyserNode` captures a time-domain buffer.
    - Normalized raw byte data is used to calculate the square root of the mean of squares, providing a stable "effective volume" metric.
- **Decision Criteria:**
    - **Threshold:** If `RMS < 0.02` (silenceThreshold), the model counts a "silence" tick.
    - **Duration:** If silence ticks accumulate to more than `silenceDurationMs` (600ms), the system triggers an automatic stop.
    - **Warm-up Grace Period:** Silence detection is ignored for the first **2 seconds** of recording to ensure the user has time to start their sentence.
- **Experimental Insight (Future Upgrades):**
    - Currently zero-cost (no model weights).
    - Consider upgrading to **ONNX-based Silero VAD** if used in extremely noisy environments where volume-based thresholding fails to distinguish human speech from noise.

## 3. Validation & Post-Processing

Once a recording session ends, the resulting audio blob undergoes a series of checks and transforms.

- **Blob Validation:**
    - **Size/Duration check:** Ignore and block very short blobs (less than 500ms or 1000 bytes).
    - **Empty Blobs:** If no audio is captured, show "No audio captured" and fallback to typing.
    - **Double-Stop Protection:** If the recorder is already inactive, the method returns the last known successful `{ audioBlob, duration }` instead of `null`.
- **API Pipeline:**
    1. Create a temporary "Processing..." transaction in IndexedDB.
    2. Call `/api/sarvam` for Speech-to-Text (STT) conversion.
    3. Call `/api/gemini` for JSON parsing and intent extraction.
    4. Update the transaction in IndexedDB with the final data.
- **Intent Filtering:**
    - Delete the temporary transaction and stop if the transcript is empty or contains common filler/dismissal words (e.g., "okay.", "yes.", "no, i don't want it.").

## 4. Error Handling & Device Compatibility

- **Permissions:** If `getUserMedia` is denied or unsupported, show a clear error message and alert the user immediately.
- **MimeType Quirks:** Different browsers/devices return inconsistent mime types. Default to `"audio/webm"` if the reporter returns an empty or unsupported type.
- **State Inconsistency:** If `isRecording` is manually set to `false`, ensure the `recorder.onstop` event is still handled to process the final chunks.

## 5. Configuration & Tuning

All parameters are centrally managed in `src/config/mic.ts`.

| Parameter | Default | Typical Range | Description |
| :--- | :--- | :--- | :--- |
| `silenceThreshold` | `0.02` | `0.015 – 0.03` | Volume level below which sound is treated as silence. |
| `silenceDurationMs` | `600` | `500 – 900` | Duration of continuous silence required for an auto-stop. |
| `sampleIntervalMs` | `200` | `100 – 250` | How often the volume (RMS) is checked. |
| `MIN_AUDIO_DURATION_MS` | `500` | N/A | Lower limit to prevent tiny/accidental recordings. |
| `MIN_AUDIO_SIZE_BYTES` | `1000` | N/A | Lower limit for data size to ensure the blob is valid. |

### Comparison: Current Approach vs Blog's Voice Agent Approach

| Aspect | Current Approach | Blog's Approach (ntik.me/posts/voice-agent) |
| :--- | :--- | :--- |
| **Detection method** | RMS amplitude threshold (custom) | Silero VAD → Deepgram Flux (turn detection) |
| **Granularity** | Binary: loud/quiet | Semantic: speech/not-speech (handles background noise better) |
| **Mid-sentence pauses** | 600ms silence = stop (risky for natural speech pauses) | Deepgram Flux handles hesitations, "um", "uh" without false stops |
| **Noise robustness** | Low — noisy room keeps RMS above threshold; quiet speaker may false-stop | High — ML model distinguishes speech from noise |

### Tuning Guidelines:
- **Low Threshold:** Stops too late in noisy rooms.
- **High Threshold:** Stops too early for soft/whisper speakers.
- **Short Duration:** Aggressive; might cut off a user pausing between words.
- **Long Duration:** Feels slow or "laggy" to respond.
