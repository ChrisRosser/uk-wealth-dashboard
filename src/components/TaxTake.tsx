import { useMemo } from "react";
import { tax as t } from "../data";
import { gbp, pct } from "../lib";
import { billionaire } from "../taxModel";

const GB_HOUSEHOLDS = 28_400_000; // ONS, ~28.4m households

// Trillions with 2 dp, so £1.14tn vs £1.16tn stays visibly different.
const tn = (v: number) => `£${(v / 1e12).toFixed(2)}tn`;

export default function TaxTake() {
  const tt = t.taxTake;

  // "Median household" effective rate = ONS middle income quintile, all taxes.
  const medianRate = t.quintiles.allTaxesPctGross[2] / 100;

  // What the ultra-wealthy pay on the income their wealth earns (this
  // dashboard's own billionaire figure).
  const bill = useMemo(() => billionaire(t), []);
  const topRate = bill.pctOfEconomicIncome;

  const top01Wealth = tt.totalHouseholdWealthGbp * tt.top01WealthShare;
  const econIncome = top01Wealth * (t.billionaire.economicReturnPct / 100);
  const currentTopTax = econIncome * topRate;
  const fairTopTax = econIncome * medianRate;
  const extra = fairTopTax - currentTopTax;
  const newTake = tt.currentReceiptsGbp + extra;
  const perHousehold = extra / GB_HOUSEHOLDS;

  return (
    <section className="taketake">
      <h2>The UK&apos;s tax take</h2>
      <p className="tax-intro">
        The UK government raises about <strong>{tn(tt.currentReceiptsGbp)}</strong>{" "}
        a year. Most of it comes from ordinary households already paying around{" "}
        <strong>{pct(medianRate)}</strong> of their income. But the wealthiest pay
        far less on the income their wealth earns — the top 0.1% only about{" "}
        <strong>{pct(topRate)}</strong>. If they paid the median household&apos;s
        rate instead, the take would rise like this:
      </p>

      <div className="take-compare">
        <div className="take-col">
          <p className="take-label">Tax take today</p>
          <p className="take-big">{tn(tt.currentReceiptsGbp)}</p>
          <p className="take-sub">2024–25 government receipts</p>
        </div>
        <div className="take-arrow" aria-hidden="true">→</div>
        <div className="take-col take-col-hi">
          <p className="take-label">If the top 0.1% paid the median rate</p>
          <p className="take-big">{tn(newTake)}</p>
          <p className="take-sub">
            <strong>+{gbp(extra)}</strong> a year — about {gbp(perHousehold)} per
            household
          </p>
        </div>
      </div>

      <details className="tax-assumptions">
        <summary>How this is worked out</summary>
        <p>{tt.note}</p>
        <ul>
          <li>Top 0.1% wealth: {pct(tt.top01WealthShare)} of {gbp(tt.totalHouseholdWealthGbp)} = {gbp(top01Wealth)}</li>
          <li>Earning {t.billionaire.economicReturnPct}% a year = {gbp(econIncome)} of economic income</li>
          <li>Taxed now at ~{pct(topRate)} = {gbp(currentTopTax)}; at the median {pct(medianRate)} = {gbp(fairTopTax)}</li>
          <li>→ Extra ≈ {gbp(extra)} a year on top of {gbp(tt.currentReceiptsGbp)}</li>
        </ul>
        <p className="tax-scope">
          Almost everyone already pays close to the median rate, so applying it to
          the whole population changes little — the gap is concentrated at the very
          top. Uses this dashboard&apos;s own top-rate and return assumptions;
          illustrative, not a forecast.
        </p>
      </details>
    </section>
  );
}
