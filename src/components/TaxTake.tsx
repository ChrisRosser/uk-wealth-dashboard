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
  const w2 = t.wealthTax2pct;
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

      <p className="tax-intro">
        You don&apos;t have to take this dashboard&apos;s word for the scale. The
        most prominent proposal — a <strong>{w2.ratePct}% a year tax on wealth
        over {gbp(w2.thresholdGbp)}</strong>, touching about{" "}
        {w2.peopleAffected.toLocaleString("en-GB")} people (0.04% of the
        population) — is independently estimated to raise{" "}
        <strong>{gbp(w2.revenueGbp)}</strong> a year.{" "}
        <strong>{w2.millionairesSupportPct}% of UK millionaires</strong> support
        it; just {w2.votersOpposePct}% of voters oppose it.
      </p>

      <Scenario
        label={`A ${w2.ratePct}% wealth tax over ${gbp(w2.thresholdGbp)} (Tax Justice UK)`}
        take={tt.currentReceiptsGbp + w2.revenueGbp}
        extra={w2.revenueGbp}
      />

      <details className="tax-assumptions">
        <summary>Wouldn&apos;t they just leave?</summary>
        <p>
          Far less than the headlines suggest. Across the academic literature,
          exit is rare and avoidance is common: US millionaires move between
          states <em>less</em> than the general population (2.4% vs 2.9% a
          year), despite zero-tax states existing. When Norway raised its wealth
          tax in 2022 some large fortunes did leave — but revenue still rose,
          and researchers found no effect on firms&apos; investment or
          employment. And design matters most of all: land and property
          can&apos;t emigrate, and a one-off levy assessed on past wealth (the
          Wealth Tax Commission&apos;s preferred design) can&apos;t be dodged by
          leaving at all.
        </p>
      </details>

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
