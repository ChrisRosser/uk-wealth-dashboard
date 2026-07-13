import { useMemo } from "react";
import { tax as t, distribution as dist } from "../data";
import { gbp, pct } from "../lib";
import { billionaire, taxForHousehold } from "../taxModel";

// Round to a friendly whole-thousands figure, e.g. 922,000 -> "920,000".
const roundish = (n: number) => (Math.round(n / 10_000) * 10_000).toLocaleString("en-GB");

export default function WhatItPaysFor() {
  const p = t.payFor;

  // The extra revenue: the top 0.1% paying the median household's wealth rate.
  const top01Wealth = t.taxTake.totalHouseholdWealthGbp * t.taxTake.top01WealthShare;
  const medianWealth = dist.thresholds.p50;
  const medianWealthRate = useMemo(
    () => taxForHousehold(35_000, medianWealth, t, { investedWealthGbp: 0 }).total / medianWealth,
    [medianWealth]
  );
  const bill = useMemo(() => billionaire(t), []);
  const extra = top01Wealth * (medianWealthRate - bill.pctOfWealth);

  const taxCutPence = Math.round(extra / p.taxCutPerPennyGbp);
  const nurses = extra / p.nurseCostGbp;
  const doctors = extra / p.doctorCostGbp;
  const teachers = extra / p.teacherCostGbp;
  const defencePct = Math.round((extra / p.defenceBudgetGbp) * 100);

  return (
    <section className="taketake">
      <h2>What could this pay for?</h2>
      <p className="tax-intro">
        This isn&apos;t about a bigger state. That extra{" "}
        <strong>{gbp(extra)}</strong> a year — from asking the wealthiest to pay
        tax on their wealth at the same rate you already do — is a choice. Each
        year, the same money could instead fund any one of these:
      </p>

      <div className="payfor">
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">{taxCutPence}p</p>
          <p className="payfor-label">off the basic rate of income tax</p>
          <p className="payfor-note">20% → {20 - taxCutPence}%, for every worker</p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{roundish(nurses)}</p>
          <p className="payfor-label">more nurses</p>
          <p className="payfor-note">
            or {roundish(doctors)} doctors — over double the NHS front line
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{roundish(teachers)}</p>
          <p className="payfor-label">more teachers</p>
          <p className="payfor-note">far more than England employs today</p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">+{defencePct}%</p>
          <p className="payfor-label">bigger defence budget</p>
          <p className="payfor-note">
            the £{Math.round(p.defenceBudgetGbp / 1e9)}bn budget, up by two-thirds
          </p>
        </div>
      </div>

      <details className="tax-assumptions">
        <summary>Sources &amp; how this is worked out</summary>
        <p>{p.note}</p>
        <ul>
          <li>Extra revenue: the top 0.1% ({gbp(top01Wealth)}) taxed at the median {pct(medianWealthRate)} of wealth instead of {pct(bill.pctOfWealth)} = {gbp(extra)}/yr</li>
          <li>Tax cut: {gbp(p.taxCutPerPennyGbp)} for each 1p off the basic rate (HMRC)</li>
          <li>Staff (full cost incl. pension &amp; NI): ~{gbp(p.nurseCostGbp)}/nurse, {gbp(p.doctorCostGbp)}/doctor, {gbp(p.teacherCostGbp)}/teacher</li>
          <li>Defence: {gbp(p.defenceBudgetGbp)} budget (2024–25)</li>
        </ul>
      </details>
    </section>
  );
}
