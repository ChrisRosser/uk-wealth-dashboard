import { useMemo, useState } from "react";
import { tax as t } from "../data";
import { gbp, pct } from "../lib";
import {
  billionaire,
  incomeTaxSteps,
  niSteps,
  ordinaryCurve,
  taxForHousehold,
  type TaxStep,
} from "../taxModel";
import TaxRateChart from "./TaxRateChart";

interface BillRow {
  label: string;
  amount: number;
  detail: string;
}

function fmtSteps(steps: TaxStep[]): string {
  return steps.map((s) => `${Math.round(s.rate * 100)}% × ${gbp(s.base)}`).join(" + ");
}

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

  const [returnPct, setReturnPct] = useState(t.billionaire.economicReturnPct);
  const bill = useMemo(() => billionaire(t, returnPct), [returnPct]);
  const b = t.billionaire;
  const cfg = t.incomeTax2025_26;

  const bGains = bill.realisedTaxable * (b.realisedGainsSharePct / 100);
  const bDivs = bill.realisedTaxable - bGains;
  const billRows: BillRow[] = [
    { label: "Income tax", amount: bill.incomeTax, detail: "No salary — a billionaire's income is investment returns, not wages." },
    { label: "National Insurance", amount: bill.nationalInsurance, detail: "Capital gains and dividends are exempt from National Insurance." },
    { label: "Capital gains tax", amount: bill.capitalGainsTax, detail: `${b.cgtRatePct}% × ${gbp(bGains)} — ${b.realisedGainsSharePct}% of the ${gbp(bill.realisedTaxable)} realised.` },
    { label: "Dividend tax", amount: bill.dividendTax, detail: `${b.dividendRatePct}% × ${gbp(bDivs)} — ${100 - b.realisedGainsSharePct}% of the ${gbp(bill.realisedTaxable)} realised.` },
    { label: "VAT & duties", amount: bill.vatAndDuties, detail: `${b.vatEffectivePct}% × ${gbp(b.annualSpendingGbp)} of lifestyle spending.` },
    { label: "Council tax", amount: bill.councilTax, detail: `One top-band home ≈ ${gbp(b.councilTaxGbp)}.` },
  ];

  const youRows: BillRow[] =
    you && income.value != null
      ? (() => {
          const inc = income.value;
          const its = incomeTaxSteps(inc, cfg);
          const nis = niSteps(inc, cfg.ni);
          return [
            { label: "Income tax", amount: you.incomeTax, detail: its.taxable <= 0 ? `Income is below the ${gbp(its.allowance)} personal allowance.` : `${gbp(its.taxable)} taxable after the ${gbp(its.allowance)} allowance → ${fmtSteps(its.steps)}.` },
            { label: "National Insurance", amount: you.nationalInsurance, detail: nis.length ? `${fmtSteps(nis)} on earnings above the ${gbp(cfg.ni.primaryThreshold)} threshold.` : `Income is below the ${gbp(cfg.ni.primaryThreshold)} NI threshold.` },
            { label: "Capital gains tax", amount: you.capitalGainsTax, detail: "No taxable gains assumed — a typical household's wealth is its home and pension." },
            { label: "Dividend tax", amount: you.dividendTax, detail: "No taxable dividend income assumed." },
            { label: "VAT & duties", amount: you.vatAndDuties, detail: `≈${pct(you.vatAndDuties / inc)} of income — the ONS rate for a household at your income.` },
            { label: "Council tax", amount: you.councilTax, detail: `≈${pct(you.councilTax / inc)} of income — the ONS rate for your income.` },
          ];
        })()
      : [];

  return (
    <section className="tax" aria-label="Your tax burden compared with a billionaire">
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

        <div className="tax-fixed">
          <span className="tax-fixed-label">
            Billionaire income <em>{returnPct}% / yr</em>
          </span>
          <div className="wdys-input wdys-input-locked">
            <span className="wdys-prefix">£</span>
            <span className="tax-fixed-val">{gbp(bill.economicIncome).slice(1)}</span>
          </div>
          <div className="tax-return">
            <input
              type="range"
              min={8}
              max={15}
              step={1}
              value={returnPct}
              onChange={(e) => setReturnPct(Number(e.target.value))}
              aria-label="Assumed annual return on the billionaire's wealth"
            />
          </div>
        </div>

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

        <div className="tax-fixed">
          <span className="tax-fixed-label">
            Billionaire wealth <em>fixed</em>
          </span>
          <div className="wdys-input wdys-input-locked">
            <span className="wdys-prefix">£</span>
            <span className="tax-fixed-val">{gbp(b.wealthGbp).slice(1)}</span>
          </div>
        </div>
      </div>

      <p className="tax-return-note">
        The return on wealth is adjustable — 8% is conservative. UBS puts
        billionaire wealth up <strong>121% over the decade</strong> (~8%/yr,
        10%/yr in 2015–20); Oxfam counts <strong>+$2tn (~15%)</strong> in 2024;
        top founders, far more. A higher return doesn&apos;t raise their tax — it
        just enlarges the untaxed, unrealised slice.
      </p>

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

      {you && income.value != null && (
        <div className="tax-breakdown">
          <h3>The bills, broken down</h3>
          <p className="tax-breakdown-note">
            Same rows for both. Amounts are per year; percentages are of each
            one&apos;s income.
          </p>
          <div className="tax-bills">
            <BillCard
              title="You"
              owner="your"
              base={income.value}
              wealthPct={you.pctOfWealth}
              total={you.total}
              rows={youRows}
            />
            <BillCard
              them
              title="The poorest billionaire"
              owner="their"
              base={bill.economicIncome}
              wealthPct={bill.pctOfWealth}
              total={bill.total}
              rows={billRows}
              foot="Wealth income pays no National Insurance or income tax; VAT and council tax are a rounding error against £1bn. Most of the gain is unrealised, so never taxed."
            />
          </div>
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
          <li>Total annual return incl. unrealised: {b.economicReturnPct}% = {gbp(bill.economicIncome)}</li>
          <li>Realised, taxable income: {b.realisedTaxableYieldPct}% of wealth = {gbp(bill.realisedTaxable)}</li>
          <li>
            Split {b.realisedGainsSharePct}% capital gains @ {b.cgtRatePct}%,{" "}
            {100 - b.realisedGainsSharePct}% dividends @ {b.dividendRatePct}%
          </li>
          <li>
            Salary {gbp(b.salaryGbp)} · lifestyle spend {gbp(b.annualSpendingGbp)}{" "}
            (VAT ~{b.vatEffectivePct}%) · council tax {gbp(b.councilTaxGbp)}
          </li>
          <li>
            → Total tax ≈ {gbp(bill.total)} — {pct(bill.pctOfWealth)} of wealth,{" "}
            {pct(bill.pctOfEconomicIncome)} of economic income
          </li>
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

function BillCard({
  title,
  owner,
  rows,
  total,
  base,
  wealthPct,
  them,
  foot,
}: {
  title: string;
  owner: string;
  rows: BillRow[];
  total: number;
  base: number;
  wealthPct: number | null;
  them?: boolean;
  foot?: string;
}) {
  return (
    <div className={them ? "tax-bill tax-bill-them" : "tax-bill"}>
      <p className="tax-bill-head">{title}</p>
      <ul>
        {rows.map((r) => (
          <Row key={r.label} label={r.label} amount={r.amount} base={base} detail={r.detail} />
        ))}
        <Row label="Total" amount={total} base={base} total />
      </ul>
      {wealthPct != null && (
        <p className="tax-bill-wealth">
          = <strong>{pct(wealthPct)}</strong> of {owner} wealth per year
        </p>
      )}
      {foot && <p className="tax-bill-foot">{foot}</p>}
    </div>
  );
}

function Row({
  label,
  amount,
  base,
  total,
  detail,
}: {
  label: string;
  amount: number;
  base: number;
  total?: boolean;
  detail?: string;
}) {
  const [open, setOpen] = useState(false);
  const canExpand = !total && !!detail;
  return (
    <li className={total ? "tax-row tax-row-total" : "tax-row"}>
      <span className="tax-row-label">
        {canExpand && (
          <button
            type="button"
            className="tax-row-toggle"
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} how ${label} is calculated`}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "−" : "+"}
          </button>
        )}
        {label}
      </span>
      <span className="tax-row-amt">{gbp(amount)}</span>
      <span className="tax-row-pct">{pct(amount / base)}</span>
      {open && detail && <span className="tax-row-detail">{detail}</span>}
    </li>
  );
}
