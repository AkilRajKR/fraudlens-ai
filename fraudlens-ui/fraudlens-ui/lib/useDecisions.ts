"use client";

import { useCallback, useEffect, useState } from "react";
import type { Decision } from "./types";

/** Analyst decisions per alert rank, persisted in this browser only. */
export function useDecisions(storageKey: string | null) {
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      setDecisions(raw ? JSON.parse(raw) : {});
    } catch {
      setDecisions({});
    }
  }, [storageKey]);

  const decide = useCallback(
    (rank: number, d: Decision | null) => {
      setDecisions((prev) => {
        const next = { ...prev };
        if (d === null) delete next[rank];
        else next[rank] = d;
        try {
          if (storageKey) window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* storage unavailable: keep in memory */
        }
        return next;
      });
    },
    [storageKey]
  );

  const reset = useCallback(() => {
    setDecisions({});
    try {
      if (storageKey) window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return { decisions, decide, reset };
}
