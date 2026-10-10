"""Generate a SYNTHETIC demo queue so the UI runs before you export real results.

    python scripts/make_sample_data.py

Writes public/data/alert_queue.json and public/data/summary.json.
Replace both with the files exported from the notebook (scripts/export_for_ui.py).
"""
import datetime
import json
import math
import os
import random

random.seed(7)

K = 200
REVIEW_COST = 5.0
ROWS_SCORED = 141_822
POOL = 4_000

INDICATORS = {  # feature: (weight, mean, sd)  - typical signs on the public credit-card file
    "V14": (4, -7.0, 2.5), "V4": (3, 4.0, 1.5), "V12": (3, -6.0, 2.0),
    "V10": (3, -5.0, 2.0), "V11": (2, 4.0, 1.5), "V17": (2, -6.0, 3.0),
    "V3": (2, -5.0, 2.0), "V16": (1, -4.0, 2.0), "V7": (1, -4.0, 2.5),
    "LogAmount": (1, None, None),
}


def pick_indicators(amount):
    names = list(INDICATORS)
    weights = [INDICATORS[n][0] for n in names]
    chosen = []
    while len(chosen) < 3:
        n = random.choices(names, weights)[0]
        if n in chosen:
            continue
        chosen.append(n)
    out = []
    for n in chosen:
        if n == "LogAmount":
            out.append({"feature": n, "value": round(math.log1p(amount), 1)})
        else:
            _, mu, sd = INDICATORS[n]
            out.append({"feature": n, "value": round(random.gauss(mu, sd), 1)})
    return out


def tier(rank):
    if rank <= math.ceil(0.10 * K):
        return "HOLD & CALL CUSTOMER"
    if rank <= math.ceil(0.50 * K):
        return "PRIORITY REVIEW (same day)"
    return "STANDARD REVIEW"


pool = []
for _ in range(POOL):
    r = random.random()
    if r < 0.06:
        p = random.betavariate(8, 1.6)
    elif r < 0.25:
        p = random.betavariate(2, 12)
    else:
        p = random.betavariate(1, 60)
    amount = round(min(max(math.exp(random.gauss(4.2, 1.5)), 0.5), 8000), 2)
    pool.append((p * amount - REVIEW_COST, p, amount))

pool.sort(reverse=True)
top = pool[:K]

alerts = []
for i, (benefit, p, amount) in enumerate(top, start=1):
    p = min(p, 0.999)
    hour = random.choices(range(24), [5, 5, 5, 4, 4, 3] + [1] * 18)[0] if p > 0.6 else random.randrange(24)
    ind = pick_indicators(amount)
    act = tier(i)
    ind_str = ", ".join(f"{d['feature']}={d['value']:+.1f}" for d in ind)
    alerts.append({
        "rank": i,
        "risk_score": round(math.log(p / (1 - p)) * 1.6, 3),
        "fraud_probability": round(p, 4),
        "amount": amount,
        "expected_loss_avoided": round(p * amount, 2),
        "expected_net_benefit": round(benefit, 2),
        "hour": hour,
        "indicators": ind,
        "action": act,
        "note": (f"#{i} | P(fraud) {p:.0%} | amount {amount:,.2f} units at hour {hour:02d} "
                 f"| model indicators: {ind_str} | action: {act}"),
        "status": "PENDING_APPROVAL",
        "actual_class": 1 if random.random() < p else 0,
    })

tp = sum(a["actual_class"] for a in alerts)
fn = random.randint(24, 40)
missed_loss = sum(min(math.exp(random.gauss(3.4, 1.4)), 3000) for _ in range(fn))
caught_loss = sum(a["amount"] for a in alerts if a["actual_class"] == 1)
day_frauds = tp + fn
cost_no_model = caught_loss + missed_loss
cost_policy = missed_loss + K * REVIEW_COST

summary = {
    "data_source": "synthetic-sample",
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    "policy": "cost-sensitive",
    "indicator_method": "SHAP",
    "alerts_per_day": K,
    "rows_scored": ROWS_SCORED,
    "day_frauds": day_frauds,
    "base_rate": day_frauds / ROWS_SCORED,
    "tp": tp, "fp": K - tp, "fn": fn,
    "precision_at_k": tp / K,
    "recall_at_k": tp / day_frauds,
    "pr_auc": 0.81,
    "cost_no_model": round(cost_no_model, 2),
    "cost_policy": round(cost_policy, 2),
    "savings": round(cost_no_model - cost_policy, 2),
    "cost_reduction_pct": round(100 * (cost_no_model - cost_policy) / cost_no_model, 1),
    "stability": 0.67,
    "unit": "units",
    "assumptions": {"review_cost": REVIEW_COST, "loss_rate": 1.0,
                    "fixed_fraud_cost": 0.0, "false_alarm_friction": 0.0},
}

out = os.path.join(os.path.dirname(__file__), "..", "public", "data")
os.makedirs(out, exist_ok=True)
with open(os.path.join(out, "alert_queue.json"), "w") as f:
    json.dump(alerts, f, indent=1)
with open(os.path.join(out, "summary.json"), "w") as f:
    json.dump(summary, f, indent=1)
print(f"Wrote {len(alerts)} alerts | {tp} frauds in queue | savings {summary['savings']:,.0f} units")
