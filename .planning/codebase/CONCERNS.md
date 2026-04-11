# Codebase Concerns

**Analysis Date:** 2026-04-12

## Security Considerations

### Critical: Overly Permissive Content Security Policy

**Files:** `next.config.ts`

**Issue:** The CSP header contains significant security weaknesses:
```javascript
"script-src 'self' 'unsafe-eval' 'unsafe-inline'"
```

- `'unsafe-eval'` allows execution of code constructed from strings - a major attack vector
- `'unsafe-inline'` allows inline scripts, negating XSS protections
- `connect-src 'self' *` allows connections to any external domain

**Impact:** XSS attacks can execute arbitrary code. While `unsafe-eval` is sometimes required for Next.js hot reloading, it should be restricted or removed in production builds.

**Fix approach:** Use nonces or hashes for inline scripts. Remove `*` from connect-src.

---

### High: Device Fingerprinting for Identity

**Files:** `src/utils/deviceIdentity.ts`, `src/db/db.ts`

**Issue:** Uses FingerprintJS v5 (`@fingerprintjs/fingerprintjs`) for browser fingerprinting to identify devices. This:
1. Requires an API key (v5 changed to a paid service model)
2. Can be blocked by privacy extensions (uBlock Origin, Privacy Badger)
3. Creates privacy concerns as it tracks users across sites
4. Is unreliable on Firefox where `navigator.userAgentData` is limited

**Current behavior:** Falls back to UA string parsing if FingerprintJS fails, but this is less reliable.

**Impact:** Device pairing may fail for privacy-conscious users. Recovery from IDB wipe depends on fingerprint matching.

**Fix approach:** Consider using IndexedDB-based device identity that doesn't require external fingerprinting, or make fingerprint optional with manual device naming fallback.

---

### Medium: No API Authentication

**Files:** `app/api/gemini/route.ts`, `app/api/agent/route.ts`, `app/api/receipt/route.ts`

**Issue:** API routes have no authentication mechanism. They rely solely on:
1. Rate limiting (which is disabled in development without Redis)
2. PostHog distinct ID from headers (client-supplied, easily spoofed)

**Impact:** Anyone can make requests to AI parsing endpoints, potentially draining API quotas.

**Fix approach:** Add simple request signing or verify PostHog session server-side.

---

### Medium: localStorage for Sensitive Data

**Files:** Multiple - `src/components/BudgetCard.tsx`, `src/services/sync/syncEngine.ts`, `src/lib/agent/snapshot.ts`

**Issue:** Household budgets and personal budgets are stored in localStorage:
```typescript
localStorage.setItem("kk_budgets_household", JSON.stringify(local));
```

**Why this matters:**
- localStorage is accessible to any JavaScript on the page (XSS vulnerability)
- Data persists indefinitely and is not encrypted
- Shared budgets contain device IDs and amounts - sensitive financial data

**Mitigating factors:**
- Private transactions are stored in IndexedDB, not localStorage
- Pairing keys are stored in IndexedDB

**Fix approach:** Move budget storage to IndexedDB or use `sessionStorage` for transient data.

---

### Low: Signaling Server Connection Security

**Files:** `src/services/sync/signalingClient.ts`, `src/config/sync.ts`

**Issue:** WebSocket signaling server URL defaults to `ws://localhost:7071` in development. While the actual P2P data is encrypted via ECDH/AES-GCM, the signaling connection is unauthenticated.

**Impact:** Man-in-the-middle could intercept signaling messages (SDP offers/answers) though this doesn't reveal encrypted data.

**Fix approach:** Use WSS (WebSocket Secure) in production with certificate validation.

---

## Performance Concerns

### High: Large Dependency Bundle

**File:** `package.json`

**Issue:** Multiple large libraries bundled together:
- `@ai-sdk/google` - AI SDK (heavy)
- `@headlessui/react` - Headless UI
- `framer-motion` - Animation library
- `heic2any` - HEIC image conversion (large native-like code)
- `browser-image-compression` - Image processing
- `@fingerprintjs/fingerprintjs` - Fingerprinting (5MB+ with all components)
- `posthog-js` - Analytics

**Impact:** Initial load time, especially on mobile networks.

**Fix approach:** Implement dynamic imports for heavy libraries (FingerprintJS is already lazy-loaded, but HEIC conversion and image compression could be deferred).

---

### Medium: No Virtualized Lists for Large Transaction Sets

**Files:** `src/components/RecentTransactions.tsx` (not reviewed), implied from imports

**Issue:** While `@tanstack/react-virtual` is installed, it may not be used for the transaction list. Without virtualization, rendering thousands of transactions could cause performance degradation.

**Impact:** Performance issues on devices with large transaction histories (years of data).

**Fix approach:** Verify RecentTransactions uses virtual scrolling for long lists.

---

### Medium: In-Memory Query Cache Not Persistent

**File:** `src/db/db.ts`

