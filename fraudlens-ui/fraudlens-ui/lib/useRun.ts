"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Alert, Summary } from "./types";
import { fmtNum } from "./format";

export type Phase = "idle" | "running" | "done" | "error";

export interface Stage {
  id: string;
  label: string;
  ms: number;
  detail: (s: Summary, p: number) => string;
}

/** The pipeline stages shown during the simulated run. Mirrors the notebook. */
export const STAGES: Stage[] = [
  {
    id: "validate",
    label: "Check the file",
    ms: 900,
    detail: (s) => `${fmtNum(s.rows_scored)} transactions, columns match`,
  },
  {
    id: "features",
    label: "Build behaviour features",
    ms: 1600,
    detail: () => "Amount, time of day, repeat-amount and volume patterns",
  },
  {
    id: "score",
    label: "Score every transaction",
    ms: 2400,
    detail: (s, p) =>
      `${fmtNum(Math.round(s.rows_scored * p))} of ${fmtNum(s.rows_scored)} scored`,
  },
  {
    id: "calibrate",
    label: "Convert scores to fraud probabilities",
    ms: 1200,
    detail: () => "Calibrated on out-of-fold training scores",
  },
  {
    id: "rank",
    label: "Rank by expected net benefit",
    ms: 1000,
    detail: (s) =>
      `Probability \u00d7 amount at risk, minus ${s.assumptions.review_cost} per review`,
  },
  {
    id: "explain",
    label: "Add model indicators to each alert",
    ms: 1400,
    detail: (s) => `${s.indicator_method} indicators for the top ${s.alerts_per_day}`,
  },
];

const TOTAL_MS = STAGES.reduce((n, s) => n + s.ms, 0);

const MISSING =
  "Could not load the data files in public/data. Export them from the notebook (see README) or run scripts/make_sample_data.py.";

export function useRun() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<Summary | null>(null);
  const [data, setData] = useState<{ alerts: Alert[]; summary: Summary } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  const stopAnimation = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  // Load the summary up front so the idle screen can show what will be processed.
  useEffect(() => {
    let cancelled = false;
    fetch("/data/summary.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s: Summary) => {
        if (!cancelled) setPreview(s);
      })
      .catch(() => {
        if (!cancelled) setError(MISSING);
      });
    return () => {
      cancelled = true;
      stopAnimation();
    };
  }, []);

  const start = useCallback(async () => {
    stopAnimation();
    setError(null);
    setPhase("running");
    setStage(0);
    setProgress(0);

    try {
      const [a, s] = await Promise.all([
        fetch("/data/alert_queue.json", { cache: "no-store" }),
        fetch("/data/summary.json", { cache: "no-store" }),
      ]);
      if (!a.ok || !s.ok) throw new Error("missing data files");
      const alerts = (await a.json()) as Alert[];
      const summary = (await s.json()) as Summary;
      setData({ alerts, summary });
      setPreview(summary);
    } catch {
      setPhase("error");
      setError(MISSING);
      return;
    }

    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed >= TOTAL_MS) {
        setStage(STAGES.length);
        setProgress(1);
        setPhase("done");
        raf.current = null;
        return;
      }
      let acc = 0;
      for (let i = 0; i < STAGES.length; i++) {
        if (elapsed < acc + STAGES[i].ms) {
          setStage(i);
          setProgress((elapsed - acc) / STAGES[i].ms);
          break;
        }
        acc += STAGES[i].ms;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    stopAnimation();
    setPhase("idle");
    setStage(0);
    setProgress(0);
    setError(null);
  }, []);

  return { phase, stage, progress, preview, data, error, start, reset };
}
