"use client";

import type { Phase } from "@/lib/useRun";
import { STAGES } from "@/lib/useRun";
import type { Summary } from "@/lib/types";
import { fmtNum } from "@/lib/format";

interface Props {
  phase: Phase;
  stage: number;
  progress: number;
  summary: Summary | null;
  error: string | null;
  onStart: () => void;
}

export function RunPanel({ phase, stage, progress, summary, error, onStart }: Props) {
  const running = phase === "running";

  return (
    <section className="run" aria-labelledby="run-title">
      <div className="run-intro">
        <h1 id="run-title">Score today&rsquo;s transactions</h1>
        <p className="lede">
          {summary
            ? `Score ${fmtNum(summary.rows_scored)} transactions and get the ${summary.alerts_per_day} that are worth an analyst's time, ranked by expected net benefit.`
            : "Score the day's transactions and get the alerts worth an analyst's time."}
        </p>

        <button className="btn primary" onClick={onStart} disabled={running || (!summary && !error)}>
          {running ? "Processing\u2026" : "Start processing"}
        </button>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {summary && !running && (
          <dl className="assumptions">
            <dt>Cost assumptions in this run</dt>
            <dd>
              Each review costs {summary.assumptions.review_cost} {summary.unit}. A missed fraud
              loses {Math.round(summary.assumptions.loss_rate * 100)}% of its amount
              {summary.assumptions.fixed_fraud_cost > 0
                ? ` plus ${summary.assumptions.fixed_fraud_cost} ${summary.unit}`
                : ""}
              . These are illustrative until replaced with real figures.
            </dd>
            <dd className="muted">
              Demo mode: results come from a pre-computed run, not a live model.
            </dd>
          </dl>
        )}
      </div>

      <ol className="stages" aria-live="polite">
        {STAGES.map((s, i) => {
          const state = phase === "done" || stage > i ? "done" : running && stage === i ? "active" : "todo";
          const p = state === "done" ? 1 : state === "active" ? progress : 0;
          return (
            <li key={s.id} className={`stage ${state}`}>
              <span className="mark" aria-hidden="true">
                {state === "done" ? "\u2713" : ""}
              </span>
              <div className="stage-body">
                <span className="stage-label">{s.label}</span>
                {summary && state !== "todo" && <span className="stage-detail">{s.detail(summary, p)}</span>}
                {state === "active" && (
                  <span className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
                    <span style={{ width: `${Math.round(p * 100)}%` }} />
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
