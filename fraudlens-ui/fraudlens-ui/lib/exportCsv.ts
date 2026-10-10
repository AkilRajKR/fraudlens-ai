import type { Alert, Decision } from "./types";

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Download the queue with each analyst decision as a CSV file. */
export function downloadDecisions(alerts: Alert[], decisions: Record<number, Decision>) {
  const header = [
    "Rank",
    "Priority",
    "Amount",
    "Fraud_probability",
    "Expected_net_benefit",
    "Decision",
    "Analyst_Note",
  ];
  const rows = alerts.map((a) =>
    [
      a.rank,
      a.action,
      a.amount.toFixed(2),
      a.fraud_probability.toFixed(4),
      a.expected_net_benefit.toFixed(2),
      decisions[a.rank] ?? "pending",
      a.note,
    ]
      .map(esc)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "alert_decisions.csv";
  link.click();
  URL.revokeObjectURL(url);
}
