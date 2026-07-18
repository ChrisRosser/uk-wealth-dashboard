import { useMemo } from "react";
import { tax as t } from "../data";
import { gbp } from "../lib";
import { billionaire } from "../taxModel";

const commas = (n: number) => n.toLocaleString("en-GB");
const roundish = (n: number) => (Math.round(n / 10_000) * 10_000).toLocaleString("en-GB");

export default function WhatItPaysFor({ incomeRate }: { incomeRate: number }) {
  const p = t.payFor;
  const bill = useMemo(() => billionaire(t), []);

  // Extra revenue: the top 0.1% paying YOUR effective income rate on the income
  // their wealth earns.
  const top01Wealth = t.taxTake.totalHouseholdWealthGbp * t.taxTake.top01WealthShare;
  const econIncome = top01Wealth * (t.billionaire.economicReturnPct / 100);
  const extra = Math.max(0, econIncome * (incomeRate - bill.pctOfEconomicIncome));

  // Tax cuts
  const incomeCutP = Math.round(extra / p.taxCutPerPennyGbp);
  const corpCutP = Math.round(extra / p.corpTaxPerPointGbp);
  const vatCutP = Math.round(extra / p.vatPerPointGbp);
  const councilCutPct = Math.round((extra / p.councilTaxGbp) * 100);

  // Spending
  const nhsMultiple = 1 + extra / (p.nhsNurses * p.nurseCostGbp + p.nhsDoctors * p.doctorCostGbp);
  const policeMultiple = 1 + extra / (p.policeOfficers * p.policeCostGbp);
  const teacherMultiple = 1 + extra / (p.teacherCount * p.teacherCostGbp);
  const homes = extra / p.homeGrantGbp;
  const povertyMultiple = extra / p.childPovertyGbp;
  const sureStartMultiple = extra / p.sureStartGbp;

  return (
    <section className="taketake">
      <h2>What could this pay for?</h2>
      <p className="tax-intro">
        This isn&apos;t about a bigger state. That extra{" "}
        <strong>{gbp(extra)}</strong> a year — from the very wealthiest paying the
        same share of their income in tax as you already do — is a choice. Each
        year, the same money could <strong>cut taxes</strong>:
      </p>

      <div className="payfor">
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">{incomeCutP}p</p>
          <p className="payfor-label">off income tax</p>
          <p className="payfor-note">basic rate 20% → {20 - incomeCutP}%</p>
        </div>
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">{corpCutP}p</p>
          <p className="payfor-label">off corporation tax</p>
          <p className="payfor-note">
            {p.corpTaxRatePct}% → {p.corpTaxRatePct - corpCutP}%, for every business
          </p>
        </div>
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">{vatCutP}p</p>
          <p className="payfor-label">off VAT</p>
          <p className="payfor-note">
            {p.vatRatePct}% → {p.vatRatePct - vatCutP}%, on the high street
          </p>
        </div>
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">−{councilCutPct}%</p>
          <p className="payfor-label">off everyone&apos;s council tax</p>
          <p className="payfor-note">
            a cut in the ~£{Math.round(p.councilTaxGbp / 1e9)}bn bill households pay
          </p>
        </div>
      </div>

      <p className="tax-intro">…or spend it on the services people value most:</p>

      <div className="payfor">
        <div className="payfor-card">
          <p className="payfor-value">{nhsMultiple.toFixed(1)}×</p>
          <p className="payfor-label">the doctors &amp; nurses in the NHS</p>
          <p className="payfor-note">
            {commas(p.nhsNurses + p.nhsDoctors)} work in the NHS today
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{policeMultiple.toFixed(1)}×</p>
          <p className="payfor-label">the police officers on the streets</p>
          <p className="payfor-note">
            {commas(p.policeOfficers)} serve in England &amp; Wales today
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{teacherMultiple.toFixed(1)}×</p>
          <p className="payfor-label">the teachers in our schools</p>
          <p className="payfor-note">{commas(p.teacherCount)} teach in England today</p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{roundish(homes)}</p>
          <p className="payfor-label">new council houses a year</p>
          <p className="payfor-note">
            ~£{Math.round(p.homeGrantGbp / 1000)}k grant each; a build programme
            repays itself within 3 years (CEBR)
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{povertyMultiple.toFixed(0)}×</p>
          <p className="payfor-label">
            the cost of lifting {commas(p.childPovertyChildren)} children out of poverty
          </p>
          <p className="payfor-note">
            via £17/week on Universal Credit&apos;s child element (CPAG)
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{sureStartMultiple.toFixed(0)}×</p>
          <p className="payfor-label">Sure Start rebuilt in every community</p>
          <p className="payfor-note">
            IFS: +3 GCSE grades for the poorest children; NHS savings repaid a
            third of its cost
          </p>
        </div>
      </div>

      <details className="tax-assumptions">
        <summary>Sources &amp; how this is worked out</summary>
        <p>{p.note}</p>
        <ul>
          <li>
            Extra revenue: the top 0.1% pay your {Math.round(incomeRate * 100)}%
            income rate on the {gbp(econIncome)} their {gbp(top01Wealth)} of wealth
            earns, instead of ~{Math.round(bill.pctOfEconomicIncome * 100)}% = {gbp(extra)}/yr
          </li>
          <li>
            Tax cuts (HMRC ready reckoner): {gbp(p.taxCutPerPennyGbp)} per 1p on income
            tax, {gbp(p.vatPerPointGbp)} per VAT point, {gbp(p.corpTaxPerPointGbp)} per
            corporation-tax point; council tax raises ~{gbp(p.councilTaxGbp)} (England)
          </li>
          <li>
            NHS: {commas(p.nhsDoctors)} doctors + {commas(p.nhsNurses)} nurses, at
            ~{gbp(p.doctorCostGbp)} / {gbp(p.nurseCostGbp)} each; police {commas(p.policeOfficers)}{" "}
            at ~{gbp(p.policeCostGbp)}; teachers {commas(p.teacherCount)} at ~{gbp(p.teacherCostGbp)}
          </li>
          <li>
            Council houses at ~{gbp(p.homeGrantGbp)} government grant each (NHF);
            CEBR find a 90,000-homes-a-year programme breaks even within 3 years
          </li>
          <li>
            Child poverty: {gbp(p.childPovertyGbp)} on the UC child element lifts{" "}
            {commas(p.childPovertyChildren)} children out of poverty (CPAG); Sure
            Start at its peak cost ~{gbp(p.sureStartGbp)} a year in today&apos;s
            prices (IFS)
          </li>
        </ul>
      </details>
    </section>
  );
}
