import { useMemo } from "react";
import { tax as t } from "../data";
import { gbp, pct } from "../lib";
import { billionaire } from "../taxModel";

const GB_HOUSEHOLDS = 28_400_000; // ONS, ~28.4m households
const tn = (v: number) => `£${(v / 1e12).toFixed(2)}tn`;

interface Props {
  incomeRate: number; // your effective tax as a share of income
  wealthRate: number | null; // your effective tax as a share of wealth
}

function Scenario({
  label,
  take,
  extra,
}: {
  label: string;
  take: number;
  extra: number;
}) {
  return (
    <div className="take-compare">
      <div className="take-col">
        <p className="take-label">Tax take today</p>
        <p className="take-big">{tn(t.taxTake.currentReceiptsGbp)}</p>
        <p className="take-sub">2024–25 government receipts</p>
      </div>
      <div className="take-arrow" aria-hidden="true">→</div>
      <div className="take-col take-col-hi">
        <p className="take-label">{label}</p>
        <p className="take-big">{tn(take)}</p>
        <p className="take-sub">
          <strong>+{gbp(extra)}</strong> a year — about {gbp(extra / GB_HOUSEHOLDS)} per
          household
        </p>
      </div>
    </div>
  );
}

export default function TaxTake({ incomeRate, wealthRate }: Props) {
  const tt = t.taxTake;
  const bill = useMemo(() => billionaire(t), []);
  const top01Wealth = tt.totalHouseholdWealthGbp * tt.top01WealthShare;
  const econIncome = top01Wealth * (t.billionaire.economicReturnPct / 100);

  const extraInc = Math.max(0, econIncome * (incomeRate - bill.pctOfEconomicIncome));
  const extraW =
    wealthRate != null ? Math.max(0, top01Wealth * (wealthRate - bill.pctOfWealth)) : 0;

  return (
    <section className="taketake">
      <h2>The UK&apos;s tax take</h2>
      <p className="tax-intro">
        The UK raises about <strong>{tn(tt.currentReceiptsGbp)}</strong> a year,
        most of it from ordinary households like you. But the wealthiest 0.1% pay
        far less on the income their wealth earns — about{" "}
        <strong>{pct(bill.pctOfEconomicIncome)}</strong>, and just{" "}
        <strong>{pct(bill.pctOfWealth)}</strong> of their wealth. If they paid what{" "}
        <em>you</em> pay:
      </p>

      <Scenario
        label={`If they paid your income rate (${pct(incomeRate)})`}
        take={tt.currentReceiptsGbp + extraInc}
        extra={extraInc}
      />

      {wealthRate != null && (
        <>
          <p className="tax-intro">
            And measured against their wealth, where they pay just{" "}
            <strong>{pct(bill.pctOfWealth)}</strong>:
          </p>
          <Scenario
            label={`If they paid your wealth rate (${pct(wealthRate)})`}
            take={tt.currentReceiptsGbp + extraW}
            extra={extraW}
          />
        </>
      )}

      <details className="tax-assumptions">
        <summary>How this is worked out</summary>
        <ul>
          <li>
            Top 0.1% wealth: {pct(tt.top01WealthShare)} of {gbp(tt.totalHouseholdWealthGbp)}{" "}
            = {gbp(top01Wealth)}, earning {gbp(econIncome)} a year
          </li>
          <li>
            Income: they pay ~{pct(bill.pctOfEconomicIncome)} now; at your{" "}
            {pct(incomeRate)} → +{gbp(extraInc)}
          </li>
          {wealthRate != null && (
            <li>
              Wealth: they pay {pct(bill.pctOfWealth)} now; at your {pct(wealthRate)}{" "}
              → +{gbp(extraW)}
            </li>
          )}
        </ul>
        <p className="tax-scope">
          Illustrative — uses this dashboard&apos;s billionaire assumptions and
          your own figures from above.
        </p>
      </details>
    </section>
  );
}
