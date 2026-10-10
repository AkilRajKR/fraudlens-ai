"use client";

import { useState } from "react";
import type { Alert, Decision, Summary } from "@/lib/types";
import { tierMeta } from "@/lib/tiers";
import { fmtAmt, fmtHour, fmtPct, fmtSigned } from "@/lib/format";
import { DECISION_LABEL } from "./QueueTable";

interface Props {
  alert: Alert | null;
  decision: Decision | undefined;
  summary: Summary;
  showTruth: boolean;
  onDecide: (d: Decision | null) => void;
  onClose: () => void;
}

export function DetailPanel({ alert, decision, summary, showTruth, onDecide, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!alert) {
    return (
      <aside className="detail empty-detail">
        <p>Select an alert to see why it was flagged and record your decision.</p>
      </aside>
    );
  }

  const tier = tierMeta(alert.action);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(alert.note);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const choice = (d: Decision, label: string, key: string) => (
    <button
      className={`btn decide ${d} ${decision === d ? "on" : ""}`}
      aria-pressed={decision === d}
      onClick={() => onDecide(decision === d ? null : d)}
    >
      {label} <kbd>{key}</kbd>
    </button>
  );

  return (
    <aside className="detail open" aria-label={`Alert ${alert.rank} details`}>
      <header className="detail-head">
        <div>
          <h2>Alert {alert.rank}</h2>
          <span className={`tier ${tier.css}`}>{tier.short}</span>
        </div>
        <button className="btn ghost closebtn" onClick={onClose} aria-label="Close details">
          Close
        </button>
      </header>

      <p className="hint">{tier.hint}</p>

      <dl className="facts">
        <div>
          <dt>Amount</dt>
          <dd>{fmtAmt(alert.amount, summary.unit)}</dd>
        </div>
        <div>
          <dt>Fraud probability</dt>
          <dd>{fmtPct(alert.fraud_probability)}</dd>
        </div>
        <div>
          <dt>Expected loss avoided</dt>
          <dd>{fmtAmt(alert.expected_loss_avoided, summary.unit, 0)}</dd>
        </div>
        <div>
          <dt>Expected net benefit</dt>
          <dd>{fmtAmt(alert.expected_net_benefit, summary.unit, 0)}</dd>
        </div>
        <div>
          <dt>Time of day</dt>
          <dd>{fmtHour(alert.hour)} (relative)</dd>
        </div>
        {showTruth && (
          <div>
            <dt>Actual outcome</dt>
            <dd>{alert.actual_class === 1 ? "Fraud" : "Legitimate"}</dd>
          </div>
        )}
      </dl>

      <h3>Why it was flagged</h3>
      <ul className="why">
        {alert.indicators.map((i) => (
          <li key={i.feature}>
            <span className="feat">{i.feature}</span>
            <span className="val">{fmtSigned(i.value)}</span>
          </li>
        ))}
      </ul>
      <p className="fine">
        {summary.indicator_method} indicators. These are model-based signals on anonymised
        components, not proven causes.
        {summary.stability != null && ` Across a refit, alerts kept about ${Math.round(summary.stability * 100)}% of their top indicators.`}
      </p>

      <h3>Analyst note</h3>
      <p className="note">{alert.note}</p>
      <button className="btn ghost" onClick={copy}>
        {copied ? "Copied" : "Copy note"}
      </button>

      <h3>Your decision</h3>
      <div className="decisions">
        {choice("confirmed", "Confirm fraud", "C")}
        {choice("escalated", "Escalate", "E")}
        {choice("dismissed", "Dismiss", "D")}
      </div>
      <p className="fine">
        {decision
          ? `${DECISION_LABEL[decision]}. Select it again to undo.`
          : "Pending approval. Nothing is blocked automatically."}
      </p>
    </aside>
  );
}
