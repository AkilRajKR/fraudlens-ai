import type { Tier } from "./types";

export interface TierMeta {
  key: Tier;
  short: string;
  css: "hold" | "prio" | "std";
  hint: string;
}

export const TIERS: TierMeta[] = [
  {
    key: "HOLD & CALL CUSTOMER",
    short: "Hold & call",
    css: "hold",
    hint: "Hold the transaction and call the customer.",
  },
  {
    key: "PRIORITY REVIEW (same day)",
    short: "Priority",
    css: "prio",
    hint: "Review today, before the standard queue.",
  },
  {
    key: "STANDARD REVIEW",
    short: "Standard",
    css: "std",
    hint: "Review in the normal course of the day.",
  },
];

export const tierMeta = (t: Tier): TierMeta =>
  TIERS.find((x) => x.key === t) ?? TIERS[2];
