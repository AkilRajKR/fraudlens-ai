"use client";

import { useEffect, useRef } from "react";
import type { Alert, Decision } from "@/lib/types";
import { tierMeta } from "@/lib/tiers";
import { fmtAmt, fmtHour, fmtNum, fmtPct, fmtSigned } from "@/lib/format";

export type SortKey = "rank" | "fraud_probability" | "amount" | "expected_net_benefit";
export interface Sort {
  key: SortKey;
  dir: 1 | -1;
}

interface Props {
  rows: Alert[];
  decisions: Record<number, Decision>;
  selected: number | null;
  showTruth: boolean;
  unit: string;
  sort: Sort;
  onSort: (key: SortKey) => void;
  onSelect: (rank: number) => void;
}

export const DECISION_LABEL: Record<Decision, string> = {
  confirmed: "Confirmed fraud",
  dismissed: "Dismissed",
  escalated: "Escalated",
};

export function QueueTable({ rows, decisions, selected, showTruth, unit, sort, onSort, onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  // Keep the selected row visible when moving with the keyboard.
  useEffect(() => {
    if (selected == null) return;
    wrap.current
      ?.querySelector<HTMLElement>(`[data-rank="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const th = (key: SortKey, label: string, numeric = false) => (
    <th
      scope="col"
      className={numeric ? "num" : undefined}
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
    >
      <button className="sortbtn" onClick={() => onSort(key)}>
        {label}
        <span className="arrow" aria-hidden="true">
          {sort.key === key ? (sort.dir === 1 ? "\u2191" : "\u2193") : ""}
        </span>
      </button>
    </th>
  );

  return (
    <div className="tablewrap" ref={wrap}>
      <table className="queue">
        <thead>
          <tr>
            {th("rank", "Rank")}
            <th scope="col">Priority</th>
            {th("fraud_probability", "Fraud probability", true)}
            {th("amount", "Amount", true)}
            {th("expected_net_benefit", "Net benefit", true)}
            <th scope="col">Hour</th>
            <th scope="col">Model indicators</th>
            <th scope="col">Decision</th>
            {showTruth && <th scope="col">Actual</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const d = decisions[a.rank];
            const tier = tierMeta(a.action);
            return (
              <tr
                key={a.rank}
                data-rank={a.rank}
                className={selected === a.rank ? "selected" : undefined}
                aria-selected={selected === a.rank}
                onClick={() => onSelect(a.rank)}
              >
                <td className="rankcell">
                  <button className="rowbtn" onClick={() => onSelect(a.rank)}>
                    {a.rank}
                  </button>
                </td>
                <td>
                  <span className={`tier ${tier.css}`}>{tier.short}</span>
                </td>
                <td className="num">{fmtPct(a.fraud_probability)}</td>
                <td className="num">{fmtNum(a.amount, 2)}</td>
                <td className="num">{fmtNum(a.expected_net_benefit, 0)}</td>
                <td>{fmtHour(a.hour)}</td>
                <td>
                  <span className="chips">
                    {a.indicators.map((i) => (
                      <span key={i.feature} className="chip">
                        {i.feature} {fmtSigned(i.value)}
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  {d ? <span className={`status ${d}`}>{DECISION_LABEL[d]}</span> : <span className="status pending">Pending</span>}
                </td>
                {showTruth && (
                  <td>
                    <span className={a.actual_class === 1 ? "truth fraud" : "truth legit"}>
                      {a.actual_class === 1 ? "Fraud" : "Legitimate"}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={showTruth ? 9 : 8} className="empty">
                No alerts match these filters. Change the priority or decision filter to see more.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <span className="visually-hidden">{unit}</span>
    </div>
  );
}

export { fmtAmt };
