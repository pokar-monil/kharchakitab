# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- PascalCase for React components: `HomeView.tsx`, `TransactionRow.tsx`
- camelCase for hooks: `useMannKiBaat.ts`, `useCurrency.ts`
- camelCase for utilities: `transactions.ts`, `money.ts`, `error.ts`
- kebab-case for directories: `src/services/`, `src/hooks/`
- Lowercase for config files: `tsconfig.json`, `eslint.config.mjs`

**Functions:**
- camelCase for functions and methods: `formatCurrency()`, `addTransaction()`
- PascalCase for React components: `HomeView`, `TransactionRow`
- kebab-case for event handlers: `onEdit`, `onDelete`, `handleDelete`
- `use` prefix for hooks: `useCurrency()`, `useMannKiBaat()`
- `get` prefix for data fetchers: `getDeviceIdentity()`, `getPairings()`
- `is`/`has` prefixes for boolean checks: `isProcessingTransaction()`, `isTransactionShared()`

**Variables:**
- camelCase for variables and constants: `currencySymbol`, `selectedMonthOffset`
- SCREAMING_SNAKE_CASE for module-level constants: `DB_NAME`, `DB_VERSION`
- Descriptive names preferred: `hasPairingGlobally`, `mobileSheetTxId`

**Types:**
- PascalCase for interfaces: `Transaction`, `DeviceIdentity`, `SyncState`
- PascalCase for type aliases: `CurrencyCode`, `CategoryKey`

## TypeScript Style

**Configuration (tsconfig.json):**
- `strict: true` - Full strict mode enabled
- `noUnusedLocals: true` - Catch unused variables
- `noUnusedParameters: true` - Catch unused function parameters
- `moduleResolution: "bundler"` - Modern module resolution
- `isolatedModules: true` - Required for transpilation safety

**Import Types:**
```typescript
// Use type-only imports for type-only imports
import type { Transaction } from "@/src/types";
import type { Frequency } from "@/src/config/recurring";

// Use inline type imports when importing types and values from same module
import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
```

**Null/Undefined:**
- Explicit optional properties: `owner_device_id?: string`
- Null for nullable fields: `deleted_at?: number | null`
- Avoid `any` type - use `unknown` and type guards

## Import Organization

**Order (enforced by eslint-config-next):**
1. React and framework imports
2. Third-party libraries (lucide-react, framer-motion, etc.)
3. Internal imports (db, services, utils)
4. Path alias imports (`@/src/...`)

**Example from `HomeView.tsx`:**
```typescript
// React
import React, { startTransition, useCallback, useEffect, useMemo, useState } from "react";

// Third-party
import { motion } from "framer-motion";
import { ArrowDown, Sparkles, Users } from "lucide-react";

// Internal - db
import {
  deleteTransaction,
  fetchTransactions,
  // ...
} from "@/src/db/db";

// Internal - types
import type { Transaction } from "@/src/types";

// Internal - utils
import { getRangeForFilter } from "@/src/utils/dates";

// Internal - components
import { TransactionActionSheet } from "@/src/components/TransactionActionSheet";

// Internal - hooks
import { useCurrency } from "@/src/hooks/useCurrency";

// Internal - config
import { CATEGORY_ICON_MAP } from "@/src/config/categories";

// Internal - services
import { syncEvents } from "@/src/services/sync/syncEvents";

// Internal - utils (utility functions)
import { isProcessingTransaction } from "@/src/utils/transactions";
```

## Component Patterns

**Client Components:**
```typescript
"use client";

import React from "react";

export const ComponentName = React.memo((props: ComponentProps) => {
  // ...
});

ComponentName.displayName = "ComponentName";
```

**Key Patterns:**
- Use `"use client"` directive for all client-side components
- Wrap components in `React.memo()` for performance optimization
- Always set `displayName` for memoized components
- Use `startTransition()` for non-urgent state updates: `startTransition(() => { setState(...) })`
- Use `useCallback()` for stable function references
- Use `useMemo()` for expensive computations
- Use `React.useRef()` for mutable values that don't trigger re-renders

