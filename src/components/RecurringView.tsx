"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  Pause,
  Play,
  Clock,
} from "lucide-react";
import {
  RECURRING_TEMPLATES,
  TEMPLATE_GROUPS,
  FREQUENCY_LABEL_MAP,
  isDueSoon,
  isOverdue,
  type TemplateGroup,
  type RecurringTemplate,
} from "@/src/config/recurring";
import { CATEGORY_ICON_MAP, type CategoryKey } from "@/src/config/categories";
import {
  getActiveRecurringExpenses,
  getRecurringExpensesDueSoon,
  deleteRecurringExpense,
  updateRecurringExpense,
  markRecurringAsPaid,
} from "@/src/db/db";
import type { RecurringExpense, Transaction } from "@/src/types";
import { formatCurrency } from "@/src/utils/money";

interface RecurringViewProps {
  refreshKey: number;
  onAddRecurring: (template?: RecurringTemplate) => void;
  onEditRecurring: (expense: RecurringExpense) => void;
  onPaid?: (tx: Transaction) => void;
}

const formatDueDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  const diffDays = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  }
  if (diffDays <= 7) {
    return `In ${diffDays} days`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export const RecurringView = ({
  refreshKey,
  onAddRecurring,
  onEditRecurring,
  onPaid,
}: RecurringViewProps) => {
  const [activeExpenses, setActiveExpenses] = useState<RecurringExpense[]>([]);
  const [dueSoonExpenses, setDueSoonExpenses] = useState<RecurringExpense[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<TemplateGroup>>(
    new Set(["utilities", "subscriptions"])
  );
  const [showTemplates, setShowTemplates] = useState(true);
  const [actionSheetExpense, setActionSheetExpense] = useState<RecurringExpense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [active, dueSoon] = await Promise.all([
        getActiveRecurringExpenses(),
        getRecurringExpensesDueSoon(7),
      ]);
      setActiveExpenses(active);
      setDueSoonExpenses(dueSoon);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses, refreshKey]);

  const toggleGroup = (group: TemplateGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleMarkAsPaid = async (expense: RecurringExpense) => {
    const tx = await markRecurringAsPaid(expense.id);
    if (tx && onPaid) {
      onPaid(tx);
    }
    await loadExpenses();
    setActionSheetExpense(null);
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    await updateRecurringExpense(expense.id, { isActive: !expense.isActive });
    await loadExpenses();
    setActionSheetExpense(null);
  };

  const handleDelete = async (expense: RecurringExpense) => {
    await deleteRecurringExpense(expense.id);
    await loadExpenses();
    setActionSheetExpense(null);
  };

  const getTemplatesForGroup = (group: TemplateGroup) =>
    RECURRING_TEMPLATES.filter((t) => t.group === group);

  const renderExpenseCard = (expense: RecurringExpense, showDueStatus = false) => {
    const CategoryIcon = CATEGORY_ICON_MAP[expense.category as CategoryKey] ?? CATEGORY_ICON_MAP.Other;
    const overdue = isOverdue(expense.nextDue);
    const dueSoon = isDueSoon(expense.nextDue, 3);

    return (
      <motion.div
        key={expense.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`kk-card p-4 ${overdue ? "border-[var(--kk-danger-ink)]/30" : dueSoon ? "border-[var(--kk-saffron)]/50" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              overdue
                ? "bg-[var(--kk-danger-ink)]/10 text-[var(--kk-danger-ink)]"
                : dueSoon
                ? "bg-[var(--kk-saffron)]/10 text-[var(--kk-saffron)]"
                : "bg-[var(--kk-cream)] text-[var(--kk-ash)]"
            }`}
          >
            <CategoryIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-[var(--kk-ink)] truncate">
                {expense.name}
              </div>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-[var(--kk-ink)] font-[family:var(--font-mono)]">
                  ₹{formatCurrency(expense.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => setActionSheetExpense(expense)}
                  className="kk-icon-btn kk-icon-btn-ghost"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--kk-ash)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {FREQUENCY_LABEL_MAP[expense.frequency]}
              </span>
              {showDueStatus && (
                <span
                  className={`flex items-center gap-1 ${
                    overdue
                      ? "text-[var(--kk-danger-ink)] font-medium"
                      : dueSoon
                      ? "text-[var(--kk-saffron)] font-medium"
                      : ""
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDueDate(expense.nextDue)}
                </span>
              )}
            </div>
          </div>
        </div>

        {(overdue || dueSoon) && (
          <button
            type="button"
            onClick={() => handleMarkAsPaid(expense)}
            className="kk-btn-primary mt-3 w-full py-2 text-sm"
          >
            <Check className="h-4 w-4" />
            Mark as Paid
          </button>
        )}
      </motion.div>
    );
  };

  const renderTemplateCard = (template: RecurringTemplate) => {
    const Icon = template.icon;

    return (
      <button
        key={template.id}
        type="button"
        onClick={() => onAddRecurring(template)}
        className="flex items-center gap-3 rounded-xl border border-[var(--kk-smoke)] bg-white p-3 text-left transition hover:border-[var(--kk-ember)] hover:bg-[var(--kk-ember)]/5 active:scale-[0.98]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--kk-cream)] text-[var(--kk-ash)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--kk-ink)] truncate">
            {template.name}
          </div>
          <div className="text-xs text-[var(--kk-ash)]">
            {FREQUENCY_LABEL_MAP[template.suggestedFrequency]}
          </div>
        </div>
        <Plus className="h-4 w-4 text-[var(--kk-ash)]" />
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--kk-ember)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Due Soon Section */}
      {dueSoonExpenses.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--kk-saffron)]" />
            <h2 className="text-sm font-semibold text-[var(--kk-ink)]">
              Due Soon
            </h2>
            <span className="rounded-full bg-[var(--kk-saffron)]/10 px-2 py-0.5 text-xs font-medium text-[var(--kk-saffron)]">
              {dueSoonExpenses.length}
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {dueSoonExpenses.map((expense) => renderExpenseCard(expense, true))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Active Recurring Section */}
      {activeExpenses.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--kk-ink)]">
              Active Recurring ({activeExpenses.length})
            </h2>
            <button
              type="button"
              onClick={() => onAddRecurring()}
              className="kk-btn-secondary kk-btn-compact"
            >
              <Plus className="h-3 w-3" />
              Add New
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activeExpenses
                .filter((e) => !dueSoonExpenses.some((d) => d.id === e.id))
                .map((expense) => renderExpenseCard(expense, true))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Quick Add Templates Section */}
      <section>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="mb-3 flex w-full items-center justify-between text-left"
        >
          <h2 className="text-sm font-semibold text-[var(--kk-ink)]">
            Quick Add Templates
          </h2>
          <ChevronDown
            className={`h-4 w-4 text-[var(--kk-ash)] transition-transform ${
              showTemplates ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                {TEMPLATE_GROUPS.map((group) => {
                  const templates = getTemplatesForGroup(group.key);
                  if (templates.length === 0) return null;

                  const isExpanded = expandedGroups.has(group.key);

                  return (
                    <div key={group.key}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="flex w-full items-center gap-2 rounded-lg bg-[var(--kk-cream)] px-3 py-2.5 text-left transition hover:bg-[var(--kk-smoke)]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[var(--kk-ash)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[var(--kk-ash)]" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--kk-ink)]">
                            {group.label}
                          </div>
                          <div className="text-xs text-[var(--kk-ash)]">
                            {group.description}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--kk-ash)]">
                          {templates.length}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                              {templates.map(renderTemplateCard)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Empty State */}
      {activeExpenses.length === 0 && (
        <div className="kk-card py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--kk-cream)]">
            <Calendar className="h-6 w-6 text-[var(--kk-ash)]" />
          </div>
          <h3 className="font-medium text-[var(--kk-ink)]">
            No recurring expenses yet
          </h3>
          <p className="mt-1 text-sm text-[var(--kk-ash)]">
            Add your recurring bills and subscriptions to track them easily
          </p>
          <button
            type="button"
            onClick={() => onAddRecurring()}
            className="kk-btn-primary mt-4"
          >
            <Plus className="h-4 w-4" />
            Add Recurring Expense
          </button>
        </div>
      )}

      {/* Action Sheet */}
      <AnimatePresence>
        {actionSheetExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--kk-void)]/40 p-4 backdrop-blur-sm"
            onClick={() => setActionSheetExpense(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-[var(--kk-smoke-heavy)]" />
              </div>

              <div className="px-4 pb-2">
                <div className="font-medium text-[var(--kk-ink)]">
                  {actionSheetExpense.name}
                </div>
                <div className="text-sm text-[var(--kk-ash)]">
                  ₹{formatCurrency(actionSheetExpense.amount)} · {FREQUENCY_LABEL_MAP[actionSheetExpense.frequency]}
                </div>
              </div>

              <div className="border-t border-[var(--kk-smoke)] p-2">
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid(actionSheetExpense)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-[var(--kk-cream)]"
                >
                  <Check className="h-5 w-5 text-[var(--kk-ember)]" />
                  <span className="font-medium">Mark as Paid</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onEditRecurring(actionSheetExpense);
                    setActionSheetExpense(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-[var(--kk-cream)]"
                >
                  <Pencil className="h-5 w-5 text-[var(--kk-ash)]" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(actionSheetExpense)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-[var(--kk-cream)]"
                >
                  {actionSheetExpense.isActive ? (
                    <>
                      <Pause className="h-5 w-5 text-[var(--kk-ash)]" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 text-[var(--kk-ash)]" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(actionSheetExpense)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[var(--kk-danger-ink)] transition hover:bg-[var(--kk-danger-ink)]/5"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Delete</span>
                </button>
              </div>

              <div className="border-t border-[var(--kk-smoke)] p-2">
                <button
                  type="button"
                  onClick={() => setActionSheetExpense(null)}
                  className="w-full rounded-lg bg-[var(--kk-cream)] px-4 py-3 font-medium transition hover:bg-[var(--kk-smoke)]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
