# KharchaKitab Agent — Implementation Spec

A chat-based agent that:
- Fetches real data via tool calls (not hallucinated summaries)
- Reasons across multiple data sources before answering
- Can write to budgets with user confirmation

**Examples:**

| User says | Agent does |
|-----------|-----------|
| "Am I on track this month?" | Calls `get_budget` + `get_summary` in parallel → compares spend vs limits |
| "Where am I overspending vs last month?" | Calls `get_summary` for this_month + last_month → compares category deltas |
| "Set ₹3000 budget" | Calls `set_budget` immediately → UI shows confirmation card → client writes to localStorage on Confirm |
| "What subscriptions are due this week?" | Calls `get_recurring` with 7-day lookahead |

---

## 3. Architecture

```
Browser                           Server (API Route)
───────                           ──────────────────
1. User types message
2. buildSnapshot() — fresh each
   send (db caching makes it cheap)
3. POST {messages, snapshot}  ──→  4. Vercel AI SDK generateText():
                                     - model: gemini-3.1-flash-lite-preview
                                     - stopWhen: stepCountIs(5)
                                     - tools execute against snapshot
                                     - SDK handles the entire tool loop
5. Display reply             ←──  6. Return { reply, responseMessages, pendingAction? }
   Store messages in state             responseMessages = result.response.messages
                                       (includes tool call/result turns)
7. If pendingAction:
   - Show confirmation UI
   - On Yes: write to localStorage
     + dispatch StorageEvent (so BudgetCard re-renders)
```

**Why Vercel AI SDK?** It handles the tool-call loop (`stopWhen: stepCountIs(5)`), multi-turn history (including tool call/result turns), and type-safe tool definitions (Zod). We don't write a single `while` loop or manually assemble Gemini's `contents` array.

**Why still POST with snapshot?** IndexedDB is client-only. The server can't read it. The client serializes a snapshot before each send. Tool executors are pure functions that run server-side against the snapshot.

---

## 6. Files

### 6a. `src/lib/agent/types.ts`

```typescript
export interface DataSnapshot {
  expenses: Array<{
    id: string
    amount: number
    item: string
    category: string
    paymentMethod: string
    timestamp: number
  }>

  personalBudgets: Record<string, number>
  householdBudgets: Record<string, {
    amount: number
    updated_at: number
    set_by: string
  }>
  isHousehold: boolean
  deviceId: string

  recurring: Array<{
    _id: string
    item: string
    category: string
    amount: number
    recurring_frequency: string
    recurring_next_due_at: number
    recurring_reminder_days: number
  }>
}

export interface PendingWriteAction {
  tool: 'set_budget'
  params: {
    monthly_limit_inr: number
  }
}
```

### 6b. `src/lib/agent/snapshot.ts`

Client-side only. Import from existing code:

```typescript
import { fetchTransactions, getRecurringTemplates, getDeviceIdentity, getPairings } from '@/src/db/db'
```

**`buildSnapshot()` logic — no parameters, derives everything internally:**

1. **Expenses (4 months):** Single call: `fetchTransactions({ range: { start: 4MonthsAgo, end: now } })`. Map to slim shape `{ id, amount, item, category, paymentMethod, timestamp }`. (`fetchTransactions` already filters deleted by default.)

2. **Budgets — both stores:**
   - Personal: `JSON.parse(localStorage.getItem("kk_budgets") || "{}")` → `Record<"YYYY-MM", number>`
   - Household: `JSON.parse(localStorage.getItem("kk_budgets_household") || "{}")` → `Record<"YYYY-MM", { amount, updated_at, set_by }>`

3. **Device identity + household detection:** Call `getDeviceIdentity()` for `device_id`. Call `getPairings()` and set `isHousehold = pairings.length > 0`. Same logic as `HomeView.tsx:141`.

4. **Recurring:** Call `getRecurringTemplates()`. Map to the subset of fields the agent needs.

5. **All four calls run in parallel via `Promise.all`.**

