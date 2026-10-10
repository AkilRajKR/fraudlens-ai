"use client";

import { useMemo } from "react";
import type { Alert, Summary as SummaryT } from "@/lib/types";
import { fmtAmt, fmtNum, fmtPct } from "@/lib/format";

interface Props {
  alerts: Alert[];
  summary: SummaryT;
  showTruth: boolean;
}

export function Summary({ alerts, summary, showTruth }: Props) {
  const t = useMemo(() => {
    const exp = alerts.reduce((n, a) => n + a.fraud_probability, 0);
    const avoided = alerts.reduce((n, a) => n + a.expected_loss_avoided, 0);
    const benefit = alerts.reduce((n, a) => n + a.expected_net_benefit, 0);
    return { exp, avoided, benefit };
  }, [alerts]);

  return (
    <section className="summary" aria-label="Queue summary">
      <dl className="figures">
        <div>
          <dt>Frauds expected in this queue</dt>
          <dd>{fmtNum(t.exp)} of {alerts.length}</dd>
        </div>
        <div>
          <dt>Expected loss avoided</dt>
          <dd>{fmtAmt(t.avoided, summary.unit, 0)}</dd>
        </div>
        <div>
          <dt>Expected net benefit</dt>
          <dd>{fmtAmt(t.benefit, summary.unit, 0)}</dd>
        </div>
        <div>
          <dt>Ranking policy</dt>
          <dd>{summary.policy === "cost-sensitive" ? "Expected net benefit" : "Risk score"}</dd>
        </div>
      </dl>

      {showTruth && (
        <dl className="figures evaluation">
          <div className="eval-title">
            Evaluation view. Uses the day&rsquo;s real outcomes, which are not known in production.
          </div>
          <div>
            <dt>Frauds caught</dt>
            <dd>{summary.tp} of {summary.day_frauds}</dd>
          </div>
          <div>
            <dt>Precision / recall</dt>
            <dd>{fmtPct(summary.precision_at_k)} / {fmtPct(summary.recall_at_k)}</dd>
          </div>
          <div>
            <dt>Cost with no model</dt>
            <dd>{fmtAmt(summary.cost_no_model, summary.unit, 0)}</dd>
          </div>
          <div>
            <dt>Cost with this queue</dt>
            <dd>
              {fmtAmt(summary.cost_policy, summary.unit, 0)} ({fmtNum(summary.cost_reduction_pct)}% lower)
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
