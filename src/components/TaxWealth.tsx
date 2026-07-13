import { useMemo } from "react";
import { tax as t, distribution as dist } from "../data";
import { gbp, pct } from "../lib";
import { billionaire, taxForHousehold } from "../taxModel";

// A stable "median household" for the wealth-rate: median net wealth (ONS) with
// a roughly median income, and no taxable investments (home + pension).
const MEDIAN_INCOME = 35_000;

export default function TaxWealth() {
  const medianWealth = dist.thresholds.p50; // ONS median household net wealth
  const medianTax = useMemo(
    () => taxForHousehold(MEDIAN_INCOME, medianWealth, t, { investedWealthGbp: 0 }).total,
    [medianWealth]
  );
  const medianWealthRate = medianTax / medianWealth;

  const bill = useMemo(() => billionaire(t), []);
  const billNow = bill.total;
  const billAtMedian = t.billionaire.wealthGbp * medianWealthRate;
  const multiple = Math.round(billAtMedian / billNow);

  const top01Wealth = t.taxTake.totalHouseholdWealthGbp * t.taxTake.top01WealthShare;
  const top01Now = top01Wealth * bill.pctOfWealth;
  const top01AtMedian = top01Wealth * medianWealthRate;
  const extraTop01 = top01AtMedian - top01Now;

  return (
    <section className="taketake">
      <h2>What if we taxed wealth, not work?</h2>
      <p className="tax-intro">
        The UK taxes work far more than wealth. Measured against everything they
        own, the median household effectively pays about{" "}
        <strong>{pct(medianWealthRate)}</strong> of its wealth in tax each year —
        a billionaire, just <strong>{pct(bill.pctOfWealth)}</strong>. Here is what
        changes if everyone paid the median proportion of their wealth.
      </p>

      <div className="take-compare">
        <div className="take-col">
          <p className="take-label">A billionaire pays today</p>
          <p className="take-big">{gbp(billNow)}</p>
          <p className="take-sub">{pct(bill.pctOfWealth)} of their £1bn — taxed on income, not wealth</p>
        </div>
        <div className="take-arrow" aria-hidden="true">→</div>
        <div className="take-col take-col-hi">
          <p className="take-label">At the median {pct(medianWealthRate)} of wealth</p>
          <p className="take-big">{gbp(billAtMedian)}</p>
          <p className="take-sub">
            <strong>{multiple}× more</strong> — the rate ordinary households
            already pay
          </p>
        </div>
      </div>

      <p className="tax-intro">
        The wealthiest 0.1% own <strong>{gbp(top01Wealth)}</strong> but contribute
        only about <strong>{gbp(top01Now)}</strong> on it. At the median
        household&apos;s rate they would pay <strong>{gbp(top01AtMedian)}</strong>{" "}
        — an extra <strong>{gbp(extraTop01)}</strong> a year from roughly 60,000
        people.
      </p>

      <details className="tax-assumptions">
        <summary>How this is worked out</summary>
        <ul>
          <li>Median household: {gbp(MEDIAN_INCOME)} income, {gbp(medianWealth)} net wealth (ONS median) → {gbp(medianTax)} tax = {pct(medianWealthRate)} of wealth</li>
          <li>Billionaire: {gbp(t.billionaire.wealthGbp)}; pays {gbp(billNow)} now ({pct(bill.pctOfWealth)}), {gbp(billAtMedian)} at the median rate</li>
          <li>Top 0.1%: {pct(t.taxTake.top01WealthShare)} of {gbp(t.taxTake.totalHouseholdWealthGbp)} = {gbp(top01Wealth)}; {gbp(top01Now)} now → {gbp(top01AtMedian)}</li>
        </ul>
        <p className="tax-scope">
          Illustrative, not a policy. {pct(medianWealthRate)} a year is a steep
          wealth tax — but it is simply the share of their wealth that ordinary
          households already hand over through income and consumption taxes, shown
          here as a like-for-like comparison.
        </p>
      </details>
    </section>
  );
}
