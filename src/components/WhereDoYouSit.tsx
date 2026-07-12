import { useMemo } from "react";
import { distribution as d } from "../data";
import { gbp, pct, percentileForWealth, wealthShareBelow } from "../lib";
import LorenzCurve from "./LorenzCurve";

export default function WhereDoYouSit({ netWealth }: { netWealth: number }) {
  const result = useMemo(() => {
    if (netWealth <= 0) return null;
    const p = percentileForWealth(netWealth, d);
    const y = wealthShareBelow(p, d);
    return { p, y };
  }, [netWealth]);

  const marker = result ? { p: result.p, y: result.y, label: "You" } : null;

  return (
    <section className="wdys">
      <h2>Where do you sit?</h2>
      <p className="wdys-intro">
        Using your net wealth of <strong>{gbp(netWealth)}</strong> from the boxes
        above (investments + home equity), here is where your household falls.
      </p>

      {result && (
        <p className="wdys-result">
          Your household is wealthier than about <strong>{pct(result.p)}</strong>{" "}
          of households in Great Britain. Everyone from the bottom up to you owns
          roughly <strong>{pct(result.y)}</strong> of all wealth between them —
          leaving <strong>{pct(1 - result.y)}</strong> for the wealthiest{" "}
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
