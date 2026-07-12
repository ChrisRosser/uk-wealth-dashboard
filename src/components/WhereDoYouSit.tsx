import { useMemo, useState } from "react";
import { distribution as d } from "../data";
import { gbp, pct, percentileForWealth, wealthShareBelow } from "../lib";
import LorenzCurve from "./LorenzCurve";

const PRESETS = [
  { label: "£50k", value: 50_000 },
  { label: "Median £294k", value: d.thresholds.p50 },
  { label: "£1m", value: 1_000_000 },
  { label: "£3m", value: d.thresholds.p99 },
];

export default function WhereDoYouSit() {
  const [raw, setRaw] = useState(String(d.thresholds.p50));

  const wealth = useMemo(() => {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [raw]);

  const result = useMemo(() => {
    if (wealth == null) return null;
    const p = percentileForWealth(wealth, d);
    const y = wealthShareBelow(p, d);
    return { p, y };
  }, [wealth]);

  const marker = result
    ? { p: result.p, y: result.y, label: "You" }
    : null;

  return (
    <section className="wdys">
      <h2>Where do you sit?</h2>
      <p className="wdys-intro">
        Enter a household net worth — property, pensions, savings and
        possessions, minus debts — to see where it falls.
      </p>

      <div className="wdys-input">
        <span className="wdys-prefix">£</span>
        <input
          inputMode="numeric"
          aria-label="Household net worth in pounds"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="293,700"
        />
      </div>

      <div className="wdys-presets">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => setRaw(String(p.value))}>
            {p.label}
          </button>
        ))}
      </div>

      {result && (
        <p className="wdys-result">
          A household worth <strong>{gbp(wealth!)}</strong> is wealthier than
          about <strong>{pct(result.p)}</strong> of households in Great Britain.
          Everyone from the bottom up to them owns roughly{" "}
          <strong>{pct(result.y)}</strong> of all wealth between them — leaving{" "}
          <strong>{pct(1 - result.y)}</strong> for the wealthiest{" "}
          <strong>{pct(1 - result.p)}</strong>.
        </p>
      )}

      <LorenzCurve points={d.lorenz} marker={marker} />

      <p className="wdys-foot">
        The diagonal is perfect equality; the curve bowing away from it is the
        inequality. Position is an estimate interpolated from published ONS
        percentile thresholds ({d.meta.period}); the very top is not precisely
        resolved by the survey.
      </p>
    </section>
  );
}
