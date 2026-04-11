# External Integrations

**Analysis Date:** 2026-04-12

## AI Services

### Google Generative AI (Gemini)

**Primary AI provider for:**
- Expense parsing from text (`app/api/gemini/route.ts`)
- Receipt OCR and parsing (`app/api/receipt/route.ts`)
- AI Agent streaming responses (`app/api/agent/route.ts`)
- "Mann Ki Baat" personalized messages

**Implementation:**
- Direct REST API calls to `https://generativelanguage.googleapis.com/v1beta/`
- SDK: `@ai-sdk/google` (Vercel AI SDK) for agent streaming
- Configurable via `GEMINI_API_KEY` environment variable
- Model selection via `GEMINI_MODEL` env var (default: `models/gemini-3.1-flash-lite-preview,models/gemma-3-27b-it`)
- Supports multiple fallback models with comma-separated list

**Files:**
- `app/api/gemini/route.ts` - Text-to-expense parsing
- `app/api/reipt/route.ts` - Receipt image parsing
- `app/api/agent/route.ts` - AI Agent with streaming

### OpenRouter (Fallback)

**Used as fallback when:**
- Gemini API fails or returns errors
- Receipt parsing fails

**Implementation:**
- Direct REST API calls to `https://openrouter.ai/api/v1/chat/completions`
- Configurable via `OPENROUTER_API_KEY` environment variable
- Model selection via `OPENROUTER_MODEL` env var (default: `openrouter/free`)

**Files:**
- `app/api/gemini/route.ts` (lines 66-111)
- `app/api/receipt/route.ts` (lines 64-117)

## Speech-to-Text

### Sarvam AI (STT)

**Primary STT provider for:**
- Voice input transcription
- Real-time streaming transcription via WebSocket

**Endpoints:**
- Batch STT: `https://api.sarvam.ai/speech-to-text`
- Streaming STT: `wss://api.sarvam.ai/speech-to-text-translate/ws`
- TTS: `https://api.sarvam.ai/text-to-speech/stream`

**Configuration:**
- Auth via `SARVAM_KEY` environment variable
- Model selection via `SARVAM_MODEL` env var (default: `saaras:v3`)
- TTS model via `SARVAM_TTS_MODEL` env var (default: `bulbul:v3`)

**Implementation:**
- Server-side proxy for streaming (browser WebSocket can't send custom headers)
- `server.ts` (lines 72-141) - WebSocket proxy for Sarvam STT
- `app/api/sarvam/route.ts` - Batch transcription API route
- `app/api/tts/route.ts` - Text-to-Speech API route
- `src/hooks/useStreamingSTT.ts` - Client-side streaming hook

**Proxy Reason:** Sarvam requires `Api-Subscription-Key` header which browsers cannot set via WebSocket API. The `server.ts` WebSocket server proxies the connection.

## Rate Limiting

### Upstash Redis

**Usage:**
- IP-based rate limiting for API routes
- Sliding window rate limiting algorithm

**Configuration:**
- Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
- Graceful degradation: allows requests when Redis unavailable (except on Vercel)

**Rate Limits:**
- Sarvam STT: 6 requests per 60 seconds (`app/api/sarvam/route.ts`)
- TTS: 20 requests per 60 seconds (`app/api/tts/route.ts`)

**Files:**
- `src/lib/ratelimit.ts` - Rate limiting implementation

## Analytics & Monitoring

### PostHog

**Client-side:**
- `posthog-js` 1.363.4 - Session recording, feature flags, analytics
- Lazy-loaded via `instrumentation-client.ts` to reduce TBT (Total Blocking Time)
- Session recording starts 15 seconds after page load

**Server-side:**
- `posthog-node` 5.28.5 - Server-side event capture
- Used in API routes for conversion tracking

**Configuration:**
- Key: `NEXT_PUBLIC_POSTHOG_KEY`
- Host: Self-hosted via Next.js rewrites → `https://us.i.posthog.com`
- Assets: `/_h/static/` → `https://us-assets.i.posthog.com/static/`
- Toggle: `NEXT_PUBLIC_POSTHOG_ENABLED` (default: production only)

**Events Tracked:**
- `transcription_completed` / `transcription_failed` / `transcription_rate_limited`
- `receipt_parsed` / `receipt_parse_failed`
- `expense_parsed` / `expense_parse_failed`
- `mann_ki_baat_generated` / `mann_ki_baat_generate_failed`
- Share submission events

**Files:**
- `src/utils/analytics.ts` - Client-side PostHog wrapper
- `src/lib/posthog-server.ts` - Server-side PostHog client
- `instrumentation-client.ts` - Deferred PostHog initialization
- `next.config.ts` (lines 36-44) - PostHog rewrites

## Real-Time Communication

### Custom WebSocket Server

**Server:** `server.ts` running on port 7071 (configurable via `PORT` env var)

**Features:**
- Device presence tracking (online/offline status)
- Cross-device sync signaling
- Pairing session management with TTL
- Sarvam STT WebSocket proxying
- WebRTC signaling (offer/answer/candidate)

**Protocol:**
- JSON messages with `type`, `payload`, `request_id` fields
- Message types: `presence:*`, `pairing:*`, `webrtc:*`, `stt:*`

**Presence System:**
- Devices ping every 30 seconds
- Stale clients pruned after 60 seconds
- Pairing sessions expire after 5 minutes

**Files:**
- `server.ts` - Full WebSocket server implementation
- `src/services/sync/signalingClient.ts` - Client-side signaling
- `src/config/sync.ts` - `SIGNALING_URL` configuration

## Offline & Storage

### IndexedDB (via idb)

**Usage:**
- Offline expense storage
- Data persistence across sessions
- CSV import/export

**Files:**
- `src/db/db.ts` - Database operations
- `idb` package for IndexedDB wrapper

## Device Identity

### FingerprintJS

**Usage:**
- Device fingerprinting for analytics and device identification
- `@fingerprintjs/fingerprintjs` 5.1.0

**Files:**
- `src/utils/deviceIdentity.ts` - Device identification utilities

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI API key | Yes |
| `GEMINI_MODEL` | Gemini model ID(s), comma-separated | No |
| `SARVAM_KEY` | Sarvam AI subscription key | Yes |
| `SARVAM_MODEL` | Sarvam STT model | No |
| `SARVAM_TTS_MODEL` | Sarvam TTS model | No |
| `OPENROUTER_API_KEY` | OpenRouter fallback key | Recommended |
| `OPENROUTER_MODEL` | OpenRouter model | No |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | For rate limiting |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | For analytics |
| `NEXT_PUBLIC_POSTHOG_ENABLED` | Enable PostHog | No |
| `NEXT_PUBLIC_SIGNALING_URL` | WebSocket server URL | No |
| `PORT` | WebSocket server port | No |
| `VERCEL` | Running on Vercel | Auto-set |

### Local Development

- `.env` file loaded by `server.ts` via `dotenv`
- Next.js loads `.env.local` automatically

## Webhook Endpoints

**No external webhooks configured** - All external communication is outbound:
- Google Generative AI (outbound REST calls)
- Sarvam AI (outbound REST + WebSocket)
- OpenRouter (outbound REST)
- PostHog (outbound events)

---

*Integration audit: 2026-04-12*