**Issue:** The query cache (MAX_CACHE_ENTRIES = 50) is purely in-memory:
```typescript
const queryCache = new Map<string, Transaction[]>();
```

**Why this matters:**
- Cache is lost on page refresh
- Doesn't benefit from IndexedDB's persistence advantages
- No cache warming strategy

**Mitigating factors:** IndexedDB reads are reasonably fast; cache provides optimization for repeated queries within a session.

**Fix approach:** Consider caching frequently-accessed data (recent transactions) in localStorage for faster initial load.

---

### Medium: Version History Growth

**File:** `src/db/db.ts`

**Issue:** Every transaction edit creates a full snapshot:
```typescript
const version: TransactionVersion = {
  ...
  payload_snapshot: transaction,
};
```

**Impact:** With frequent edits, version history can grow significantly. Each snapshot is a full transaction object.

**Fix approach:** Store diffs instead of full snapshots, or implement automatic pruning of old versions.

---

## Scalability Limitations

### High: Local-First Architecture Limits

**Overall architecture:** The app is designed as a local-first, P2P application. Each browser instance maintains its own IndexedDB.

**What this means:**
1. No server-side data storage
2. Sync only works between exactly 2 paired devices
3. No web access from other browsers/devices
4. No multi-user access beyond the paired device
5. No backup/recovery via cloud

**Impact:** Users cannot:
- Access their data from a new device
- Share data with family beyond one partner
- Recover data if IndexedDB is cleared

**Fix approach:** Document these limitations clearly. Consider an optional cloud sync option for users who want it.

---

### Medium: Browser Storage Quotas

**File:** `src/db/db.ts`

**Issue:** IndexedDB is subject to browser storage limits:
- Chrome: 60% of disk space (can be unlimited with "unlimited storage" permission)
- Firefox: 50% of disk space or 2GB
- Safari: 1GB hard limit

**Impact:** Heavy users (many years of data, receipts, etc.) could hit storage limits.

**Fix approach:** Implement storage usage monitoring and warn users before hitting limits. Consider offloading old data to file export.

---

### Medium: No Data Export Mechanism

**Issue:** While CSV export exists (`src/db/db.ts` - `importTransactionsFromCsv`), there's no documented backup/restore for:
- Full data export (all tables)
- Automatic backups
- Data portability

**Impact:** Users have no way to back up their data to the cloud.

**Fix approach:** Add a full JSON export of all data including recurring templates and settings.

---

## Browser Compatibility Issues

### Medium: FingerprintJS Fallback Gaps

**File:** `src/utils/deviceIdentity.ts`

**Issue:** The device name derivation relies heavily on `navigator.userAgentData` which is:
- Only available in Chrome/Edge
- Limited on Firefox (no high-entropy hints)
- Not supported on Safari at all

**Fallback behavior:** Falls back to UA string parsing, which is less accurate.

**Impact:** Device names may be generic ("Device") on Safari/Firefox.

---

### Low: CompressionStream API Requirement

**File:** `src/services/sync/crypto.ts`

**Issue:** Sync compression uses `CompressionStream`/`DecompressionStream` which are modern APIs:
```typescript
const supportsCompression =
  typeof CompressionStream !== "undefined" &&
  typeof DecompressionStream !== "undefined";
```

**Impact:** Older browsers (IE, older Safari) will skip compression. Large syncs will transfer more data.

**Fallback:** Code handles missing compression, but large transaction sets will be slower.

---

### Low: WebRTC Limitations

**Files:** `src/services/sync/webrtc.ts`, `src/config/sync.ts`

**Issue:** WebRTC P2P sync has inherent limitations:
- Requires TURN servers for NAT traversal (costs money, latency)
- Doesn't work behind strict corporate firewalls
- Connection establishment can be slow

**Impact:** Some users may not be able to pair devices at all.

---

## Maintenance Concerns

### Critical: No Test Coverage

**Files:** No test files found in `**/*.test.{ts,tsx}` or `**/*.spec.{ts,tsx}`

**Issue:** Zero test coverage for:
- Database operations (critical for data integrity)
- Sync engine (complex merge logic)
- Crypto operations
- API routes

**Impact:** Any refactoring or changes risk breaking core functionality without detection.

**Fix approach:** Add unit tests for critical paths. At minimum:
- Sync merge logic (version comparison, tombstone handling)
- Transaction CRUD operations
- CSV import/export

---

### High: Package Name Still "my-app"

**File:** `package.json`

**Issue:** Package name is `"name": "my-app"` instead of `"name": "kharchakitab"` or similar.

**Impact:** Looks unprofessional in npm/package managers.

**Fix approach:** Rename to `kharchakitab`.

---

### Medium: Legacy Code Still Present

**Files:** `src/db/db.ts`

**Issue:** Code still handles legacy data migration:
```typescript
// Historical data included a `source` field on transactions. We no longer store it,
// but old records may still have it.
function stripLegacyTxFields(tx: Transaction): Transaction {
```