**Snapshot is rebuilt before every send.** `fetchTransactions` in `db.ts` has built-in query caching — repeat calls are instant if no writes happened. Catches new expenses added while chat is open.

### 6c. `src/lib/agent/tools.ts`

5 tools defined as plain object literals with `satisfies Tool` and `zodSchema()` wrapped Zod schemas. Each tool's `execute` function receives the snapshot from the `createAgentTools` closure.

**Why not `tool()` helper?** In AI SDK v6 with Zod v4, the `tool()` function's overloads fail to infer types correctly — `execute` is typed as `undefined`. The workaround is plain objects with `inputSchema: zodSchema(z.object({...}))` and `satisfies Tool`.

```typescript
import { zodSchema } from 'ai'
import { z } from 'zod'
import type { DataSnapshot } from './types'
import type { Tool } from 'ai'

export function createAgentTools(snapshot: DataSnapshot) {
  let budgetRequested = false  // guard against double set_budget in one generateText call

  return {
    query_expenses: {
      description: 'Filter and return expense transactions. Works across last 4 months. Use date_from/date_to to scope. For totals, use get_summary instead.',
      inputSchema: zodSchema(z.object({
        category: z.string().optional(),
        item_contains: z.string().optional(),
        date_from: z.string().optional().describe('YYYY-MM-DD'),
        date_to: z.string().optional().describe('YYYY-MM-DD'),
        min_amount: z.number().optional(),
        max_amount: z.number().optional(),
      })),
      execute: async (input: {
        category?: string
        item_contains?: string
        date_from?: string
        date_to?: string
        min_amount?: number
        max_amount?: number
      }) => {
        let results = snapshot.expenses
        // ... filter by each input param
        const total = results.length
        return { expenses: results.slice(0, 50), total_count: total }
      },
    } satisfies Tool,

    get_summary: {
      description: 'Return aggregated spend totals. Warning: group_by "item" groups by raw freeform text — results may be fragmented. Prefer "category" for reliable aggregation.',
      inputSchema: zodSchema(z.object({
        group_by: z.enum(['category', 'item', 'week', 'day']),
        period: z.enum(['this_month', 'last_month', 'last_3_months', 'this_week']),
      })),
      execute: async ({ group_by, period }: { group_by: string; period: string }) => {
        // Filter snapshot.expenses by period, group by dimension
        // Return { groups: [{ name, total, count }], period_total }
      },
    } satisfies Tool,

    get_budget: {
      description: 'Return the monthly budget limit and current utilization. Budgets are a single monthly total, NOT per-category. Always call this when user asks about being "on track" or "over budget".',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        // BudgetCard fallback logic: isHousehold → household, else → personal
        // Join with total spend from snapshot.expenses for current month
        // Return { limit, spent, pct_used, remaining, source }
      },
    } satisfies Tool,

    get_recurring: {
      description: 'Return recurring expenses due in the next N days. Use for upcoming bills or subscriptions.',
      inputSchema: zodSchema(z.object({
        lookahead_days: z.number().default(7).describe('Max 30'),
      })),
      execute: async ({ lookahead_days }: { lookahead_days: number }) => {
        // Filter snapshot.recurring by recurring_next_due_at within window
        // Return array with { name, amount, due_date, category, frequency, overdue }
      },
    } satisfies Tool,

    set_budget: {
      description: 'Set the monthly budget. Call immediately once you have the amount — the UI will show a confirmation card to the user.',
      inputSchema: zodSchema(z.object({
        monthly_limit_inr: z.number(),
      })),
      execute: async ({ monthly_limit_inr }: { monthly_limit_inr: number }) => {
        if (budgetRequested) {
          return { status: 'already_requested' as const, message: 'Budget change already pending confirmation.' }
        }
        budgetRequested = true
        return { status: 'pending_confirmation' as const, monthly_limit_inr }
      },
    } satisfies Tool,
  }
}
```

