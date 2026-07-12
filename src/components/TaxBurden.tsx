import { useMemo, useState } from "react";
import { tax as t } from "../data";
import { gbp, pct } from "../lib";
import { billionaire, ordinaryCurve, taxForHousehold } from "../taxModel";
import TaxRateChart from "./TaxRateChart";

function useNumber(initial: number) {
  const [raw, setRaw] = useState(String(initial));
  const value = useMemo(() => {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [raw]);
  return { raw, setRaw, value };
}

export default function TaxBurden() {
  const income = useNumber(35_000);
  const wealth = useNumber(294_000);

  const you = useMemo(
    () =>
      income.value != null && wealth.value != null
        ? taxForHousehold(income.value, wealth.value, t)
        : null,
    [income.value, wealth.value]
  );

  const bill = useMemo(() => billionaire(t), []);
  const b = t.billionaire;

  return (
    <section className="tax">
      <h2>What share goes in tax?</h2>
      <p className="tax-intro">
        Income tax looks progressive — but it is only part of the story. Add
        National Insurance, VAT, duties and council tax, and the burden as a
        share of income is <strong>remarkably flat</strong>: the ONS finds the
        poorest fifth pay about <strong>37%</strong> of their income in tax, the
        richest fifth about <strong>36%</strong>. Then, at the very top, it{" "}
        <em>falls</em>.
      </p>

      <div className="tax-inputs">
        <label>
          <span>Your annual income</span>
          <div className="wdys-input">
            <span className="wdys-prefix">£</span>
            <input
              inputMode="numeric"
              value={income.raw}
              onChange={(e) => income.setRaw(e.target.value)}
              aria-label="Your annual income in pounds"
            />
          </div>
        </label>
        <label>
          <span>Your household wealth</span>
          <div className="wdys-input">
            <span className="wdys-prefix">£</span>
            <input
              inputMode="numeric"
              value={wealth.raw}
              onChange={(e) => wealth.setRaw(e.target.value)}
              aria-label="Your household wealth in pounds"
            />
          </div>
        </label>
      </div>

      {you && (
        <div className="tax-compare">
          <div className="tax-col">
            <p className="tax-col-title">You</p>
            <p className="tax-big">{pct(you.pctOfIncome)}</p>
            <p className="tax-sub">of your income goes in tax each year</p>
            {you.pctOfWealth != null && (
              <p className="tax-wealth">
                = <strong>{pct(you.pctOfWealth)}</strong> of everything you own
              </p>
            )}
          </div>
          <div className="tax-vs">vs</div>
          <div className="tax-col tax-col-bill">
            <p className="tax-col-title">The UK&apos;s poorest billionaire</p>
            <p className="tax-big">{pct(bill.pctOfEconomicIncome)}</p>
            <p className="tax-sub">of their (economic) income goes in tax</p>
            <p className="tax-wealth">
              = <strong>{pct(bill.pctOfWealth)}</strong> of everything they own
            </p>
          </div>
        </div>
      )}

      {you && (
        <div className="tax-breakdown">
          <h3>Your bill, broken down</h3>
          <ul>
            <Row label="Income tax" amount={you.incomeTax} income={income.value!} />
            <Row label="National Insurance" amount={you.nationalInsurance} income={income.value!} />
            <Row label="VAT & duties (estimated)" amount={you.vatAndDuties} income={income.value!} />
            <Row label="Council tax (estimated)" amount={you.councilTax} income={income.value!} />
            <Row label="Total" amount={you.total} income={income.value!} total />
          </ul>
        </div>
      )}

      <TaxRateChart
        ordinary={ordinaryCurve(t)}
        user={
          you && income.value != null
            ? { income: income.value, rate: you.pctOfIncome, label: "You" }
            : null
        }
        billionaire={{
          income: bill.economicIncome,
          rate: bill.pctOfEconomicIncome,
          label: "Billionaire",
        }}
      />

      <p className="tax-callout">
        At the very top the rate keeps falling. Advani, Hughson &amp; Summers
        found effective rates peak at <strong>~38%</strong> around £500k of
        income, then drop <strong>below 30%</strong> above £3m — a quarter of
        those with £3m+ paid <strong>12% or less</strong>. Not through dodges;
        it is how the system taxes capital gains and dividends.
      </p>

      <details className="tax-assumptions">
        <summary>Assumptions for the billionaire benchmark</summary>
        <p>{b.note}</p>
        <ul>
          <li>Wealth: {gbp(b.wealthGbp)}</li>
          <li>Total annual return (incl. unrealised): {b.economicReturnPct}% = {gbp(bill.economicIncome)}</li>
          <li>Realised, taxable income: {b.realisedTaxableYieldPct}% of wealth = {gbp(bill.realisedTaxable)}</li>
          <li>Effective rate on that realised income: {b.effectiveRateOnRealisedPct}% (Advani et al.)</li>
          <li>→ Tax paid ≈ {gbp(bill.tax)} — {pct(bill.pctOfWealth)} of wealth, {pct(bill.pctOfEconomicIncome)} of economic income</li>
        </ul>
        <p className="tax-scope">
          Your income tax &amp; NI are computed from 2025/26 bands; VAT and
          council tax are imputed from ONS figures for a household at your
          income. The chart line is ONS all-taxes as a share of gross income by
          income quintile ({t.meta.period}).
        </p>
      </details>
    </section>
  );
}

function Row({
  label,
  amount,
  income,
  total,
}: {
  label: string;
  amount: number;
  income: number;
  total?: boolean;
}) {
  return (
    <li className={total ? "tax-row tax-row-total" : "tax-row"}>
      <span>{label}</span>
      <span className="tax-row-amt">{gbp(amount)}</span>
      <span className="tax-row-pct">{pct(amount / income)}</span>
    </li>
  );
}
