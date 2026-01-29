import { openDB, type DBSchema, type IDBPIndex } from "idb";
import type { Transaction, RecurringExpense } from "@/src/types";
import { normalizeAmount } from "@/src/utils/money";

interface QuickLogDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      "by-date": number;
    };
  };
  recurring: {
    key: string;
    value: RecurringExpense;
    indexes: {
      "by-next-due": number;
      "by-active": number;
    };
  };
}

const DB_NAME = "QuickLogDB";
const DB_VERSION = 2;
const queryCache = new Map<string, Transaction[]>();
const recurringCache = new Map<string, RecurringExpense[]>();

const getDb = () =>
  openDB<QuickLogDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains("transactions")) {
        const store = db.createObjectStore("transactions", { keyPath: "id" });
        store.createIndex("by-date", "timestamp");
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("recurring")) {
          const recurringStore = db.createObjectStore("recurring", { keyPath: "id" });
          recurringStore.createIndex("by-next-due", "nextDue");
          recurringStore.createIndex("by-active", "isActive");
        }
      }
    },
  });

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const collectTransactions = async (
  index: IDBPIndex<QuickLogDB, ["transactions"], "transactions", "by-date">,
  range: IDBKeyRange | null | undefined,
  limit?: number
): Promise<Transaction[]> => {
  const results: Transaction[] = [];

  for await (const cursor of index.iterate(range, "prev")) {
    results.push(cursor.value);
    if (typeof limit === "number" && results.length >= limit) break;
  }

  return results;
};

const cacheKeyFor = (parts: Array<string | number | undefined | null>) =>
  parts.map((part) => String(part ?? "")).join("|");

const getCached = (key: string) => queryCache.get(key);
const setCached = (key: string, value: Transaction[]) => {
  queryCache.set(key, value);
  return value;
};

const clearCache = () => {
  queryCache.clear();
};

export const addTransaction = async (tx: Transaction): Promise<string> => {
  const db = await getDb();
  const transaction = {
    ...tx,
    id: tx.id || generateId(),
    amount: normalizeAmount(tx.amount),
  };
  await db.put("transactions", transaction);
  clearCache();
  return transaction.id;
};

export const getRecentTransactions = async (
  limit: number
): Promise<Transaction[]> => {
  const cacheKey = cacheKeyFor(["recent", limit]);
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const db = await getDb();
  const index = db.transaction("transactions").store.index("by-date");
  const results = await collectTransactions(index, null, limit);
  return setCached(cacheKey, results);
};

export const getTransactionsInRange = async (
  start: number,
  end: number,
  limit?: number,
  before?: number
): Promise<Transaction[]> => {
  const cacheKey = cacheKeyFor(["range", start, end, limit, before]);
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const db = await getDb();
  const index = db.transaction("transactions").store.index("by-date");
  const upperBound =
    typeof before === "number" ? Math.min(end, before - 1) : end;
  if (upperBound < start) return [];
  const range = IDBKeyRange.bound(start, upperBound);
  const results = await collectTransactions(index, range, limit);
  return setCached(cacheKey, results);
};

export const updateTransaction = async (
  id: string,
  updates: Partial<Transaction>
): Promise<void> => {
  const db = await getDb();
  const existing = await db.get("transactions", id);
  if (!existing) return;
  const next =
    typeof updates.amount === "number"
      ? { ...existing, ...updates, amount: normalizeAmount(updates.amount) }
      : { ...existing, ...updates };
  await db.put("transactions", next);
  clearCache();
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete("transactions", id);
  clearCache();
};

// =====================
// Recurring Expenses
// =====================

const clearRecurringCache = () => {
  recurringCache.clear();
};

export const addRecurringExpense = async (
  expense: RecurringExpense
): Promise<string> => {
  const db = await getDb();
  const now = Date.now();
  const recurringExpense: RecurringExpense = {
    ...expense,
    id: expense.id || generateId(),
    amount: normalizeAmount(expense.amount),
    createdAt: expense.createdAt || now,
    updatedAt: now,
  };
  await db.put("recurring", recurringExpense);
  clearRecurringCache();
  return recurringExpense.id;
};

export const getRecurringExpense = async (
  id: string
): Promise<RecurringExpense | undefined> => {
  const db = await getDb();
  return db.get("recurring", id);
};

export const getAllRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  const cacheKey = "all-recurring";
  const cached = recurringCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  const results = await db.getAll("recurring");
  recurringCache.set(cacheKey, results);
  return results;
};

export const getActiveRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  const cacheKey = "active-recurring";
  const cached = recurringCache.get(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  const all = await db.getAll("recurring");
  const active = all.filter((r) => r.isActive);
  recurringCache.set(cacheKey, active);
  return active;
};

export const getRecurringExpensesDueSoon = async (
  withinDays = 5
): Promise<RecurringExpense[]> => {
  const now = Date.now();
  const cutoff = now + withinDays * 24 * 60 * 60 * 1000;

  const db = await getDb();
  const index = db.transaction("recurring").store.index("by-next-due");
  const range = IDBKeyRange.bound(0, cutoff);

  const results: RecurringExpense[] = [];
  for await (const cursor of index.iterate(range)) {
    if (cursor.value.isActive) {
      results.push(cursor.value);
    }
  }

  return results.sort((a, b) => a.nextDue - b.nextDue);
};

export const updateRecurringExpense = async (
  id: string,
  updates: Partial<RecurringExpense>
): Promise<void> => {
  const db = await getDb();
  const existing = await db.get("recurring", id);
  if (!existing) return;

  const updated: RecurringExpense = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  if (typeof updates.amount === "number") {
    updated.amount = normalizeAmount(updates.amount);
  }

  await db.put("recurring", updated);
  clearRecurringCache();
};

export const deleteRecurringExpense = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete("recurring", id);
  clearRecurringCache();
};

export const markRecurringAsPaid = async (
  id: string,
  paidDate: number = Date.now()
): Promise<Transaction | null> => {
  const db = await getDb();
  const recurring = await db.get("recurring", id);
  if (!recurring) return null;

  // Create a transaction for the payment
  const transaction: Transaction = {
    id: generateId(),
    amount: recurring.amount,
    item: recurring.name,
    category: recurring.category,
    paymentMethod: recurring.paymentMethod,
    timestamp: paidDate,
  };

  await db.put("transactions", transaction);

  // Update the recurring expense with next due date
  const { calculateNextDueDate } = await import("@/src/config/recurring");
  const nextDue = calculateNextDueDate(paidDate, recurring.frequency);

  await db.put("recurring", {
    ...recurring,
    lastPaidDate: paidDate,
    nextDue,
    updatedAt: Date.now(),
  });

  clearCache();
  clearRecurringCache();

  return transaction;
};