> **Key:** Tools are created as a function that closes over `snapshot`. The route calls `createAgentTools(snapshot)` per request with the fresh snapshot from the client.

### 6d. `app/api/agent/route.ts`

```typescript
import { generateText, stepCountIs } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAgentTools } from '@/src/lib/agent/tools'
import type { DataSnapshot, PendingWriteAction } from '@/src/lib/agent/types'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,   // reuse existing key
})

const SYSTEM_PROMPT = `You are Kharchakitab's financial assistant. You help users understand their spending and manage their budget.

Rules:
- You have NO expense data until you call tools. Never answer with numbers you didn't get from a tool response.
- For questions about "on track", "over budget", "how much spent": call get_budget AND get_summary in the same turn
- For "upcoming bills" or "subscriptions": call get_recurring
- For specific transaction or item lookups: call query_expenses
- Budgets are a single monthly total (not per-category). When the user asks "am I on track", compare total spend across all categories against the one monthly budget limit.
- For WRITE actions (set_budget): call the tool immediately once you have the amount. Do NOT ask the user for verbal confirmation — the app will show a confirmation card in the UI. Just call set_budget and briefly tell the user what you're setting (e.g. "Setting your budget to ₹3,000").
- Speak in a friendly, direct tone. Use ₹ for amounts. Mix Hinglish naturally.
- Tools cover the current month + last 3 months. If user asks about older data, say it's outside the available window.`

