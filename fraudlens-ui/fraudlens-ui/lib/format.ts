export const fmtNum = (x: number, d = 0) =>
  x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtAmt = (x: number, unit: string, d = 2) => `${fmtNum(x, d)} ${unit}`;

export const fmtPct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;

export const fmtSigned = (x: number, d = 1) =>
  `${x >= 0 ? "+" : "\u2212"}${Math.abs(x).toFixed(d)}`;

export const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;