**Error Handling:**
```typescript
// In async functions
try {
  // async operation
} catch {
  // handle error - silently if recoverable
  reloadTransactions();
}

// Use Error messages from utils/error.ts
import { ERROR_MESSAGES } from "@/src/utils/error";

throw new Error(ERROR_MESSAGES.geminiFlashRequestFailed);
```

## Styling Conventions

**CSS Variables (Ink & Ember Design System):**
- Prefix all design tokens with `kk-`: `--kk-ember`, `--kk-paper`, `--kk-ink`
- Define in `app/globals.css` under `:root`

**Color Palette:**
```css
:root {
  /* Core */
  --kk-void: #0a0a0a;
  --kk-ink: #1a1a1a;
  --kk-paper: #faf8f5;
  --kk-cream: #f5f2ed;
  
  /* Ember Spectrum */
  --kk-ember: #ff6b35;
  --kk-saffron: #f7c948;
  
  /* Semantic Colors */
  --kk-sage: #2d8d60;      /* Success */
  --kk-ocean: #3e63dd;     /* Info */
  --kk-danger: #e5484d;    /* Error */
}
```

**Tailwind CSS:**
- Use Tailwind v4 with `@import "tailwindcss"` in globals.css
- Combine with CSS variables for custom values
- Use `@apply` sparingly - prefer direct utility classes

**Animation Patterns:**
```typescript
import { motion } from "framer-motion";

// Basic fade-up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
>
  {/* content */}
</motion.div>
```

**Performance Animations (GPU-composited):**
```css
/* Use transform instead of width/opacity/box-shadow for smooth animations */
.will-change-transform {
  will-change: transform;
  transition: transform var(--kk-duration-fast) var(--kk-ease-out);
}

/* Use inline style for dynamic values */
<div style={{ width: `${percentage}%` }} />
```

**Card Component Pattern:**
```css
.kk-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--kk-smoke);
  border-radius: var(--kk-radius-lg);
  box-shadow: var(--kk-shadow-sm);
  transition: transform var(--kk-duration-normal) var(--kk-ease-out);
  will-change: transform;
}
```

## Comment/Documentation Conventions

**JSDoc for Functions:**
```typescript
/**
 * Parse a single CSV line respecting double-quoted fields.
 */
function parseCsvLine(line: string): string[] {
  // ...
}
```

**Comments for Complex Logic:**
```typescript
// F: Normalize – strip `before` when it has no effect on a ranged query
const effectiveBefore = ...

// RACE-1: Capture generation before async work starts
const gen = cacheGeneration;

// LEAK-1: Evict oldest entry when cache is full
if (queryCache.size >= MAX_CACHE_ENTRIES) { ... }
```

**Performance Notes:**
```typescript
// PERF-RERENDER: Updated to use split CurrencyContext...
// PERF-ANIMATION: Using transform instead of box-shadow change...
```

**File Header Comments:**
```typescript
// ═══════════════════════════════════════════════════════════════════════════
// Section Title — Description
// ═══════════════════════════════════════════════════════════════════════════
```

## API Route Patterns

**Route Handler Structure:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ExpenseArraySchema } from "@/src/utils/schemas";

export async function POST(request: NextRequest) {
  // Parse body
  const body = (await request.json()) as { text?: string };
  
  // Validate input
  if (!body.text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }
  
  // Process and return
  // ...
  
  return NextResponse.json({ data: result });
}
```

**Error Response Format:**
```typescript
// Success
return NextResponse.json({ data: validatedResult });

// Client error
return NextResponse.json({ error: "Descriptive error message." }, { status: 400 });

// Server error
return NextResponse.json({ error: "Server error message." }, { status: 502 });
```

## Database Patterns (IndexedDB via idb)

**Schema Definition:**
```typescript
interface QuickLogDB {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      "by-date": number;
      "by-owner": string;
    };
  };
}

export const DB_NAME = "QuickLogDB";
export const DB_VERSION = 5;
```

**CRUD Functions:**
```typescript
export const addTransaction = async (tx: Transaction): Promise<string> => { ... };
export const fetchTransactions = async (options: FetchOptions): Promise<Transaction[]> => { ... };
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => { ... };
export const deleteTransaction = async (id: string): Promise<void> => { ... };
```

---

*Convention analysis: 2026-04-12*