**Impact:** Maintenance burden. This code will never be removed and adds cognitive load.

**Fix approach:** Document that legacy migration is a one-time operation. Add version flag to skip migration after certain version.

---

### Low: Duplicate Date Math in Service Worker

**File:** `public/sw.js`

**Issue:** Date helper functions (`atLocalNine`, `addDaysLocal`, `calculateNextDueDate`, `daysBetweenLocal`) are duplicated from client code because the service worker can't import ES modules.

**Impact:** Two places to maintain the same logic. Risk of divergence.

**Fix approach:** Document that service worker date logic must stay in sync. Consider extracting to a shared build.

---

## Offline Capabilities & Limitations

### Well-Handled: Offline-First Design

**Strengths:**
- IndexedDB stores all data locally
- App works fully offline
- PWA service worker caches assets
- Pending transactions are queued

**Files:** `public/sw.js`, `src/db/db.ts`

---

### Medium: Sync Requires Both Devices Online

**Files:** `src/services/sync/syncEngine.ts`

**Issue:** P2P sync requires both devices to be online simultaneously:
1. Both must open the app
2. WebRTC connection must be established
3. Signaling server must be reachable

**Impact:** "Offline-first" is limited to single-device use. True multi-device requires coordination.

---

### Low: No Offline Detection UI

**Issue:** No clear indicator when device is offline vs. online. Sync status updates may fail silently.

**Impact:** Users may not know sync isn't working until they open the other device.

**Fix approach:** Add visible offline indicator and retry UI for failed syncs.

---

## Inconsistencies & Code Quality Issues

### Medium: Inconsistent Context Usage

**File:** `src/context/AppContext.tsx`

**Issue:** The legacy `useAppContext` hook uses dynamic `require()` instead of proper imports:
```typescript
const { useRecording: useRec } = require("./RecordingContext");
```

**Impact:** Breaks tree-shaking and can cause issues with bundlers. While it works, it's non-idiomatic.

**Fix approach:** Refactor to use static imports and remove the legacy hook.

---

### Low: Magic Strings Throughout

**Files:** Multiple - `src/components/BudgetCard.tsx`, `src/hooks/*.ts`

**Issue:** Keys like `"kk_budgets_household"`, `"kk_budgets_perfect"`, `"kk_mannKiBaat"` are scattered across files.

**Impact:** Typos cause silent failures. No central definition.

**Fix approach:** Create a constants file for all localStorage/IndexedDB key names.

---

### Low: Error Handling Inconsistency

**Files:** Multiple API routes and services

**Issue:** Some places throw generic errors, others return error objects. API returns `status: 200` on failure in some cases.

**Example:** `app/api/agent/route.ts`:
```typescript
return Response.json(
  { reply: 'Something went wrong, try again.', ... },
  { status: 200 }  // Should be 500
)
```

**Impact:** Client error handling may not work correctly.

**Fix approach:** Standardize error responses and use appropriate HTTP status codes.

---

### Low: Console.log Statements in Production

**Files:** Multiple - `src/services/sync/syncEngine.ts`, `src/services/sync/signalingClient.ts`

**Issue:** Extensive `console.log` usage for debugging. While useful during development, these add noise and could leak data in production.

**Impact:** Performance (string concatenation), potential data exposure in production logs.

**Fix approach:** Use a proper logging library with level control, or remove production logs.

---

## Dependencies at Risk

### Medium: FingerprintJS v5 API Changes

**File:** `package.json`

**Risk:** FingerprintJS v5 changed from free open-source to a freemium model. The free tier may become more limited.

**Impact:** Device identity feature may stop working or require payment.

**Alternative:** `@fingerprintjs/fingerprintjs-pro` is paid; open-source v4 is deprecated.

**Fix approach:** Evaluate alternatives or build custom fingerprinting.

---

### Low: heic2any Stability

**File:** `package.json`

**Risk:** `heic2any` is a small library handling complex HEIC conversion. May have edge cases on specific browsers/devices.

**Impact:** Receipt parsing may fail silently for HEIC images.

**Fix approach:** Add error handling with fallback messaging to users.

---

## Summary of Priority Concerns

| Priority | Concern | Impact | Fix Effort |
|----------|---------|--------|------------|
| Critical | No tests | Data integrity risk | High |
| Critical | Overly permissive CSP | XSS vulnerability | Medium |
| High | Device fingerprinting dependency | Privacy/reliability | High |
| High | Package name "my-app" | Professionalism | Low |
| Medium | localStorage for budgets | Security | Medium |
| Medium | Large bundle size | Performance | Medium |
| Medium | No API authentication | Resource exhaustion | Medium |
| Medium | Sync requires both online | Usability | High |
| Medium | Version history growth | Storage | Medium |
| Low | Magic strings | Maintainability | Low |
| Low | Console.log in production | Performance/privacy | Low |

---

*Concerns audit: 2026-04-12*
