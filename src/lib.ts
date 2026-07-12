import type { Distribution } from "./types";

/** Format a GBP amount compactly: £16,500 / £1.2m / £8.1bn. */
export function gbp(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `£${trim(value / 1e12)}tn`;
  if (abs >= 1e9) return `£${trim(value / 1e9)}bn`;
  if (abs >= 1e6) return `£${trim(value / 1e6)}m`;
  if (abs >= 1e5) return `£${Math.round(value / 1000)}k`;
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Percentage with sensible precision (0.407 -> "41%", 0.0026 -> "0.3%"). */
export function pct(fraction: number, dp = 0): string {
  const v = fraction * 100;
  if (v === 0) return "0%";
  const digits = v < 1 ? 1 : dp;
  return `${v.toFixed(digits)}%`;
}

/**
 * Estimate the population percentile (0..1) for a given household net worth,
 * by interpolating in log-wealth space between the published percentile
 * thresholds. Below the lowest / above the highest anchor we clamp, because
 * the survey does not resolve those tails — the result is an approximation.
 */
export function percentileForWealth(wealth: number, d: Distribution): number {
  const t = d.thresholds;
  // (cumulative population share, wealth threshold)
  const anchors: [number, number][] = [
    [0.1, t.p10],
    [0.5, t.p50],
    [0.9, t.p90],
    [0.99, t.p99],
    [0.999, t.p999],
  ];

  if (wealth <= anchors[0][1]) return clamp(0.1 * (wealth / anchors[0][1]), 0.001, 0.1);
  const last = anchors[anchors.length - 1];
  if (wealth >= last[1]) return 0.999;

  for (let i = 0; i < anchors.length - 1; i++) {
    const [p0, w0] = anchors[i];
    const [p1, w1] = anchors[i + 1];
    if (wealth >= w0 && wealth <= w1) {
      const f = (Math.log(wealth) - Math.log(w0)) / (Math.log(w1) - Math.log(w0));
      return p0 + f * (p1 - p0);
    }
  }
  return last[0];
}

/** Cumulative share of total wealth held by the bottom `p` of households. */
export function wealthShareBelow(p: number, d: Distribution): number {
  const pts = d.lorenz;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (p >= x0 && p <= x1) {
      const f = (p - x0) / (x1 - x0);
      return y0 + f * (y1 - y0);
    }
  }
  return 1;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
