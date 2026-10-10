export type Tier =
  | "HOLD & CALL CUSTOMER"
  | "PRIORITY REVIEW (same day)"
  | "STANDARD REVIEW";

export type Decision = "confirmed" | "dismissed" | "escalated";

export interface Indicator {
  feature: string;
  value: number;
}

/** One row of the daily queue (mirrors alert_queue.csv from the notebook). */
export interface Alert {
  rank: number;
  risk_score: number;
  fraud_probability: number;
  amount: number;
  expected_loss_avoided: number;
  expected_net_benefit: number;
  hour: number;
  indicators: Indicator[];
  action: Tier;
  note: string;
  status: string;
  /** Ground truth. Evaluation only: never available in production. */
  actual_class?: 0 | 1;
}

export interface Summary {
  data_source: "notebook-export" | "synthetic-sample";
  generated_at: string;
  policy: string;
  indicator_method: string;
  alerts_per_day: number;
  rows_scored: number;
  day_frauds: number;
  base_rate: number;
  tp: number;
  fp: number;
  fn: number;
  precision_at_k: number;
  recall_at_k: number;
  pr_auc: number | null;
  cost_no_model: number;
  cost_policy: number;
  savings: number;
  cost_reduction_pct: number;
  stability: number | null;
  unit: string;
  assumptions: {
    review_cost: number;
    loss_rate: number;
    fixed_fraud_cost: number;
    false_alarm_friction: number;
  };
}
