"""Paste this into the LAST cell of fraudlens_colab_v3.ipynb (after section 12), then call export_for_ui().

It turns the notebook's `queue` DataFrame and day-2 results into the two JSON files the UI reads:
    alert_queue.json  ->  public/data/alert_queue.json
    summary.json      ->  public/data/summary.json
"""
import datetime
import json
import os

import numpy as np


def _parse_indicators(s):
    """'V14=-5.2, V4=+3.1' -> [{'feature': 'V14', 'value': -5.2}, ...]"""
    out = []
    for part in str(s).split(", "):
        if "=" not in part:
            continue
        name, val = part.rsplit("=", 1)
        out.append({"feature": name.strip(), "value": float(val)})
    return out


def export_for_ui(queue, row, all_loss, k, y_day, policy, indicator_method,
                  rows_scored, assumptions, stab=None, unit="units", out_dir="."):
    alerts = []
    for r in queue.to_dict("records"):
        alerts.append({
            "rank": int(r["Rank"]),
            "risk_score": float(r["Risk_score"]),
            "fraud_probability": float(r["Fraud_probability"]),
            "amount": float(r["Amount"]),
            "expected_loss_avoided": float(r["Expected_loss_avoided"]),
            "expected_net_benefit": float(r["Expected_net_benefit"]),
            "hour": int(r["Hour (relative)"]),
            "indicators": _parse_indicators(r["Model_indicators"]),
            "action": r["Action"],
            "note": r["Analyst_Note"],
            "status": r["Status"],
            "actual_class": int(r["Actual_Class (evaluation only)"]),
        })

    n_fraud = int(np.sum(y_day))
    summary = {
        "data_source": "notebook-export",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "policy": policy,
        "indicator_method": indicator_method,
        "alerts_per_day": int(k),
        "rows_scored": int(rows_scored),
        "day_frauds": n_fraud,
        "base_rate": float(np.mean(y_day)),
        "tp": int(row["Frauds caught (TP)"]),
        "fp": int(row["False alarms (FP)"]),
        "fn": int(row["Missed frauds (FN)"]),
        "precision_at_k": float(row["Precision@K"]),
        "recall_at_k": float(row["Recall@K"]),
        "pr_auc": None if row["PR_AUC"] != row["PR_AUC"] else float(row["PR_AUC"]),
        "cost_no_model": float(all_loss),
        "cost_policy": float(row["Total cost"]),
        "savings": float(row["Savings vs no model"]),
        "cost_reduction_pct": float(row["Cost reduction %"]),
        "stability": None if stab is None else float(stab),
        "unit": unit,
        "assumptions": assumptions,
    }

    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "alert_queue.json"), "w") as f:
        json.dump(alerts, f, indent=1, allow_nan=False)
    with open(os.path.join(out_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=1, allow_nan=False)
    print(f"Wrote {len(alerts)} alerts -> {out_dir}/alert_queue.json and summary.json")


# ---- call it (variable names come from the notebook) ----
export_for_ui(
    queue=queue, row=row, all_loss=all_loss_B, k=K2, y_day=y2,
    policy=POLICY, indicator_method=INDICATOR_METHOD,
    rows_scored=len(day2), stab=float(stab.mean()),
    unit=(CURRENCY_LABEL or "units"),
    assumptions=dict(review_cost=ALERT_REVIEW_COST, loss_rate=LOSS_RATE,
                     fixed_fraud_cost=FIXED_FRAUD_COST, false_alarm_friction=FALSE_ALARM_FRICTION),
    out_dir=".",
)
try:
    from google.colab import files
    files.download("alert_queue.json"); files.download("summary.json")
except ImportError:
    pass
