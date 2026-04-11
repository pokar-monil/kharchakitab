# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Next.js 16 SPA with PWA capabilities and local-first data architecture

**Key Characteristics:**
- Client-heavy SPA rendered in browser with dynamic imports for code splitting
- Local-first data persistence using IndexedDB (via `idb` library)
- Real-time peer-to-peer sync via WebRTC (signaling through custom WebSocket server)
- Voice-first input with streaming speech-to-text (Sarvam AI)
- AI-powered parsing (Gemini, OpenRouter fallback) for Hinglish expense parsing
- PWA with offline support via service worker (`public/sw.js`)

## Layers

**UI Layer (`app/page.tsx`, `src/components/`):**
- Purpose: User interface and interaction handling
- Location: `app/page.tsx` (main app shell), `src/components/*.tsx` (feature components)
- Contains: React components, state management UI bindings, modals, sheets
- Depends on: Context providers, hooks, services
- Used by: End users via browser

**State Management Layer (`src/context/`):**
- Purpose: Application state coordination
- Location: `src/context/AppContext.tsx` (composite), `src/context/*.tsx` (split contexts)
- Contains: RecordingContext, NavigationContext, CurrencyContext, PairingContext, RecordingContext, SignalingContext
- Pattern: Split context pattern to prevent unnecessary re-renders (PERF-RERENDER optimization)
- Depends on: No internal dependencies (leaf contexts)
- Used by: All components via custom hooks

**Data Layer (`src/db/db.ts`):**
- Purpose: IndexedDB abstraction for local-first persistence
- Location: `src/db/db.ts`
- Contains: Transaction CRUD, recurring templates, device identity, pairings, sync state, import/export
- Pattern: Repository pattern with query caching and optimistic updates
- Indexes: by-date, by-updated, by-owner, by-private, by-deleted, by-next-due, by-next-fire
- Used by: Components, hooks, services

**Service Layer (`src/services/`):**
- Purpose: External integrations and business logic
- Location: `src/services/` (gemini.ts, sarvam.ts, receipt.ts, notifications/, sync/)
- Contains: AI parsing, speech-to-text, receipt OCR, push notifications, WebRTC sync
- Depends on: API routes, db layer
- Used by: App shell and hooks

**API Layer (`app/api/`):**
- Purpose: Server-side endpoints for external services
- Location: `app/api/` (Next.js Route Handlers)
- Contains: `gemini/route.ts` (expense parsing), `sarvam/route.ts` (STT proxy), `receipt/route.ts` (receipt OCR), `tts/route.ts` (text-to-speech), `share/submit/route.ts` (share functionality), `agent/route.ts` (AI agent), `page-agent/chat/completions/route.ts` (chat completions)
- Pattern: RESTful Next.js route handlers with JSON responses
- Depends on: External AI providers (Google Gemini, Sarvam AI)

**Infrastructure Layer (`server.ts`):**
- Purpose: Custom WebSocket server for real-time communication
- Location: `server.ts` (root)
- Contains: WebSocket server on port 7071, Sarvam STT proxy, presence management, pairing sessions, WebRTC signaling relay
- Pattern: Standalone Node.js HTTP/WebSocket server (runs concurrently with Next.js via `concurrently`)
- Used by: Browser clients via WebSocket for real-time features

## Data Flow

**Voice Input Flow:**
```
User speaks → useAudioRecorder (MediaRecorder API) → audioBlob
audioBlob → useStreamingSTT → Sarvam STT (via server.ts WebSocket proxy)
transcript → processStreamingTranscript → parseWithGeminiFlash (src/services/gemini.ts)
parsed expense → addTransaction (src/db/db.ts) → IndexedDB
```

**Receipt Processing Flow:**
```
User uploads image → prepareReceiptImage (resize/compress) → 
parseReceiptWithGemini (src/services/receipt.ts) → 
addTransaction → IndexedDB
```

**Household Sync Flow:**
```
SignalingProvider connects to server.ts WebSocket
presence:join → device registered
pairing:request/accept/confirm → WebRTC signaling exchange
WebRTC DataChannel → syncEngine (src/services/sync/syncEngine.ts)
CRDT-like sync with version tracking → upsertTransactionRaw → IndexedDB
```

**Text Input Flow:**
```
User types Hinglish text → processTextInput →
POST /api/gemini → parseWithGeminiFlash →
Expense[] → saveSingleExpense / handleBulkSave → IndexedDB
```

## Navigation Model

**Primary Navigation:** Bottom tab bar with 3 tabs (summary, recurring, household)
- Implemented in `src/components/BottomTabBar.tsx`
- State managed via NavigationContext
- Dynamic imports for all tab content

**Secondary Navigation:**
- Overlays/sheets for: AnalyticsView, EditModal, BulkExpensePreview, RecurringEditModal, NotificationsSettings, SyncManager
- Full-screen slide-in panels via CSS transforms
- Modal pattern for focused interactions

**State Management:**
- `activeTab` state in NavigationContext
- `isEditing`, `isHistoryOpen`, `isChatOpen`, `isSyncOpen`, etc. managed locally in AppShell
- `useTransition` for expensive state updates triggering heavy renders

## Key Architectural Decisions

**1. Split Context Pattern (PERF-RERENDER)**
- Refactored from monolithic AppContext to composite of RecordingContext, NavigationContext, CurrencyContext, PairingContext
- Prevents component re-renders when unrelated state changes
- Backward compatibility maintained via `useAppContext` hook

**2. Local-First with IndexedDB**
- All data persisted locally first via `idb` wrapper
- Sync happens asynchronously after local write
- Optimistic UI updates with eventual consistency

**3. Multi-Model AI Fallback**
- Primary: Gemini (models/gemini-3.1-flash-lite-preview, models/gemma-3-27b-it)
- Fallback: OpenRouter
- Server-side validation with Zod before returning to client

**4. WebSocket Proxy for STT**
- Browser WebSocket API cannot send custom headers
- Sarvam AI requires `Api-Subscription-Key` header
- Custom server.ts proxies WebSocket connections, adding auth header server-side

**5. Recurring Transaction Generation**
- Templates stored separately in IndexedDB
- Future transactions pre-generated on template create/update
- Amortization support for quarterly/yearly expenses

**6. PWA with Offline Support**
- Service worker at `public/sw.js`
- Web app manifest at `public/manifest.json`
- Install prompt triggered after first transaction (C1 event)

## Error Handling

**Client-Side:**
- Error boundaries around major sections
- Toast notifications for transient errors (auto-dismiss after 5s)
- PostHog analytics for error tracking
- Fallback values and graceful degradation

**Service Layer:**
- Try-catch with user-friendly error messages via `ERROR_MESSAGES` mapping
- Validation with Zod schemas on both client and server
- Rate limiting via Upstash Redis (`src/lib/ratelimit.ts`)

**API Routes:**
- Structured error responses with status codes
- Server-side validation before processing
- PostHog event capture for monitoring

**Real-Time (WebSocket):**
- Connection state management
- Automatic reconnection logic
- Session TTL for pairing sessions (5 minutes)

---

*Architecture analysis: 2026-04-12*
