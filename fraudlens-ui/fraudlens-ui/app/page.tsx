"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RunPanel } from "@/components/RunPanel";
import { Summary } from "@/components/Summary";
import { CapacityStrip } from "@/components/CapacityStrip";
import { QueueTable, type Sort, type SortKey } from "@/components/QueueTable";
import { DetailPanel } from "@/components/DetailPanel";
import { useRun } from "@/lib/useRun";
import { useDecisions } from "@/lib/useDecisions";
import { TIERS } from "@/lib/tiers";
import { downloadDecisions } from "@/lib/exportCsv";
import type { Decision, Tier } from "@/lib/types";

type StatusFilter = "all" | "pending" | "decided";

export default function Home() {
  const run = useRun();
  const alerts = useMemo(() => run.data?.alerts ?? [], [run.data]);
  const summary = run.data?.summary ?? run.preview;
  const done = run.phase === "done" && run.data;

  const storageKey = run.data ? `fraudlens.decisions.v1.${run.data.summary.generated_at}` : null;
  const { decisions, decide, reset } = useDecisions(storageKey);

  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>({ key: "rank", dir: 1 });
  const [selected, setSelected] = useState<number | null>(null);
  const [showTruth, setShowTruth] = useState(false);

  useEffect(() => {
    if (!run.data) return;
    // On wide screens the detail panel sits beside the table, so pre-select the top alert.
    // On phones it is a bottom sheet, so wait for the analyst to open one.
    const wide = window.matchMedia("(min-width: 1101px)").matches;
    setSelected(wide ? run.data.alerts[0]?.rank ?? null : null);
  }, [run.data]);

  const visible = useMemo(() => {
    const rows = alerts.filter(
      (a) =>
        (tierFilter === "all" || a.action === tierFilter) &&
        (statusFilter === "all" ||
          (statusFilter === "pending" ? !decisions[a.rank] : !!decisions[a.rank]))
    );
    return [...rows].sort((a, b) => (a[sort.key] - b[sort.key]) * sort.dir);
  }, [alerts, tierFilter, statusFilter, decisions, sort]);

  const onSort = useCallback((key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: (s.dir * -1) as 1 | -1 }
        : { key, dir: key === "rank" ? 1 : -1 }
    );
  }, []);

  const act = useCallback(
    (rank: number, d: Decision | null) => {
      decide(rank, d);
      // After recording a decision, move on to the next alert in the current view.
      if (d) {
        const idx = visible.findIndex((a) => a.rank === rank);
        const next = visible[idx + 1];
        if (next) setSelected(next.rank);
      }
    },
    [decide, visible]
  );

  // Keyboard: j/k move, c/e/d record a decision.
  useEffect(() => {
    if (!done) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = visible.findIndex((a) => a.rank === selected);
      const key = e.key.toLowerCase();
      if (key === "j") {
        const n = visible[Math.min(idx + 1, visible.length - 1)];
        if (n) setSelected(n.rank);
      } else if (key === "k") {
        const n = visible[Math.max(idx - 1, 0)];
        if (n) setSelected(n.rank);
      } else if (selected != null) {
        const current = decisions[selected];
        const map: Record<string, Decision> = { c: "confirmed", e: "escalated", d: "dismissed" };
        if (map[key]) act(selected, current === map[key] ? null : map[key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, visible, selected, decisions, act]);

  const tierCount = (t: Tier) => alerts.filter((a) => a.action === t).length;
  const selectedAlert = alerts.find((a) => a.rank === selected) ?? null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <span className="name">FraudLens</span>
          <span className="sub">Daily alert queue</span>
        </div>
        <div className="topbar-right">
          {summary && (
            <span className={`source ${summary.data_source}`}>
              {summary.data_source === "synthetic-sample" ? "Sample data" : "Notebook export"}
            </span>
          )}
          {done && (
            <>
              <label className="toggle">
                <input type="checkbox" checked={showTruth} onChange={(e) => setShowTruth(e.target.checked)} />
                Evaluation view
              </label>
              <button className="btn ghost" onClick={() => downloadDecisions(alerts, decisions)}>
                Export decisions
              </button>
              <button className="btn ghost" onClick={run.reset}>
                New run
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {!done ? (
          <RunPanel
            phase={run.phase}
            stage={run.stage}
            progress={run.progress}
            summary={summary}
            error={run.error}
            onStart={run.start}
          />
        ) : (
          <>
            <Summary alerts={alerts} summary={run.data!.summary} showTruth={showTruth} />
            <CapacityStrip alerts={alerts} decisions={decisions} selected={selected} onSelect={setSelected} />

            <div className="toolbar">
              <div className="seg-control" role="group" aria-label="Filter by priority">
                <button className={tierFilter === "all" ? "on" : ""} onClick={() => setTierFilter("all")}>
                  All {alerts.length}
                </button>
                {TIERS.map((t) => (
                  <button key={t.key} className={tierFilter === t.key ? "on" : ""} onClick={() => setTierFilter(t.key)}>
                    {t.short} {tierCount(t.key)}
                  </button>
                ))}
              </div>
              <label className="select">
                Decision
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="decided">Decided</option>
                </select>
              </label>
              <button
                className="btn ghost"
                onClick={() => {
                  if (window.confirm("Clear every decision for this queue?")) reset();
                }}
              >
                Clear decisions
              </button>
              <span className="keys">Keys: J and K to move, C confirm, E escalate, D dismiss</span>
            </div>

            <div className="workspace">
              <QueueTable
                rows={visible}
                decisions={decisions}
                selected={selected}
                showTruth={showTruth}
                unit={run.data!.summary.unit}
                sort={sort}
                onSort={onSort}
                onSelect={setSelected}
              />
              <DetailPanel
                alert={selectedAlert}
                decision={selected != null ? decisions[selected] : undefined}
                summary={run.data!.summary}
                showTruth={showTruth}
                onDecide={(d) => selected != null && act(selected, d)}
                onClose={() => setSelected(null)}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
