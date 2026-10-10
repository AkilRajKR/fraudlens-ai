"use client";

import type { CSSProperties } from "react";
import type { Alert, Decision } from "@/lib/types";
import { TIERS, tierMeta } from "@/lib/tiers";

interface Props {
  alerts: Alert[];
  decisions: Record<number, Decision>;
  selected: number | null;
  onSelect: (rank: number) => void;
}

/** One segment per alert slot: the day's analyst capacity, filling in as decisions are made. */
export function CapacityStrip({ alerts, decisions, selected, onSelect }: Props) {
  const counts = TIERS.map((t) => alerts.filter((a) => a.action === t.key).length);
  const values = Object.values(decisions);
  const reviewed = values.length;
  const confirmed = values.filter((d) => d === "confirmed").length;
  const escalated = values.filter((d) => d === "escalated").length;
  const dismissed = values.filter((d) => d === "dismissed").length;

  return (
    <section className="capacity" aria-label="Review progress">
      <div className="cap-brackets" style={{ gridTemplateColumns: counts.map((c) => `${c}fr`).join(" ") }} aria-hidden="true">
        {TIERS.map((t, i) => (
          <span key={t.key} className={`bracket ${t.css}`}>
            {t.short} {counts[i]}
          </span>
        ))}
      </div>

      <div className="cap-strip" style={{ "--cols": alerts.length } as CSSProperties}>
        {alerts.map((a) => {
          const d = decisions[a.rank];
          return (
            <button
              key={a.rank}
              tabIndex={-1}
              className={`seg ${tierMeta(a.action).css} ${d ?? "pending"} ${selected === a.rank ? "sel" : ""}`}
              onClick={() => onSelect(a.rank)}
              aria-label={`Alert ${a.rank}, ${d ?? "pending"}`}
              title={`#${a.rank} \u2013 ${d ?? "pending"}`}
            />
          );
        })}
      </div>

      <p className="cap-legend">
        <strong>{reviewed} of {alerts.length}</strong> reviewed
        {reviewed > 0 && (
          <>
            : <span className="k confirmed">{confirmed} confirmed</span>,{" "}
            <span className="k escalated">{escalated} escalated</span>,{" "}
            <span className="k dismissed">{dismissed} dismissed</span>
          </>
        )}
      </p>
    </section>
  );
}
