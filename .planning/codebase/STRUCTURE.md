# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
kharchakitab/
├── app/                    # Next.js App Router pages and API routes
├── src/                    # Source code (components, hooks, db, services)
├── public/                 # Static assets (icons, manifest, service worker)
├── .planning/             # GSD planning artifacts
├── docs/                  # Documentation
├── content/               # MDX blog content
├── server.ts              # Standalone WebSocket server
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies
└── *.config.*             # Various config files (eslint, postcss, etc.)
```

## Directory Purposes

**`app/` (Next.js App Router):**
- Purpose: Pages and API routes
- Contains: Page components, layout, API route handlers, static pages
- Key files:
  - `layout.tsx` - Root layout with fonts, metadata, structured data
  - `page.tsx` - Main app shell (client component)
  - `globals.css` - Global Tailwind CSS variables and base styles
  - `api/` - Route handlers

**`src/components/`:**
- Purpose: Reusable React components
- Contains: UI components, view components, modals, sheets
- Key files:
  - `HomeView.tsx` - Main summary view
  - `BottomTabBar.tsx` - Navigation tabs
  - `RecordingStatus.tsx` - Recording indicator
  - `TransactionRow.tsx` - Individual transaction display
  - `EditModal.tsx` - Transaction edit dialog
  - `BulkExpensePreview.tsx` - Multi-expense confirmation
  - `AnalyticsView.tsx` - Transaction history
  - `RecurringView.tsx` - Recurring expense management
  - `SyncManager.tsx` - Household sync interface
  - `AgentChat.tsx` - AI chat assistant
  - `MannKiBaat.tsx` - AI "roast" feature
  - `blog/` - Blog-specific components

**`src/context/`:**
- Purpose: React context providers for state management
- Contains: Split contexts for different concerns
- Key files:
  - `AppContext.tsx` - Composite provider and backward-compatible hook
  - `RecordingContext.tsx` - Recording state (isRecording, setIsRecording)
  - `NavigationContext.tsx` - Tab navigation (activeTab, setActiveTab)
  - `CurrencyContext.tsx` - Currency preference (code, symbol)
  - `PairingContext.tsx` - Household pairing state
  - `SignalingContext.tsx` - WebSocket signaling for P2P sync

**`src/hooks/`:**
- Purpose: Custom React hooks
- Contains: Reusable logic extracted from components
- Key files:
  - `useAudioRecorder.ts` - MediaRecorder wrapper
  - `useStreamingSTT.ts` - Streaming speech-to-text
  - `useCurrency.ts` - Currency formatting
  - `useMannKiBaat.ts` - AI roast feature
  - `useMobileSheet.ts` - Mobile sheet state
  - `useOnboardingTour.ts` - First-visit tooltips
  - `usePwaInstall.ts` - PWA install prompt
  - `useSyncEvents.ts` - Sync event handling
  - `usePendingTransactions.ts` - Pending transaction state

**`src/db/`:**
- Purpose: IndexedDB data layer
- Contains: Single file with all database operations
- Key files:
  - `db.ts` - Full database abstraction (1255 lines)

**`src/services/`:**
- Purpose: External integrations and business logic
- Contains: AI services, notifications, sync
- Subdirectories:
  - `gemini.ts` - Gemini flash parsing
  - `sarvam.ts` - Sarvam STT client
  - `receipt.ts` - Receipt OCR
  - `notifications/` - Push notification services
    - `core.ts` - Notification registration
    - `dailyReminder.ts` - Daily reminder scheduling
    - `mannKiBaat.ts` - Motivational messages
    - `recurring.ts` - Recurring expense alerts
    - `index.ts` - Re-exports
  - `sync/` - Peer-to-peer sync
    - `signalingClient.ts` - WebSocket signaling
    - `syncEngine.ts` - Sync logic
    - `syncEvents.ts` - Sync event types
    - `webrtc.ts` - WebRTC helpers
    - `crypto.ts` - Encryption utilities

**`src/lib/`:**
- Purpose: Server-side utilities
- Contains: Server-side only logic
- Key files:
  - `agent/` - AI agent implementation
    - `snapshot.ts` - Agent state snapshot
    - `tools.ts` - Agent tools
    - `types.ts` - Agent types
  - `blog.ts` - Blog utilities
  - `posthog-server.ts` - PostHog server client
  - `ratelimit.ts` - Rate limiting utilities

**`src/utils/`:**
- Purpose: Pure utility functions
- Contains: Data transformations, validations, helpers
- Key files:
  - `analytics.ts` - PostHog client wrapper
  - `dates.ts` - Date utilities
  - `deviceIdentity.ts` - Device fingerprinting
  - `error.ts` - Error message mapping
  - `ics.ts` - ICS calendar generation
  - `imageProcessing.ts` - Image resize/compress
  - `mannKiBaat.ts` - Roast prompt utilities
  - `money.ts` - Currency formatting
  - `prompts.ts` - AI prompt templates
  - `schemas.ts` - Zod validation schemas
  - `soundFeedback.ts` - Audio feedback
  - `transactions.ts` - Transaction utilities

**`src/config/`:**
- Purpose: Application configuration
- Contains: Static configuration values
- Key files:
  - `site.ts` - Site metadata (URL, name, description)
  - `categories.ts` - Expense categories
  - `payments.ts` - Payment methods
  - `recurring.ts` - Recurring expense config
  - `sync.ts` - Sync configuration
  - `mic.ts` - Microphone settings

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Shared interfaces
- Key files:
  - `index.ts` - All shared types (Transaction, DeviceIdentity, PairingRecord, SyncState, etc.)
  - `heic2any.d.ts` - Type declarations for heic2any

**`public/`:**
- Purpose: Static assets served as-is
- Contains: Icons, manifest, service worker, sounds
- Key files:
  - `manifest.json` - PWA manifest
  - `sw.js` - Service worker for offline support
  - `icon-*.png` - App icons
  - `icon.svg` - SVG icon
  - `logo.svg` - Logo
  - `sounds/` - Audio feedback files
  - `worklets/` - Audio worklets
  - `migrate.html` - Migration helper

**`app/api/` (Route Handlers):**
- Purpose: Server-side API endpoints
- Contains: RESTful endpoints
- Routes:
  - `gemini/route.ts` - AI expense parsing
  - `sarvam/route.ts` - STT proxy
  - `receipt/route.ts` - Receipt OCR
  - `tts/route.ts` - Text-to-speech
  - `share/submit/route.ts` - Share submission
  - `agent/route.ts` - AI agent endpoint
  - `page-agent/chat/completions/route.ts` - Chat completions

**`app/[static-pages]/`:**
- Purpose: Static informational pages
- Contains: About, Privacy, Terms, Features
- Structure: Each directory contains `page.tsx`

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Main application (client component, ~1183 lines)
- `app/layout.tsx` - Root layout with fonts and metadata
- `server.ts` - WebSocket server (port 7071)

**Configuration:**
- `src/config/site.ts` - Site metadata
- `src/config/categories.ts` - Category definitions
- `package.json` - Dependencies and scripts

**Core Logic:**
- `src/db/db.ts` - All database operations
- `src/context/AppContext.tsx` - State management
- `src/services/gemini.ts` - AI parsing

**Testing:**
- No test files detected in current codebase

## Naming Conventions

**Files:**
- PascalCase for React components: `HomeView.tsx`, `TransactionRow.tsx`
- camelCase for utilities and hooks: `useAudioRecorder.ts`, `analytics.ts`
- kebab-case for directories: `src/services/notifications/`

**Components:**
- Named exports preferred: `export const HomeView = ...`
- Default exports for dynamic imports: `export default function BottomTabBar(...)`

**Types/Interfaces:**
- PascalCase: `Transaction`, `DeviceIdentity`, `PairingRecord`

## Where to Add New Code

**New Feature Component:**
- Primary: `src/components/FeatureName.tsx`
- Import from: `import FeatureName from "@/src/components/FeatureName"`

**New Hook:**
- Location: `src/hooks/useFeatureName.ts`
- Pattern: Custom hook returning state or functions

**New Service/API:**
- Service: `src/services/featureName.ts`
- API Route: `app/api/featurename/route.ts`

**New Utility:**
- Pure functions: `src/utils/featureName.ts`
- Configuration: `src/config/featureName.ts`

**New Context:**
- File: `src/context/FeatureContext.tsx`
- Integrate in: `src/context/AppContext.tsx` (AppProvider composite)

## Special Directories

**`content/`:**
- Purpose: MDX blog posts
- Generated: No
- Committed: Yes

**`docs/`:**
- Purpose: Project documentation
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD workflow artifacts
- Generated: Yes (by GSD commands)
- Committed: Yes

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (npm install)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-04-12*
