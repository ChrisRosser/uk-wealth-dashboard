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

  const taxCutPence = Math.round(extra / p.taxCutPerPennyGbp);
  const nhsCost = p.nhsNurses * p.nurseCostGbp + p.nhsDoctors * p.doctorCostGbp;
  const nhsMultiple = 1 + extra / nhsCost;
  const teacherMultiple = 1 + extra / (p.teacherCount * p.teacherCostGbp);
  const policeMultiple = 1 + extra / (p.policeOfficers * p.policeCostGbp);
  const uniMultiple = extra / p.freeUniversityGbp;
  const childcareMultiple = extra / p.freeChildcareGbp;
  const socialCareMultiple = extra / p.socialCareGbp;
  const homes = extra / p.homeGrantGbp;
  const defencePct = Math.round((extra / p.defenceBudgetGbp) * 100);

  return (
    <section className="taketake">
      <h2>What could this pay for?</h2>
      <p className="tax-intro">
        This isn&apos;t about a bigger state. That extra{" "}
        <strong>{gbp(extra)}</strong> a year — from the very wealthiest paying the
        same share of their income in tax as you already do — is a choice. Each
        year, the same money could instead fund any one of these:
      </p>

      <div className="payfor">
        <div className="payfor-card payfor-card-lead">
          <p className="payfor-value">{taxCutPence}p</p>
          <p className="payfor-label">off the basic rate of income tax</p>
          <p className="payfor-note">20% → {20 - taxCutPence}%, for every worker</p>
        </div>
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
          <p className="payfor-note">
            {commas(p.teacherCount)} teach in England today
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{uniMultiple.toFixed(1)}×</p>
          <p className="payfor-label">free university tuition</p>
          <p className="payfor-note">
            over the ~£{Math.round(p.freeUniversityGbp / 1e9)}bn cost of scrapping
            fees (IFS)
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{childcareMultiple.toFixed(1)}×</p>
          <p className="payfor-label">free childcare</p>
          <p className="payfor-note">
            over the ~£{Math.round(p.freeChildcareGbp / 1e9)}bn free-hours offer
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{socialCareMultiple.toFixed(1)}×</p>
          <p className="payfor-label">free social care</p>
          <p className="payfor-note">
            over the ~£{Math.round(p.socialCareGbp / 1e9)}bn cost of free personal
            care (Health Foundation)
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">{roundish(homes)}</p>
          <p className="payfor-label">new social homes a year</p>
          <p className="payfor-note">
            at the ~£{Math.round(p.homeGrantGbp / 1000)}k grant each (NHF)
          </p>
        </div>
        <div className="payfor-card">
          <p className="payfor-value">+{defencePct}%</p>
          <p className="payfor-label">bigger defence budget</p>
          <p className="payfor-note">
            on top of today&apos;s £{Math.round(p.defenceBudgetGbp / 1e9)}bn
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
          <li>Tax cut: {gbp(p.taxCutPerPennyGbp)} for each 1p off the basic rate (HMRC)</li>
          <li>
            NHS: {commas(p.nhsDoctors)} doctors + {commas(p.nhsNurses)} nurses, at
            ~{gbp(p.doctorCostGbp)} / {gbp(p.nurseCostGbp)} full cost each
          </li>
          <li>Schools: {commas(p.teacherCount)} teachers at ~{gbp(p.teacherCostGbp)} each</li>
          <li>Police: {commas(p.policeOfficers)} officers at ~{gbp(p.policeCostGbp)} full cost each</li>
          <li>Free university {gbp(p.freeUniversityGbp)} (IFS) · free childcare {gbp(p.freeChildcareGbp)} (Commons) · free social care {gbp(p.socialCareGbp)} (Health Foundation)</li>
          <li>Social homes at ~{gbp(p.homeGrantGbp)} government grant each (NHF)</li>
          <li>Defence: {gbp(p.defenceBudgetGbp)} budget (2024–25)</li>
        </ul>
      </details>
    </section>
  );
}
