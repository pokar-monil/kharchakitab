"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, RefreshCw, X } from "lucide-react";
import {
  deleteTransaction,
  getRecentTransactions,
} from "@/src/db/db";
import type { Transaction } from "@/src/types";
import { EmptyState } from "@/src/components/EmptyState";
import { TransactionRow } from "@/src/components/TransactionRow";
import { TransactionActionSheet } from "@/src/components/TransactionActionSheet";
import { formatCurrency } from "@/src/utils/money";
import { useMobileSheet } from "@/src/hooks/useMobileSheet";
import { CATEGORY_OPTIONS, type CategoryKey } from "@/src/config/categories";

interface TransactionsViewProps {
  refreshKey?: number;
  onViewAll?: () => void;
  onEdit?: (tx: Transaction) => void;
  onDeleted?: (tx: Transaction) => void;
  addedTx?: Transaction | null;
  deletedTx?: Transaction | null;
  editedTx?: Transaction | null;
  onMobileSheetChange?: (isOpen: boolean) => void;
}

const sortTransactions = (items: Transaction[]) =>
  items
    .slice()
    .sort((a, b) =>
      a.timestamp === b.timestamp
        ? b.id.localeCompare(a.id)
        : b.timestamp - a.timestamp
    );

const isProcessingRow = (tx: Transaction) =>
  tx.item === "Processing…" || tx.item.startsWith("Processing ");

export const TransactionsView = ({
  refreshKey,
  onViewAll,
  onEdit,
  onDeleted,
  addedTx,
  deletedTx,
  editedTx,
  onMobileSheetChange,
}: TransactionsViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([]);
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const {
    isOpen: isMobileSheetOpen,
    activeId: mobileSheetTxId,
    confirmDelete: mobileConfirmDelete,
    setConfirmDelete: setMobileConfirmDelete,
    openSheet: openMobileSheet,
    closeSheet: closeMobileSheet,
  } = useMobileSheet({ onOpenChange: onMobileSheetChange });
  const transactionsRef = React.useRef<Transaction[]>([]);
  const hasEdit = Boolean(onEdit);

  const reloadTransactions = useCallback((isActive?: () => boolean) => {
    const shouldUpdate = () => (isActive ? isActive() : true);
    setIsLoading(true);
    getRecentTransactions(5)
      .then((items) => {
        if (shouldUpdate()) setTransactions(sortTransactions(items));
      })
      .catch(() => {
        if (shouldUpdate()) setTransactions([]);
      })
      .finally(() => {
        if (shouldUpdate()) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let active = true;
    reloadTransactions(() => active);
    return () => {
      active = false;
    };
  }, [refreshKey, reloadTransactions]);

  useEffect(() => {
    if (!deletedTx) return;
    setTransactions((prev) => prev.filter((tx) => tx.id !== deletedTx.id));
  }, [deletedTx]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    if (!editedTx) return;
    setTransactions((prev) =>
      sortTransactions(prev.map((tx) => (tx.id === editedTx.id ? editedTx : tx)))
    );
  }, [editedTx]);

  const findTxById = useCallback(
    (id: string) =>
      transactions.find((tx) => tx.id === id) ?? null,
    [transactions]
  );

  const handleDelete = useCallback(async (id: string) => {
    const removed = findTxById(id);
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    try {
      await deleteTransaction(id);
      if (removed) {
        onDeleted?.(removed);
      }
    } catch {
      reloadTransactions();
    }
  }, [findTxById, onDeleted, reloadTransactions]);

  const handleEdit = useCallback(
    (id: string) => {
      if (!onEdit) return;
      const tx = findTxById(id);
      if (tx) onEdit(tx);
    },
    [findTxById, onEdit]
  );

  const mobileSheetTx = mobileSheetTxId ? findTxById(mobileSheetTxId) : null;

  const toggleCategory = useCallback((category: CategoryKey) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setShowRecurringOnly(false);
  }, []);

  const hasActiveFilters = selectedCategories.length > 0 || showRecurringOnly;

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (selectedCategories.length > 0) {
      result = result.filter((tx) =>
        selectedCategories.includes(tx.category as CategoryKey)
      );
    }

    // Recurring filter - ready for when the field is added to Transaction
    // if (showRecurringOnly) {
    //   result = result.filter((tx) => (tx as any).recurring === true);
    // }

    return result;
  }, [transactions, selectedCategories, showRecurringOnly]);

  if (!isLoading && transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="kk-card p-8 text-center"
      >
        <EmptyState
          icon={<Wallet className="h-8 w-8 text-[var(--kk-ash)]" />}
          title="Your ledger is empty"
          subtitle="Tap the mic or share a receipt screenshot to log your first expense"
          className="py-2"
        />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="kk-card p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="kk-label">Recent Transactions</div>
          </div>
          <div className="flex items-center gap-3">
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="kk-btn-secondary kk-btn-compact"
              >
                View all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="kk-label text-[0.6rem]">Filter by</div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-[0.65rem] font-medium text-[var(--kk-ember)] transition hover:text-[var(--kk-ember-deep)]"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Category filters */}
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategories.includes(cat.key);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={`kk-chip kk-chip-filter ${isSelected ? "kk-chip-active" : ""}`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.label}
                </button>
              );
            })}
            {/* Recurring filter - ready for future use */}
            <button
              type="button"
              onClick={() => setShowRecurringOnly((prev) => !prev)}
              disabled
              title="Coming soon"
              className={`kk-chip kk-chip-filter opacity-50 cursor-not-allowed ${showRecurringOnly ? "kk-chip-active" : ""}`}
            >
              <RefreshCw className="h-3 w-3" />
              Recurring
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {hasActiveFilters && filteredTransactions.length === 0 && transactions.length > 0 && (
            <div className="py-6 text-center">
              <div className="text-sm text-[var(--kk-ash)]">No transactions match the selected filters</div>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm font-medium text-[var(--kk-ember)]"
              >
                Clear filters
              </button>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((tx, index) => {
              const processing = isProcessingRow(tx);
              const rowKey = tx.id || `recent-${index}`;
              return (
                <TransactionRow
                  key={rowKey}
                  tx={tx}
                  index={index}
                  metaVariant="date"
                  hasEdit={hasEdit}
                  onEdit={hasEdit ? handleEdit : undefined}
                  onDelete={handleDelete}
                  onOpenMobileSheet={openMobileSheet}
                  formatCurrency={formatCurrency}
                  amountMaxWidthClass="max-w-[24vw]"
                  isProcessing={processing}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      <TransactionActionSheet
        isOpen={isMobileSheetOpen}
        tx={mobileSheetTx}
        hasEdit={hasEdit}
        confirmDelete={mobileConfirmDelete}
        setConfirmDelete={setMobileConfirmDelete}
        onClose={closeMobileSheet}
        onEdit={hasEdit ? handleEdit : undefined}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
      />
    </>
  );
};
