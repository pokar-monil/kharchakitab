"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Users, CreditCard, IndianRupee, DollarSign, Euro, PoundSterling, ChevronRight } from "lucide-react";

const CURRENCY_OPTIONS = [
  { key: "INR", label: "Indian Rupee", symbol: "₹", icon: IndianRupee },
  { key: "USD", label: "US Dollar", symbol: "$", icon: DollarSign },
  { key: "EUR", label: "Euro", symbol: "€", icon: Euro },
  { key: "GBP", label: "British Pound", symbol: "£", icon: PoundSterling },
] as const;

type CurrencyKey = typeof CURRENCY_OPTIONS[number]["key"];

export const ProfileView = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyKey>("INR");
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("kk_currency");
    if (stored && CURRENCY_OPTIONS.some((c) => c.key === stored)) {
      setSelectedCurrency(stored as CurrencyKey);
    }
  }, []);

  const handleCurrencyChange = (currency: CurrencyKey) => {
    setSelectedCurrency(currency);
    window.localStorage.setItem("kk_currency", currency);
    setIsCurrencyPickerOpen(false);
  };

  const currentCurrency = CURRENCY_OPTIONS.find((c) => c.key === selectedCurrency);

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="kk-card p-5"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--kk-ember)] to-[var(--kk-ember-deep)] text-white">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--kk-ink)]">My Profile</h2>
            <p className="text-sm text-[var(--kk-ash)]">Manage your account settings</p>
          </div>
        </div>
      </motion.div>

      {/* Settings List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="kk-card overflow-hidden"
      >
        {/* My Group */}
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--kk-cream)] opacity-60 cursor-not-allowed"
          disabled
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--kk-cream)]">
              <Users className="h-5 w-5 text-[var(--kk-ember)]" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--kk-ink)]">My Group</span>
                <span className="rounded-full bg-[var(--kk-saffron)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--kk-saffron)]">
                  Coming Soon
                </span>
              </div>
              <div className="text-xs text-[var(--kk-ash)]">Add your partner to track expenses together, like a joint account</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--kk-ash)]" />
        </button>

        <div className="mx-5 border-t border-[var(--kk-smoke)]" />

        {/* Manage Subscription */}
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--kk-cream)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--kk-cream)]">
              <CreditCard className="h-5 w-5 text-[var(--kk-ember)]" />
            </div>
            <div className="text-left">
              <div className="font-medium text-[var(--kk-ink)]">Manage Subscription</div>
              <div className="text-xs text-[var(--kk-ash)]">View and manage your plan</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--kk-ember)]/10 px-2 py-0.5 text-xs font-medium text-[var(--kk-ember)]">
              Free
            </span>
            <ChevronRight className="h-5 w-5 text-[var(--kk-ash)]" />
          </div>
        </button>

        <div className="mx-5 border-t border-[var(--kk-smoke)]" />

        {/* Currency Symbol */}
        <button
          type="button"
          onClick={() => setIsCurrencyPickerOpen(!isCurrencyPickerOpen)}
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--kk-cream)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--kk-cream)]">
              {currentCurrency && <currentCurrency.icon className="h-5 w-5 text-[var(--kk-ember)]" />}
            </div>
            <div className="text-left">
              <div className="font-medium text-[var(--kk-ink)]">Currency Symbol</div>
              <div className="text-xs text-[var(--kk-ash)]">Set your preferred currency</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--kk-ink)]">
              {currentCurrency?.symbol} {currentCurrency?.key}
            </span>
            <ChevronRight className={`h-5 w-5 text-[var(--kk-ash)] transition-transform ${isCurrencyPickerOpen ? "rotate-90" : ""}`} />
          </div>
        </button>

        {/* Currency Picker */}
        {isCurrencyPickerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--kk-smoke)] bg-[var(--kk-cream)]/50"
          >
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {CURRENCY_OPTIONS.map((currency) => {
                  const isSelected = selectedCurrency === currency.key;
                  const Icon = currency.icon;
                  return (
                    <button
                      key={currency.key}
                      type="button"
                      onClick={() => handleCurrencyChange(currency.key)}
                      className={`flex items-center gap-2 rounded-[var(--kk-radius-sm)] border p-3 transition ${
                        isSelected
                          ? "border-[var(--kk-ember)] bg-[var(--kk-ember)]/10"
                          : "border-[var(--kk-smoke)] bg-white hover:border-[var(--kk-ember)]/50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-[var(--kk-ember)]" : "text-[var(--kk-ash)]"}`} />
                      <div className="text-left">
                        <div className={`text-sm font-medium ${isSelected ? "text-[var(--kk-ember)]" : "text-[var(--kk-ink)]"}`}>
                          {currency.symbol} {currency.key}
                        </div>
                        <div className="text-xs text-[var(--kk-ash)]">{currency.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="text-center"
      >
        <p className="text-xs text-[var(--kk-ash)]">
          KharchaKitab v1.0.0
        </p>
        <p className="mt-1 text-xs text-[var(--kk-ash)]">
          Your data stays on your device
        </p>
      </motion.div>
    </div>
  );
};
