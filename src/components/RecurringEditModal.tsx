"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/src/config/categories";
import { PAYMENT_OPTIONS, type PaymentKey } from "@/src/config/payments";
import {
  FREQUENCY_OPTIONS,
  calculateNextDueDate,
  type Frequency,
  type RecurringTemplate,
} from "@/src/config/recurring";
import { useEscapeKey } from "@/src/hooks/useEscapeKey";
import { toDateInputValue } from "@/src/utils/dates";
import { normalizeAmount } from "@/src/utils/money";
import type { RecurringExpense } from "@/src/types";

interface RecurringEditModalProps {
  isOpen: boolean;
  mode: "new" | "edit";
  template?: RecurringTemplate | null;
  expense?: RecurringExpense | null;
  onClose: () => void;
  onSave: (data: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt">) => void;
}

const sanitizeAmountInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [intPart, decimalPart = ""] = cleaned.split(".");
  const trimmedDecimals = decimalPart.slice(0, 2);
  return trimmedDecimals.length > 0 ? `${intPart}.${trimmedDecimals}` : intPart;
};

export const RecurringEditModal = ({
  isOpen,
  mode,
  template,
  expense,
  onClose,
  onSave,
}: RecurringEditModalProps) => {
  const [name, setName] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [category, setCategory] = useState("Bills");
  const [paymentMethod, setPaymentMethod] = useState<PaymentKey>("upi");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(toDateInputValue(Date.now()));
  const [reminderDays, setReminderDays] = useState(3);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && expense) {
        setName(expense.name);
        setAmountValue(expense.amount.toString());
        setCategory(expense.category);
        setPaymentMethod(expense.paymentMethod);
        setFrequency(expense.frequency);
        setStartDate(toDateInputValue(expense.startDate));
        setReminderDays(expense.reminderDays ?? 3);
        setNotes(expense.notes ?? "");
      } else if (template) {
        setName(template.name);
        setAmountValue(template.suggestedAmount?.toString() ?? "");
        setCategory(template.category);
        setPaymentMethod("upi");
        setFrequency(template.suggestedFrequency);
        setStartDate(toDateInputValue(Date.now()));
        setReminderDays(3);
        setNotes("");
      } else {
        setName("");
        setAmountValue("");
        setCategory("Bills");
        setPaymentMethod("upi");
        setFrequency("monthly");
        setStartDate(toDateInputValue(Date.now()));
        setReminderDays(3);
        setNotes("");
      }
    }
  }, [isOpen, mode, template, expense]);

  useEscapeKey(isOpen, onClose);

  const handleSave = () => {
    const amount = normalizeAmount(Number(amountValue || 0));
    if (amount <= 0 || !name.trim()) return;

    const startTimestamp = new Date(startDate).getTime();
    const nextDue =
      mode === "edit" && expense
        ? expense.nextDue
        : calculateNextDueDate(startTimestamp, frequency);

    onSave({
      name: name.trim(),
      amount,
      category,
      paymentMethod,
      frequency,
      startDate: startTimestamp,
      nextDue,
      templateId: template?.id,
      reminderDays,
      isActive: true,
      notes: notes.trim() || undefined,
    });
  };

  const isValid = name.trim().length > 0 && Number(amountValue || 0) > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--kk-void)]/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="w-full max-w-md overflow-hidden kk-radius-top-xl bg-white kk-shadow-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white">
              <div className="h-1 w-10 rounded-full bg-[var(--kk-smoke-heavy)]" />
            </div>

            <div className="px-5 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="mt-1 text-xl font-semibold font-[family:var(--font-display)]">
                    {mode === "new" ? "Add Recurring Expense" : "Edit Recurring"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="kk-icon-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Name Input */}
              <div className="mt-5">
                <div className="kk-label">Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Netflix, Rent, Gym"
                  className="kk-input mt-2"
                />
              </div>

              {/* Amount Input */}
              <div className="mt-4 kk-radius-md border border-[var(--kk-smoke)] bg-[var(--kk-cream)] p-4">
                <div className="kk-label">Amount</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-3xl font-bold text-[var(--kk-ember)]">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amountValue}
                    onChange={(e) => setAmountValue(sanitizeAmountInput(e.target.value))}
                    className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none font-[family:var(--font-mono)] placeholder:text-[var(--kk-ash)]"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Frequency Pills */}
              <div className="mt-4">
                <div className="kk-label flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Frequency
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((option) => {
                    const isActive = frequency === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFrequency(option.key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? "border-[var(--kk-ember)] bg-[var(--kk-ember)] text-white"
                            : "border-[var(--kk-smoke-heavy)] text-[var(--kk-ink)] hover:border-[var(--kk-ember)]"
                        }`}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Pills */}
              <div className="mt-4">
                <div className="kk-label">Category</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = category === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setCategory(option.key)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? "border-[var(--kk-ember)] bg-[var(--kk-ember)] text-white"
                            : "border-[var(--kk-smoke-heavy)] text-[var(--kk-ink)] hover:border-[var(--kk-ember)]"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {option.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment & Start Date Row */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="kk-label">Payment Method</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = paymentMethod === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setPaymentMethod(option.key)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            isActive
                              ? "border-[var(--kk-ember)] bg-[var(--kk-ember)] text-white"
                              : "border-[var(--kk-smoke-heavy)] text-[var(--kk-ink)] hover:border-[var(--kk-ember)]"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="kk-label flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {mode === "new" ? "First Due Date" : "Start Date"}
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="kk-input mt-2 text-sm"
                  />
                </div>
              </div>

              {/* Reminder Days */}
              <div className="mt-4">
                <div className="kk-label">Remind me before</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 3, 5, 7].map((days) => {
                    const isActive = reminderDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setReminderDays(days)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? "border-[var(--kk-ember)] bg-[var(--kk-ember)] text-white"
                            : "border-[var(--kk-smoke-heavy)] text-[var(--kk-ink)] hover:border-[var(--kk-ember)]"
                        }`}
                      >
                        {days === 1 ? "1 day" : `${days} days`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <div className="kk-label">Notes (optional)</div>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  className="kk-input mt-2"
                />
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className="kk-btn-primary mt-5 w-full py-3.5 text-base"
              >
                {mode === "new" ? "Add Recurring Expense" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