export async function POST(request: Request) {
  console.time('agent:total-roundtrip')

  try {
    const { messages, snapshot }: { messages: any[]; snapshot: DataSnapshot } = await request.json()

    const tools = createAgentTools(snapshot)

    const result = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(5),       // v6: replaces maxSteps: 5
      temperature: 0,
    })

    // Check if any step produced a pending_confirmation
    // v6: tool results use `.output` not `.result`
    let pendingAction: PendingWriteAction | null = null
    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        const output = tr.output as Record<string, unknown> | undefined
        if (output && output.status === 'pending_confirmation') {
          pendingAction = {
            tool: 'set_budget',
            params: { monthly_limit_inr: output.monthly_limit_inr as number },
          }
        }
      }
    }

    console.log('agent:steps', result.steps.length, 'tools-called:', result.steps.flatMap(s => s.toolCalls.map(tc => tc.toolName)))
    console.timeEnd('agent:total-roundtrip')

    // v6: responseMessages lives at result.response.messages
    return Response.json({
      reply: result.text,
      responseMessages: result.response.messages,
      pendingAction,
    })
  } catch (error) {
    console.error('agent:error', error)
    console.timeEnd('agent:total-roundtrip')
    return Response.json(
      {
        reply: 'Something went wrong, try again.',
        responseMessages: [],
        pendingAction: null,
      },
      { status: 200 }  // 200 so client can still display the error message
    )
  }
}
```

> **That's the whole route.** No while loop. No manual `contents` array. No `functionCall`/`functionResponse` assembly. The SDK does all of it with `stopWhen: stepCountIs(5)`.

### 6e. `src/components/AgentChat.tsx`

Chat UI component. Does **NOT** use `useChat` from `ai/react` — that hook expects streaming and doesn't handle our `snapshot` + `pendingAction` flow well. Use plain `useState` + `fetch` instead.

**Props:** Component receives `open: boolean` and `onClose: () => void` — the parent (`page.tsx`) owns the open/close state.

**State:**

```typescript
const [messages, setMessages] = useState<any[]>([])
const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
const [pendingAction, setPendingAction] = useState<PendingWriteAction | null>(null)
const [loading, setLoading] = useState(false)
const [input, setInput] = useState("")
const lastSnapshotRef = useRef<DataSnapshot | null>(null)
```

**Send flow:**

```typescript
async function send(text: string) {
  if (!text.trim() || loading) return
  setLoading(true)
  setInput("")
  setDisplayMessages(prev => [...prev, { role: "user", text }])

  try {
    const snapshot = await buildSnapshot()
    lastSnapshotRef.current = snapshot

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: text }],
        snapshot,
      }),
    })
    const { reply, responseMessages, pendingAction: pa } = await res.json()

    setMessages(prev => [...prev, { role: "user", content: text }, ...responseMessages])
    setDisplayMessages(prev => [...prev, { role: "assistant", text: reply }])
    setPendingAction(pa)
  } catch {
    setDisplayMessages(prev => [...prev, { role: "assistant", text: "Something went wrong, try again." }])
  } finally {
    setLoading(false)
  }
}
```

> **History management is simple.** The SDK returns `result.response.messages` which contains the full chain (tool calls, tool results, final text) in its normalized format. Client appends them to `messages` and sends the full array next time. The SDK on the server reconstructs the Gemini-native `contents` from this — we never touch Gemini's format.

**Design:**
- CSS classes prefixed `kk-chat-*` (defined in `globals.css`)
- Slide-up panel with backdrop overlay, not fullscreen takeover
- Sparkles icon as agent avatar, lucide-react icons throughout
- Suggestion chips on empty state ("How much did I spend this month?", etc.)
- Animated message entrance via framer-motion
- Typing indicator: bouncing dots, not text

**Behavior:**
- Text input + send button
- User bubbles right (ember), assistant bubbles left (dark ink)
- Suggestion chips on empty state that trigger `send()` directly
- Typing indicator (bouncing dots) while `loading`
- Auto-focus input on open (with 300ms delay for animation)
- When `pendingAction` set: show confirmation card with Confirm/Decline buttons
- On Confirm — **budget write logic:**
  1. Determine which store based on `lastSnapshotRef.current.isHousehold`
  2. If household: read `kk_budgets_household`, set `{ amount, updated_at: Date.now(), set_by: snapshot.deviceId }` for current month key, write back
  3. If solo: read `kk_budgets`, set raw number for current month key, write back
  4. **Trigger BudgetCard re-render:** dispatch `window.dispatchEvent(new StorageEvent('storage', { key: isHousehold ? 'kk_budgets_household' : 'kk_budgets' }))` — triggers listener at `BudgetCard.tsx:160`
  5. Send "Budget updated successfully." as next message to agent
- On Decline: send "User declined the budget change." to continue conversation

**Session-only state.** Not persisted.

### 6f. Wire it into `app/page.tsx`

The `AgentFab` import is already there (commented out). Add `AgentChat` import and render it with `open`/`onClose` props. The parent owns the `isChatOpen` state (toggled by a button in the tab bar or elsewhere).

```typescript
import { AgentChat } from "@/src/components/AgentChat";
// ...
<AgentChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
```

---

## 7. What NOT to Do

- Don't touch `src/services/gemini.ts`, `src/services/sarvam.ts`, or `src/db/db.ts`
- Don't create new IndexedDB write functions — budgets are in **localStorage**, not IndexedDB
- Don't use a Gemini model fallback chain — hardcode one model
- Don't use `useChat` from `ai/react` — it doesn't support sending `snapshot` with each request or the `pendingAction` confirmation flow
- Don't send the full DB — only the snapshot
- Don't use LangChain/LlamaIndex — Vercel AI SDK only
- Don't persist chat history — React state only
- Don't add a `create_alert` tool — there's no alert system to write to
- Don't use `tool()` helper with Zod v4 — it breaks TypeScript overloads; use `{ inputSchema: zodSchema(...) } satisfies Tool` instead
- Don't use `maxSteps` — removed in AI SDK v6; use `stopWhen: stepCountIs(N)`
- Don't access `result.result` on tool results — the field is `output` in v6

---

## 8. Instrumentation

```typescript
// In route.ts
console.time('agent:total-roundtrip')
// ... generateText()
console.log('agent:steps', result.steps.length, 'tools-called:', result.steps.flatMap(s => s.toolCalls.map(tc => tc.toolName)))
console.timeEnd('agent:total-roundtrip')

