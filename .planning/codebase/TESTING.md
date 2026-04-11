# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Status:** Not currently configured

**Findings:**
- No testing framework detected in `package.json`
- No test scripts in npm scripts
- No test configuration files (jest.config.*, vitest.config.*, etc.)
- No test files found (no `*.test.*` or `*.spec.*` files)

**Current State:**
The project currently lacks automated testing infrastructure. All testing is performed manually.

**Recommendation:**
If adding tests, the recommended approach would be:

**Option A: Vitest (recommended for Next.js)**
```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

**Option B: Jest**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

## Test File Organization

**Current State:** Not applicable (no tests exist)

**Recommended Structure (if tests were added):**
```
src/
├── __tests__/                    # Shared test utilities/fixtures
│   ├── fixtures/
│   │   └── transactions.ts
│   └── setup.ts
├── components/
│   ├── HomeView.tsx
│   └── HomeView.test.tsx         # Co-located with component
├── utils/
│   ├── money.ts
│   └── money.test.ts
└── services/
    ├── gemini.ts
    └── gemini.test.ts
```

## Test File Naming

**Convention:** `{filename}.test.{ext}` or `{filename}.spec.{ext}`

**Examples:**
- `HomeView.test.tsx` - React component tests
- `money.test.ts` - Utility function tests
- `db.test.ts` - Database function tests

## Types of Tests

**Current:** None implemented

**Recommended Test Strategy:**

### Unit Tests
- Pure utility functions: `formatCurrency()`, `normalizeAmount()`, `isProcessingTransaction()`
- Data transformation: CSV parsing, date utilities
- Hooks behavior (with React Testing Library)

### Integration Tests
- Database operations (requires mock or test IndexedDB)
- API routes (requires mock fetch or MSW)

### E2E Tests
- Playwright for critical user flows:
  - Adding a transaction via voice
  - Adding a transaction via text
  - Adding a transaction via receipt
  - Viewing transaction history
  - Deleting a transaction

## Test Utilities and Patterns

**Recommended (not currently in use):**

**React Testing Library:**
```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HomeView } from "@/src/components/HomeView";

describe("HomeView", () => {
  it("renders loading skeleton while fetching", () => {
    render(<HomeView />);
    expect(screen.getByClass("kk-card animate-pulse")).toBeInTheDocument();
  });
});
```

**Mocking Patterns:**
```typescript
// Mock IndexedDB
const mockTransaction = { id: "123", amount: 100, item: "Coffee", ... };
global.indexedDB = {
  open: jest.fn(() => ({
    then: jest.fn((cb) => cb({
      result: {
        transactions: {
          getAll: jest.fn(() => Promise.resolve([mockTransaction])),
        },
      },
    })),
  })),
};

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: mockTransaction }),
  })
) as jest.Mock;
```

**Test Fixtures:**
```typescript
// src/__tests__/fixtures/transactions.ts
import type { Transaction } from "@/src/types";

export const mockTransaction: Transaction = {
  id: "tx-123",
  amount: 250,
  item: "Coffee",
  category: "Food",
  paymentMethod: "upi",
  timestamp: Date.now(),
};

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...mockTransaction,
  ...overrides,
});
```

## CI/CD Setup

**Status:** Not detected

**Findings:**
- No `.github/workflows/` directory
- No GitHub Actions workflows
- No CI configuration files

**Deployment:**
The project uses Vercel for hosting (inferred from `.vercel` in `.gitignore` and `vercel` in `.gitignore`).

**For CI/CD Implementation:**
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
```

## Code Quality Tools

**Currently Configured:**

**ESLint:**
- Config: `eslint.config.mjs`
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Run with: `npm run lint`

**Knip (Unused Code Detection):**
- Config: `knip.json`
- Run with: `npm run knip`
- Purpose: Find unused dependencies, files, and exports

**TypeScript:**
- Strict mode enabled
- No implicit any, no unused variables/parameters

## Manual Testing Checklist

Based on codebase analysis, key areas requiring manual verification:

**Core Functionality:**
- [ ] Voice input for adding transactions
- [ ] Text input for adding transactions
- [ ] Receipt upload and parsing
- [ ] Transaction CRUD (create, read, update, delete)
- [ ] Monthly navigation and filtering
- [ ] Budget card display

**Sync Features:**
- [ ] Device pairing flow
- [ ] Transaction sync between devices
- [ ] Conflict resolution
- [ ] Recurring transactions

**UI/UX:**
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Animations and transitions
- [ ] Loading states and skeletons
- [ ] Error handling and toast messages

**Performance:**
- [ ] Initial load time
- [ ] Scroll performance
- [ ] Memory usage with large transaction lists
- [ ] IndexedDB query performance

## Adding Tests to This Project

**Steps to add testing infrastructure:**

1. Install dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

2. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
});
```

3. Add scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

4. Create test setup file at `src/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

---

*Testing analysis: 2026-04-12*
