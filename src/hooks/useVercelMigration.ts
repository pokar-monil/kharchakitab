import { useEffect, useState } from "react";
import { openDB } from "idb";
import { DB_NAME, DB_VERSION } from "@/src/db/db";
import { SITE_URL } from "@/src/config/site";

const OLD_ORIGIN = "https://kharchakitab.vercel.app";
const MIGRATION_FLAG = "kk_migration_done";
const STORES = [
  "transactions",
  "transaction_versions",
  "device_identity",
  "pairings",
  "sync_state",
  "recurring_templates",
  "recurring_alerts",
] as const;

type MigrationStatus = "idle" | "migrating" | "done" | "skipped";

async function hasDataToMigrate(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = () => { req.transaction!.abort(); resolve(false); };
    req.onerror = () => resolve(false);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("transactions")) { db.close(); resolve(false); return; }
      const countReq = db.transaction("transactions", "readonly").objectStore("transactions").count();
      countReq.onsuccess = () => { db.close(); resolve(countReq.result > 0); };
      countReq.onerror = () => { db.close(); resolve(false); };
    };
  });
}

export function useVercelMigration() {
  const [status, setStatus] = useState<MigrationStatus>("idle");

  useEffect(() => {
    // --- CASE 1: On vercel.app — only show migrate page if there's data to move ---
    if (window.location.origin === OLD_ORIGIN) {
      if (!window.location.pathname.includes("migrate")) {
        hasDataToMigrate().then((hasData) => {
          window.location.href = hasData ? "/migrate.html" : SITE_URL;
        });
      }
      setStatus("skipped");
      return;
    }

    // --- CASE 2: On .com — check for migration data in hash fragment ---
    const hash = window.location.hash;
    const migrateData = hash.startsWith("#migrate=") ? hash.slice("#migrate=".length) : null;

    if (!migrateData) {
      setStatus("skipped");
      return;
    }

    if (localStorage.getItem(MIGRATION_FLAG)) {
      cleanUrl();
      setStatus("skipped");
      return;
    }

    importData(migrateData);

    async function importData(encoded: string) {
      setStatus("migrating");

      try {
        const json = decodeURIComponent(atob(encoded));
        const data = JSON.parse(json);
        const { localStorage: lsData, indexedDB: idbData } = data;

        // 1. Restore localStorage
        if (lsData) {
          for (const [key, value] of Object.entries(lsData)) {
            localStorage.setItem(key, value as string);
          }
        }

        // 2. Restore IndexedDB
        if (idbData && Object.keys(idbData).length > 0) {
          const db = await openDB(DB_NAME, DB_VERSION);

          // Clear .com's auto-generated device identity so the imported one takes over
          if (idbData.device_identity?.length > 0) {
            const clearTx = db.transaction("device_identity", "readwrite");
            await clearTx.objectStore("device_identity").clear();
            await clearTx.done;
          }

          for (const store of STORES) {
            const records = idbData[store];
            if (!records || records.length === 0) continue;

            const tx = db.transaction(store, "readwrite");
            const objStore = tx.objectStore(store);

            for (const record of records) {
              await objStore.put(record);
            }
            await tx.done;
          }
          db.close();
        }

        localStorage.setItem(MIGRATION_FLAG, Date.now().toString());
        setStatus("done");
        // Force a full navigation (not reload) to ensure all module caches reset
        window.location.replace(window.location.pathname);
      } catch (err) {
        console.error("[KK Migration] Failed:", err);
        localStorage.setItem(MIGRATION_FLAG, "error");
        setStatus("skipped");
        cleanUrl();
      }
    }

    function cleanUrl() {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return status;
}