// In snapshot.ts
console.time('agent:buildSnapshot')
// ... buildSnapshot()
console.timeEnd('agent:buildSnapshot')
```

> The SDK's `steps` array gives you full visibility: each step's tool calls, tool results, and text responses. No manual logging of individual iterations needed.

---

## 9. Done Criteria

1. "Am I on track this month?" → specific answer with real budget numbers and spend
2. "Biggest spend category this month vs last month?" → comparison with real deltas
3. "Set budget to 3000" → confirmation flow → budget updates in correct localStorage key (personal or household) → `StorageEvent` dispatched → `BudgetCard` re-renders with new amount
4. Parallel tool calls working (get_budget + get_summary in same iteration)
5. Iteration cap (5) enforced with fallback message (`stopWhen: stepCountIs(5)`)
6. No existing features broken

---

## 10. CPO Summary — KharchaKitab AI Agent

### What it is

A conversational AI assistant embedded in KharchaKitab that lets users query their real expense data and manage budgets using natural language — in English, Hindi, or Hinglish. It replaces dashboard-digging with a single chat interface.

### Why it matters

Users currently have to manually cross-reference the summary tab, budget card, and recurring view to answer basic financial questions. The agent collapses all of that into one conversation. It also unlocks a new interaction model: users who find the app's UI intimidating (especially non-tech-savvy household members) can just ask "am I on track?" and get a grounded answer.

### User experience

**Entry point:** Sparkles icon button in the app header. Tap to open.

**Chat panel:**
- Mobile: slides up as a bottom sheet (85% screen height) with backdrop blur
- Desktop: floating 400×600px panel anchored bottom-right
- Spring animation on open/close, auto-focuses the input field

**Empty state:** Greeting ("Namaste! 🙏") with 4 suggestion chips in a 2×2 grid:
- "How much did I spend this month?"
- "Am I within my budget?"
- "What are my top expenses?"
- "Set my monthly budget"

Tapping a chip fires the query immediately — zero-friction first interaction.

**Message design:**
- User messages: ember gradient bubbles (right-aligned)
- Agent messages: dark ink bubbles (left-aligned) with a small Sparkles avatar
- Animated entrance for each message (fade + slide up)
- Typing indicator: 3 bouncing dots while agent thinks

**Budget confirmation flow:** When user provides a budget amount, the agent calls `set_budget` immediately — no verbal "are you sure?" step. The UI shows a confirmation card with Confirm/Decline buttons inline in the chat. Only on explicit Confirm tap does the budget actually update. The budget card elsewhere in the app re-renders immediately via StorageEvent.

**Session-only:** Chat history lives in React state. Closing and reopening starts fresh. No server-side persistence.

### What the agent can do

| Capability | Tool | Example |
|-----------|------|---------|
| **Search transactions** | `query_expenses` | "Show me all Zomato orders this month" → filters by item substring, date range, category, amount range. Returns up to 50 matching transactions. |
| **Spending summaries** | `get_summary` | "Where am I spending most?" → aggregates by category, item, week, or day across this month, last month, last 3 months, or this week. Returns ranked groups with totals. |
| **Budget status** | `get_budget` | "Am I on track?" → returns monthly limit, amount spent, % used, remaining. Handles household/personal fallback automatically. |
| **Upcoming bills** | `get_recurring` | "What's due this week?" → filters recurring templates by due date within N-day lookahead (max 30). Flags overdue items. |
| **Set budget** | `set_budget` | "Set ₹5000 budget" → write action with mandatory confirmation. Updates the correct store (personal or household) and triggers live UI refresh. |

**Multi-tool reasoning:** The agent can call multiple tools in a single turn. For "am I on track?", it calls `get_budget` + `get_summary` in parallel, then compares total spend across all categories against the monthly limit — exactly what a user would have to do manually by switching between views.

**Data window:** Last 4 months of transactions. If user asks about older data, the agent says it's outside the available window (no hallucination).

### Guardrails

| Guardrail | How it works |
|-----------|-------------|
| **No hallucinated numbers** | System prompt: "You have NO expense data until you call tools. Never answer with numbers you didn't get from a tool response." |
| **Write confirmation** | `set_budget` returns `pending_confirmation` — the actual localStorage write only happens after explicit user tap on the Confirm button in the UI. |
| **Double-write guard** | `budgetRequested` flag prevents the model from calling `set_budget` twice in the same request (across multiple tool-call steps). |
| **Step cap** | Max 5 tool-call rounds per user message (`stopWhen: stepCountIs(5)`). Prevents infinite loops. |
| **Temperature 0** | Deterministic output — no creative drift on financial data. |
| **Snapshot isolation** | Agent has no direct DB access. It operates on a read-only snapshot serialized by the client. Cannot write to IndexedDB or read anything outside the snapshot. |

### Technical architecture

```
┌──────────────────────────────────┐
│  Browser (AgentChat.tsx)         │
│                                  │
│  1. User sends message           │
│  2. buildSnapshot()              │
│     ├─ fetchTransactions (4mo)   │
│     ├─ localStorage budgets      │
│     ├─ getRecurringTemplates     │
│     └─ getDeviceIdentity/Pairs  │
│  3. POST /api/agent              │
│     {messages, snapshot}         │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Server (route.ts)               │
│                                  │
│  4. createAgentTools(snapshot)   │
│  5. generateText()               │
│     ├─ model: gemini-3.1-flash  │
│     ├─ tools run against snap   │
│     ├─ up to 5 tool rounds      │
│     └─ SDK handles tool loop    │
│  6. Return {reply,               │
│     responseMessages,            │
│     pendingAction?}              │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Browser (AgentChat.tsx)         │
│                                  │
│  7. Display reply                │
│  8. If pendingAction:            │
│     Show confirm card            │
│     On Yes → localStorage write  │
│     + StorageEvent dispatch      │
│     → BudgetCard re-renders      │
└──────────────────────────────────┘
```

**Key design decisions:**
- **Snapshot-per-request:** IndexedDB is client-only, so the client serializes a fresh snapshot before each message. `fetchTransactions` has built-in query caching, making repeat snapshots near-instant.
- **No streaming:** Non-streaming `generateText` is simpler and sufficient — agent responses are short (a few sentences + numbers). Avoids partial tool-call rendering complexity.
- **Household awareness:** The agent automatically detects whether the user is in a paired household and uses the correct budget store with the correct fallback logic (household → personal).
- **No separate backend state:** All conversation history is in React state. The server is stateless — every request includes the full message history + fresh snapshot.

### What it doesn't do (intentional scope limits)

- **No transaction creation** — agent is read-only for expenses (write-only for budgets)
- **No per-category budgets** — budget is a single monthly total, matching the existing BudgetCard model
- **No alerts/reminders** — no alert system exists to write to
- **No data older than 4 months** — agent transparently says so instead of guessing
- **No persistent chat** — session-only, starts fresh each time

### Files & footprint

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/agent/types.ts` | DataSnapshot + PendingWriteAction types | ~36 |
| `src/lib/agent/snapshot.ts` | buildSnapshot() — client-side data collection | ~56 |
| `src/lib/agent/tools.ts` | 5 tools with full filter/aggregation logic | ~241 |
| `app/api/agent/route.ts` | POST handler, system prompt, Gemini orchestration | ~73 |
| `src/components/AgentChat.tsx` | Full chat UI component | ~294 |
| `app/globals.css` | ~500 lines of `kk-chat-*` CSS classes | (appended) |
| `app/page.tsx` | 2 lines changed (import + render) | (modified) |

**Dependencies added:** `ai` (Vercel AI SDK), `@ai-sdk/google` — both already in package.json. Zero new runtime dependencies.

**No existing code modified:** `db.ts`, `gemini.ts`, `sarvam.ts`, `BudgetCard.tsx` — all untouched. The agent reads the same data through existing functions and triggers BudgetCard refresh via the standard StorageEvent listener that was already there.
