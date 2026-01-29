import type { Frequency } from "@/src/config/recurring";

export interface Transaction {
  id: string;
  amount: number;
  item: string;
  category: string;
  paymentMethod: "cash" | "upi" | "card" | "unknown";
  timestamp: number;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: "cash" | "upi" | "card" | "unknown";
  frequency: Frequency;
  startDate: number;
  nextDue: number;
  endDate?: number;
  templateId?: string;
  reminderDays?: number;
  isActive: boolean;
  lastPaidDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  isRecording: boolean;
}
